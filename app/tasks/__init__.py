"""Tâches de fond exécutées via FastAPI BackgroundTasks.

Isolation stricte des sessions SQL : chaque tâche ouvre sa propre session via
`SessionLocal()` plutôt que de réutiliser celle de la requête HTTP qui l'a
déclenchée. La session de la requête est fermée dès que la réponse part vers
le client (speed-to-lead) ; la tâche de fond s'exécute après coup, parfois
bien après — lui faire partager une session déjà sortie de son contexte
provoquerait des accès concurrents sur une transaction fermée et des
corruptions de session sous charge. Pas de Celery/Redis pour ce MVP : ce
module reste le seul point d'entrée pour ce type de traitement asynchrone.
"""

import logging

import httpx

import app.models  # noqa: F401 — enregistre tous les modèles (relationships cross-fichiers)
from app.config import get_settings
from app.db.session import SessionLocal
from app.models.dealer import Dealer
from app.models.lead import Lead, LeadStatus, LeadType

logger = logging.getLogger("datrovo.tasks")
settings = get_settings()


async def route_lead_to_crm(lead_id: int) -> None:
    """Pousse un lead vers le CRM du concessionnaire concerné.

    Ouvre et referme sa propre session DB, totalement étanche par rapport à
    celle de la requête HTTP d'origine.
    """
    async with SessionLocal() as db:
        lead = await db.get(Lead, lead_id)
        if lead is None:
            logger.error("lead_not_found", extra={"lead_id": lead_id})
            return

        dealer = await db.get(Dealer, lead.dealer_id)
        if dealer is None or not dealer.crm_webhook_url:
            lead.status = LeadStatus.FAILED
            await db.commit()
            logger.warning(
                "dealer_crm_not_configured",
                extra={"lead_id": lead_id, "dealer_id": lead.dealer_id},
            )
            return

        if lead.lead_type == LeadType.REPRISE:
            payload = {
                "lead_type": "reprise",
                "full_name": lead.full_name,
                "phone": lead.phone,
                "email": lead.email,
                "postal_code": lead.postal_code,
                "client_plate": lead.client_plate,
                "client_vehicle_details": lead.client_vehicle_details,
                "source": lead.source,
            }
        else:
            payload = {
                "lead_type": "achat",
                "full_name": lead.full_name,
                "phone": lead.phone,
                "email": lead.email,
                "postal_code": lead.postal_code,
                "vehicle_id": lead.vehicle_id,
                "vehicle": f"{lead.vehicle_brand} {lead.vehicle_model}",
                "source": lead.source,
            }

        try:
            async with httpx.AsyncClient(timeout=settings.crm_dispatch_timeout_seconds) as client:
                response = await client.post(
                    dealer.crm_webhook_url,
                    json=payload,
                    headers={"Authorization": f"Bearer {dealer.crm_api_key}"},
                )
            lead.crm_response_code = response.status_code
            lead.status = LeadStatus.ROUTED if response.is_success else LeadStatus.FAILED
        except httpx.HTTPError:
            logger.exception(
                "crm_dispatch_failed", extra={"lead_id": lead.id, "dealer_id": dealer.id}
            )
            lead.status = LeadStatus.FAILED
        finally:
            await db.commit()
