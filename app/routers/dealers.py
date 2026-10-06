from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.dealer import Dealer
from app.schemas.dealer import DealerCreate, DealerPublicRead, DealerRead

router = APIRouter(prefix="/dealers", tags=["dealers"])


@router.post("", response_model=DealerRead, status_code=status.HTTP_201_CREATED)
async def create_dealer(
    payload: DealerCreate,
    db: AsyncSession = Depends(get_db),
) -> Dealer:
    dealer = Dealer(
        name=payload.name,
        crm_webhook_url=str(payload.crm_webhook_url) if payload.crm_webhook_url else None,
        crm_api_key=payload.crm_api_key,
    )
    db.add(dealer)
    await db.commit()
    await db.refresh(dealer)

    return dealer


@router.get("/{dealer_id}", response_model=DealerPublicRead)
async def get_dealer(dealer_id: int, db: AsyncSession = Depends(get_db)) -> Dealer:
    dealer = await db.get(Dealer, dealer_id)
    if dealer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concessionnaire introuvable.")
    return dealer
