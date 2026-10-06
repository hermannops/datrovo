from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.vehicle import FuelType, TransmissionType


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dealer_id: int
    brand: str
    model: str
    trim_level: str | None
    price: Decimal
    mileage: int
    year: int
    fuel_type: FuelType
    transmission: TransmissionType
    city: str
    images_urls: list[str]
    created_at: datetime
    updated_at: datetime
