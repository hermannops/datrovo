from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.vehicle import FuelType, Vehicle
from app.schemas.vehicle import VehicleRead

router = APIRouter(prefix="/vehicles", tags=["vehicles"])


@router.get("", response_model=list[VehicleRead])
async def list_vehicles(
    dealer_id: int | None = None,
    brand: str | None = None,
    model: str | None = None,
    city: str | None = None,
    fuel_type: FuelType | None = None,
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[Vehicle]:
    stmt = select(Vehicle)

    if dealer_id is not None:
        stmt = stmt.where(Vehicle.dealer_id == dealer_id)
    if brand is not None:
        stmt = stmt.where(Vehicle.brand.ilike(brand))
    if model is not None:
        stmt = stmt.where(Vehicle.model.ilike(model))
    if city is not None:
        stmt = stmt.where(Vehicle.city.ilike(city))
    if fuel_type is not None:
        stmt = stmt.where(Vehicle.fuel_type == fuel_type)
    if min_price is not None:
        stmt = stmt.where(Vehicle.price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Vehicle.price <= max_price)

    stmt = stmt.order_by(Vehicle.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{vehicle_id}", response_model=VehicleRead)
async def get_vehicle(vehicle_id: int, db: AsyncSession = Depends(get_db)) -> Vehicle:
    vehicle = await db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Véhicule introuvable.")
    return vehicle
