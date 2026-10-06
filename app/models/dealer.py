from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Dealer(Base):
    __tablename__ = "dealers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    crm_webhook_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    crm_api_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    stock_feed_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    leads = relationship("Lead", back_populates="dealer")
    vehicles = relationship("Vehicle", back_populates="dealer")
