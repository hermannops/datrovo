import enum
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, Enum as SAEnum, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class LeadStatus(str, enum.Enum):
    PENDING = "pending"
    ROUTED = "routed"
    FAILED = "failed"
    DUPLICATE = "duplicate"


class LeadType(str, enum.Enum):
    ACHAT = "achat"
    REPRISE = "reprise"


class Lead(Base):
    __tablename__ = "leads"
    __table_args__ = (
        # Dédup achat : (phone, dealer_id) — pas de contrainte UNIQUE, le même
        # contact doit redevenir vendable au même dealer une fois la fenêtre
        # de 30 jours expirée (voir is_duplicate_achat_lead).
        Index("ix_leads_phone_dealer", "phone", "dealer_id"),
        # Dédup reprise : (phone, client_plate) — la plaque remplace le dealer
        # comme clé, un lead reprise n'étant rattaché à aucun concessionnaire
        # précis au moment de la capture (voir is_duplicate_reprise_lead).
        Index("ix_leads_phone_plate", "phone", "client_plate"),
        CheckConstraint(
            "(lead_type = 'achat' AND vehicle_brand IS NOT NULL AND vehicle_model IS NOT NULL) "
            "OR (lead_type = 'reprise' AND client_plate IS NOT NULL)",
            name="ck_leads_type_consistency",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_type: Mapped[LeadType] = mapped_column(SAEnum(LeadType), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[str] = mapped_column(String(10), nullable=False)

    # --- Achat : lead rattaché à une annonce précise de notre catalogue ---
    # ondelete="SET NULL" : si l'annonce disparaît du flux XML (vendue chez le
    # dealer, retirée), le DELETE de app/services/xml_parser.py ne doit pas
    # échouer sur une violation de contrainte FK ni emporter le lead avec lui.
    vehicle_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    # Dénormalisés depuis Vehicle à la création du lead : restent lisibles
    # (CRM, historique) même si vehicle_id devient NULL plus tard.
    vehicle_brand: Mapped[str | None] = mapped_column(String(60), nullable=True)
    vehicle_model: Mapped[str | None] = mapped_column(String(60), nullable=True)
    dealer_id: Mapped[int] = mapped_column(ForeignKey("dealers.id"), nullable=False, index=True)

    # --- Reprise : lead sur le véhicule du client, hors catalogue ---
    # String(64) et non String(15) : ce champ sert aussi de clé de dédup pour
    # les leads scrapés (app/tasks/sniper.py), qui y stockent l'external_ref
    # de l'annonce tant que la vraie plaque n'est pas connue — ces
    # identifiants de plateforme peuvent largement dépasser la longueur d'une
    # plaque d'immatriculation.
    client_plate: Mapped[str | None] = mapped_column(String(64), nullable=True)
    client_vehicle_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    status: Mapped[LeadStatus] = mapped_column(
        SAEnum(LeadStatus), default=LeadStatus.PENDING, nullable=False
    )
    crm_response_code: Mapped[int | None] = mapped_column(nullable=True)
    # timezone=True -> TIMESTAMPTZ : requis pour comparer avec des datetimes
    # aware (datetime.now(timezone.utc)) dans la dédup applicative.
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dealer = relationship("Dealer", back_populates="leads")
    vehicle = relationship("Vehicle", back_populates="leads")
