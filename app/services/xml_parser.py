"""Ingestion asynchrone des flux XML de stock concessionnaire (format
standard La Centrale / Leboncoin Pro : balises <annonce> avec id, marque,
modele, prix, kilometrage, annee, carburant, boite, ville, photos/photo*).

Stratégie de synchronisation "full sync" par watermark temporel, pour gérer
insert/update/delete sans diff manuel entre ancien et nouveau stock :

1. On mémorise l'instant de début de sync (`sync_started_at`).
2. Chaque annonce lue dans le flux est upsert (INSERT ... ON CONFLICT DO
   UPDATE sur la clé (dealer_id, external_ref)) avec `last_synced_at` mis à
   `sync_started_at`.
3. Une fois le flux entièrement consommé, tout véhicule de ce dealer dont
   `last_synced_at` est antérieur à `sync_started_at` n'a pas été revu dans
   ce passage -> il a disparu du flux -> on le supprime.

Conçu pour tourner en BackgroundTasks (déclenché depuis une route) ou en
script CRON autonome (voir le bloc __main__ en bas de fichier).
"""

import argparse
import asyncio
import logging
from collections.abc import AsyncIterator
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from io import BytesIO

import httpx
from lxml import etree
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

import app.models  # noqa: F401 — enregistre tous les modèles (relationships cross-fichiers)
from app.db.session import SessionLocal
from app.models.dealer import Dealer
from app.models.vehicle import FuelType, TransmissionType, Vehicle

logger = logging.getLogger("datrovo.xml_parser")

FEED_DOWNLOAD_TIMEOUT_SECONDS = 60.0

# Libellés texte observés dans les flux -> enum interne.
# À étendre si un nouveau DMS/flux utilise d'autres libellés.
FUEL_TYPE_MAP: dict[str, FuelType] = {
    "essence": FuelType.ESSENCE,
    "diesel": FuelType.DIESEL,
    "hybride": FuelType.HYBRIDE,
    "electrique": FuelType.ELECTRIQUE,
    "électrique": FuelType.ELECTRIQUE,
    "gpl": FuelType.GPL,
}

TRANSMISSION_MAP: dict[str, TransmissionType] = {
    "manuelle": TransmissionType.MANUELLE,
    "mecanique": TransmissionType.MANUELLE,
    "automatique": TransmissionType.AUTOMATIQUE,
}


class VehicleFeedItem:
    """DTO intermédiaire entre une balise <annonce> et le modèle SQLAlchemy."""

    __slots__ = (
        "external_ref",
        "brand",
        "model",
        "trim_level",
        "price",
        "mileage",
        "year",
        "fuel_type",
        "transmission",
        "city",
        "images_urls",
    )

    def __init__(
        self,
        external_ref: str,
        brand: str,
        model: str,
        trim_level: str | None,
        price: Decimal,
        mileage: int,
        year: int,
        fuel_type: FuelType,
        transmission: TransmissionType,
        city: str,
        images_urls: list[str],
    ) -> None:
        self.external_ref = external_ref
        self.brand = brand
        self.model = model
        self.trim_level = trim_level
        self.price = price
        self.mileage = mileage
        self.year = year
        self.fuel_type = fuel_type
        self.transmission = transmission
        self.city = city
        self.images_urls = images_urls


def _text(node: etree._Element, tag: str) -> str | None:
    child = node.find(tag)
    if child is None or child.text is None:
        return None
    value = child.text.strip()
    return value or None


def _parse_decimal(value: str | None) -> Decimal | None:
    if not value:
        return None
    try:
        return Decimal(value.replace(" ", "").replace(",", "."))
    except InvalidOperation:
        return None


def _parse_int(value: str | None) -> int | None:
    if not value:
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    return int(digits) if digits else None


def _parse_annonce(node: etree._Element) -> VehicleFeedItem | None:
    external_ref = _text(node, "id") or _text(node, "ref")
    brand = _text(node, "marque")
    model = _text(node, "modele")
    price = _parse_decimal(_text(node, "prix"))
    mileage = _parse_int(_text(node, "kilometrage"))
    year = _parse_int(_text(node, "annee"))

    if not external_ref or not brand or not model or price is None or mileage is None or year is None:
        logger.warning("annonce_incomplete_ignoree", extra={"external_ref": external_ref})
        return None

    fuel_raw = (_text(node, "carburant") or "").lower()
    transmission_raw = (_text(node, "boite") or "").lower()

    images_urls = [
        photo.text.strip()
        for photo in node.findall("photos/photo")
        if photo.text and photo.text.strip()
    ]

    return VehicleFeedItem(
        external_ref=external_ref,
        brand=brand,
        model=model,
        trim_level=_text(node, "finition"),
        price=price,
        mileage=mileage,
        year=year,
        fuel_type=FUEL_TYPE_MAP.get(fuel_raw, FuelType.ESSENCE),
        transmission=TRANSMISSION_MAP.get(transmission_raw, TransmissionType.MANUELLE),
        city=_text(node, "ville") or "",
        images_urls=images_urls,
    )


