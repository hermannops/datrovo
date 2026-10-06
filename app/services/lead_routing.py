from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.lead import Lead, LeadType

settings = get_settings()


async def is_duplicate_achat_lead(db: AsyncSession, phone: str, dealer_id: int) -> bool:
    """Dédup achat sur (phone, dealer_id) via la fenêtre glissante de
    `lead_dedup_window_days`. Volontairement pas de contrainte UNIQUE en BDD :
    le même contact doit redevenir vendable au même dealer une fois la
    fenêtre expirée."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.lead_dedup_window_days)
    stmt = select(Lead.id).where(
        Lead.phone == phone,
        Lead.dealer_id == dealer_id,
        Lead.lead_type == LeadType.ACHAT,
        Lead.created_at >= cutoff,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def is_duplicate_reprise_lead(db: AsyncSession, phone: str, client_plate: str) -> bool:
    """Dédup reprise sur (phone, client_plate) : la plaque remplace le dealer
    comme clé, un lead reprise n'étant rattaché à aucun concessionnaire
    précis au moment de la capture."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.lead_dedup_window_days)
    stmt = select(Lead.id).where(
        Lead.phone == phone,
        Lead.client_plate == client_plate,
        Lead.lead_type == LeadType.REPRISE,
        Lead.created_at >= cutoff,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None
