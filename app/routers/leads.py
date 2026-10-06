from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import get_db
from app.models.lead import Lead, LeadStatus, LeadType
from app.models.vehicle import Vehicle
from app.schemas.lead import AchatLeadCreate, LeadCreate, LeadRead, RepriseLeadCreate
from app.services.lead_routing import is_duplicate_achat_lead, is_duplicate_reprise_lead
from app.tasks import route_lead_to_crm

router = APIRouter(prefix="/leads", tags=["leads"])
settings = get_settings()


@router.post("", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> Lead:
    if isinstance(payload, AchatLeadCreate):
        lead = await _build_achat_lead(db, payload)
    else:
        lead = await _build_reprise_lead(db, payload)

    db.add(lead)
    await db.commit()
    await db.refresh(lead)

    # route_lead_to_crm ouvre sa PROPRE session (SessionLocal) : la session
    # `db` ci-dessus se referme avec la requête HTTP et n'est jamais réutilisée
    # par la tâche de fond, qui s'exécute après la réponse au client.
    background_tasks.add_task(route_lead_to_crm, lead.id)

    return lead


async def _build_achat_lead(db: AsyncSession, payload: AchatLeadCreate) -> Lead:
    vehicle = await db.get(Vehicle, payload.vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Véhicule introuvable.")

    # dealer_id vient TOUJOURS du véhicule, jamais du client : évite qu'un
    # payload falsifié route un lead vers un dealer qui n'a pas cette annonce.
    if await is_duplicate_achat_lead(db, payload.phone, vehicle.dealer_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lead déjà routé vers ce concessionnaire sur la fenêtre de 30 jours.",
        )

    return Lead(
        lead_type=LeadType.ACHAT,
        source=payload.source,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        postal_code=payload.postal_code,
        vehicle_id=vehicle.id,
        vehicle_brand=vehicle.brand,
        vehicle_model=vehicle.model,
        dealer_id=vehicle.dealer_id,
        status=LeadStatus.PENDING,
    )


async def _build_reprise_lead(db: AsyncSession, payload: RepriseLeadCreate) -> Lead:
    if await is_duplicate_reprise_lead(db, payload.phone, payload.client_plate):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Demande de reprise déjà enregistrée pour cette plaque sur la fenêtre de 30 jours.",
        )

    return Lead(
        lead_type=LeadType.REPRISE,
        source=payload.source,
        full_name=payload.full_name,
        phone=payload.phone,
        email=payload.email,
        postal_code=payload.postal_code,
        client_plate=payload.client_plate,
        client_vehicle_details=payload.client_vehicle_details,
        dealer_id=settings.reprise_default_dealer_id,
        status=LeadStatus.PENDING,
    )
