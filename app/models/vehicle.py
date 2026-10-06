import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    ARRAY,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FuelType(str, enum.Enum):
    ESSENCE = "essence"
    DIESEL = "diesel"
    HYBRIDE = "hybride"
    ELECTRIQUE = "electrique"
    GPL = "gpl"


class TransmissionType(str, enum.Enum):
    MANUELLE = "manuelle"
    AUTOMATIQUE = "automatique"


class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = (
        # Clé d'upsert pour la synchronisation XML : un même external_ref ne
        # peut désigner qu'une annonce par concessionnaire.
        UniqueConstraint("dealer_id", "external_ref", name="uq_vehicles_dealer_external_ref"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    dealer_id: Mapped[int] = mapped_column(ForeignKey("dealers.id"), nullable=False, index=True)
    # Identifiant de l'annonce dans le flux XML source (La Centrale, Leboncoin Pro, DMS...).
    external_ref: Mapped[str] = mapped_column(String(120), nullable=False)

    brand: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    model: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    trim_level: Mapped[str | None] = mapped_column(String(120), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    mileage: Mapped[int] = mapped_column(nullable=False)
    year: Mapped[int] = mapped_column(nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(SAEnum(FuelType), nullable=False)
    transmission: Mapped[TransmissionType] = mapped_column(SAEnum(TransmissionType), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    images_urls: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, server_default="{}")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    # Horodatage du dernier passage de sync XML où cette annonce était encore
    # présente dans le flux ; sert de watermark pour détecter les annonces
    # retirées (voir app/services/xml_parser.py).
    last_synced_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dealer = relationship("Dealer", back_populates="vehicles")
    leads = relationship("Lead", back_populates="vehicle")
