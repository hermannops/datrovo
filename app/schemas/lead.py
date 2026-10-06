from datetime import datetime
from enum import Enum
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LeadSource(str, Enum):
    TRADE_IN_SCRAPER = "trade_in_scraper"
    SEO_LANDING = "seo_landing"
    MANUAL = "manual"


class LeadType(str, Enum):
    ACHAT = "achat"
    REPRISE = "reprise"


class _LeadContactBase(BaseModel):
    source: LeadSource
    full_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(pattern=r"^\+?[0-9]{8,15}$")
    email: EmailStr | None = None
    postal_code: str = Field(min_length=4, max_length=10)


class AchatLeadCreate(_LeadContactBase):
    """Lead lié à une annonce précise du catalogue : dealer_id et
    vehicle_brand/model sont dérivés de vehicle_id côté serveur, jamais
    acceptés tels quels du client (évite un dealer_id incohérent avec le
    véhicule réellement consulté)."""

    lead_type: Literal[LeadType.ACHAT] = LeadType.ACHAT
    vehicle_id: int


class RepriseLeadCreate(_LeadContactBase):
    """Lead sur le véhicule du client (reprise cash) : pas de dealer_id ni de
    vehicle_id côté client, le véhicule n'étant pas dans notre catalogue."""

    lead_type: Literal[LeadType.REPRISE] = LeadType.REPRISE
    client_plate: str = Field(min_length=4, max_length=15)
    client_vehicle_details: dict | None = None


LeadCreate = Annotated[
    Union[AchatLeadCreate, RepriseLeadCreate],
    Field(discriminator="lead_type"),
]


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_type: LeadType
    status: str
    created_at: datetime
    dealer_id: int
