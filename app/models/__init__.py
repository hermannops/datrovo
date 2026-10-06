"""Importer ce package suffit à enregistrer tous les modèles auprès de
Base.registry, quel que soit le point d'entrée (API, script CRON, Alembic).
Nécessaire car les relationships inter-modèles sont déclarées par nom de
classe en string (ex: Dealer.leads = relationship("Lead", ...))."""

from app.models.dealer import Dealer
from app.models.lead import Lead
from app.models.vehicle import Vehicle

__all__ = ["Dealer", "Lead", "Vehicle"]