async def _iter_feed_items(feed_url: str) -> AsyncIterator[VehicleFeedItem]:
    """Télécharge le flux en streaming puis parse les <annonce> via
    iterparse, en libérant chaque noeud au fur et à mesure pour garder une
    empreinte mémoire constante sur de gros flux (plusieurs dizaines de
    milliers d'annonces chez certains groupes de distribution)."""
    async with httpx.AsyncClient(timeout=FEED_DOWNLOAD_TIMEOUT_SECONDS) as client:
        async with client.stream("GET", feed_url) as response:
            response.raise_for_status()
            buffer = BytesIO()
            async for chunk in response.aiter_bytes():
                buffer.write(chunk)

    buffer.seek(0)
    context = etree.iterparse(buffer, events=("end",), tag="annonce")
    for _, node in context:
        item = _parse_annonce(node)
        if item is not None:
            yield item
        node.clear()
        while node.getprevious() is not None:
            del node.getparent()[0]


async def _upsert_vehicle(
    db: AsyncSession, dealer_id: int, item: VehicleFeedItem, sync_started_at: datetime
) -> None:
    stmt = pg_insert(Vehicle).values(
        dealer_id=dealer_id,
        external_ref=item.external_ref,
        brand=item.brand,
        model=item.model,
        trim_level=item.trim_level,
        price=item.price,
        mileage=item.mileage,
        year=item.year,
        fuel_type=item.fuel_type,
        transmission=item.transmission,
        city=item.city,
        images_urls=item.images_urls,
        last_synced_at=sync_started_at,
    )
    stmt = stmt.on_conflict_do_update(
        constraint="uq_vehicles_dealer_external_ref",
        set_={
            "brand": stmt.excluded.brand,
            "model": stmt.excluded.model,
            "trim_level": stmt.excluded.trim_level,
            "price": stmt.excluded.price,
            "mileage": stmt.excluded.mileage,
            "year": stmt.excluded.year,
            "fuel_type": stmt.excluded.fuel_type,
            "transmission": stmt.excluded.transmission,
            "city": stmt.excluded.city,
            "images_urls": stmt.excluded.images_urls,
            "last_synced_at": stmt.excluded.last_synced_at,
            # L'INSERT ... ON CONFLICT est une opération Core : le
            # onupdate=func.now() du modèle (déclenché par le flush ORM)
            # ne s'applique pas ici, donc on le force explicitement.
            "updated_at": func.now(),
        },
    )
    await db.execute(stmt)


async def sync_dealer_stock(dealer_id: int, feed_url: str) -> None:
    """Synchronise l'intégralité du stock d'un concessionnaire depuis son
    flux XML : upsert des annonces présentes, suppression de celles qui ont
    disparu. Ouvre sa propre session DB, isolée de tout appelant (même
    pattern que app/tasks.py)."""
    sync_started_at = datetime.now(timezone.utc)
    upserted_count = 0

    async with SessionLocal() as db:
        try:
            async for item in _iter_feed_items(feed_url):
                await _upsert_vehicle(db, dealer_id, item, sync_started_at)
                upserted_count += 1
            await db.commit()
        except httpx.HTTPError:
            logger.exception(
                "feed_download_failed", extra={"dealer_id": dealer_id, "feed_url": feed_url}
            )
            await db.rollback()
            return

        delete_stmt = delete(Vehicle).where(
            Vehicle.dealer_id == dealer_id,
            Vehicle.last_synced_at < sync_started_at,
        )
        result = await db.execute(delete_stmt)
        await db.commit()

    logger.info(
        "dealer_stock_synced",
        extra={
            "dealer_id": dealer_id,
            "upserted": upserted_count,
            "removed": result.rowcount,
        },
    )


async def sync_all_dealers() -> None:
    """Point d'entrée CRON : synchronise tous les dealers ayant un
    `stock_feed_url` configuré. Les syncs sont séquentielles par dealer
    (chacune ouvre/ferme sa propre session) pour rester simple et éviter de
    saturer le pool de connexions sur un run planifié."""
    async with SessionLocal() as db:
        result = await db.execute(
            select(Dealer.id, Dealer.stock_feed_url).where(Dealer.stock_feed_url.is_not(None))
        )
        dealers = result.all()

    for dealer_id, feed_url in dealers:
        await sync_dealer_stock(dealer_id, feed_url)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    cli_parser = argparse.ArgumentParser(
        description="Synchronise le stock véhicules depuis un flux XML concessionnaire."
    )
    cli_parser.add_argument("--dealer-id", type=int, help="Synchronise un seul dealer.")
    cli_parser.add_argument("--feed-url", type=str, help="URL du flux XML (requis avec --dealer-id).")
    args = cli_parser.parse_args()

    if args.dealer_id is not None:
        if not args.feed_url:
            cli_parser.error("--feed-url est requis avec --dealer-id")
        asyncio.run(sync_dealer_stock(args.dealer_id, args.feed_url))
    else:
        asyncio.run(sync_all_dealers())
