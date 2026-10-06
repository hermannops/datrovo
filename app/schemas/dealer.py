from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class DealerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    crm_webhook_url: HttpUrl | None = None
    crm_api_key: str | None = Field(default=None, max_length=255)


class DealerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    crm_webhook_url: str | None


class DealerPublicRead(BaseModel):
    """Vue publique d'un dealer (ex: carte "vendu par" sur une fiche
    véhicule) — ne JAMAIS exposer crm_webhook_url/crm_api_key ici, ce sont
    des détails d'intégration interne, pas des infos destinées au visiteur."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
