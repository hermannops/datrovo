from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://datrovo:datrovo@localhost:5432/datrovo"
    crm_dispatch_timeout_seconds: float = 5.0
    lead_dedup_window_days: int = 30
    # Dealer "receveur" par défaut pour les leads de reprise : à la capture,
    # un lead reprise n'est pas encore rattaché à un concessionnaire précis
    # (contrairement à l'achat, où le dealer vient de l'annonce consultée).
    reprise_default_dealer_id: int = 1


@lru_cache
def get_settings() -> Settings:
    return Settings()
