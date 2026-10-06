"""Sniper B2C : scrape les annonces de véhicules postées par des particuliers
sur une plateforme d'annonces tierce, et crée des leads de reprise
("sniping", voir le contexte métier Datrovo) prêts à être qualifiés.

Architecture : Playwright async (un vrai moteur de navigateur, nécessaire
pour les sites protégés par anti-bot / rendu JS) + une session DB isolée par
exécution, même discipline que app/tasks/__init__.py et
app/services/xml_parser.py : `async with SessionLocal() as db:` ouvert et
refermé localement, jamais une session partagée avec un appelant HTTP.

Dédup : chaque plateforme d'annonces attribue un identifiant unique à chaque
annonce (son `external_ref`). On le stocke dans `Lead.client_plate` — avant
qualification, le lead n'a pas encore de VRAIE plaque d'immatriculation (on
ne l'obtient qu'en échangeant avec le vendeur), donc ce champ sert de clé de
dédup provisoire pour ne jamais re-scraper/re-créer la même annonce deux
fois. Une fois le vendeur qualifié (étape future, non couverte ici), la
vraie plaque remplacera cette valeur.

IMPORTANT — ce que ce script NE fait PAS volontairement :
- Il n'appelle PAS route_lead_to_crm. Un lead scrappé n'est qu'un PROSPECT :
  le vendeur n'a rien soumis lui-même et n'a donné aucun consentement à ce
  que ses coordonnées soient transmises à un concessionnaire tiers. Les
  transmettre à un CRM à ce stade serait un partage de données personnelles
  non consenti. Le lead reste en statut PENDING jusqu'à une étape de
  qualification (ex: SMS opt-in, non implémentée ici) qui le fait basculer
  dans le pipeline standard.
- Il n'envoie aucun SMS. L'envoi de SMS marketing non sollicité à des
  particuliers scrapés est encadré en France (consentement préalable requis,
  art. L34-5 du Code des postes et des communications électroniques / RGPD)
  : à traiter comme un chantier à part, avec revue de conformité dédiée,
  avant toute automatisation d'envoi.
- Il n'inclut aucune technique d'évasion anti-bot agressive (rotation de
  proxies, résolution de CAPTCHA, usurpation d'empreinte navigateur). Juste
  un Chromium piloté par Playwright avec un user-agent standard.

Sélecteurs CSS : volontairement génériques/illustratifs ci-dessous — la
structure HTML réelle dépend entièrement de la plateforme ciblée (non
précisée). À adapter après inspection du site réel avant toute exécution en
production (voir SELECTORS ci-dessous).
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import re
from dataclasses import dataclass

from playwright.async_api import Page, async_playwright
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

import app.models  # noqa: F401 — enregistre tous les modèles (relationships cross-fichiers)
from app.config import get_settings
from app.db.session import SessionLocal
from app.models.lead import Lead, LeadStatus, LeadType
from app.schemas.lead import LeadSource

logger = logging.getLogger("datrovo.sniper")
settings = get_settings()

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# --- Sélecteurs CSS : TODO adapter à la plateforme réellement ciblée -------
# Ceux-ci sont des exemples illustratifs (pattern "carte d'annonce" commun à
# beaucoup de sites de petites annonces), pas une structure vérifiée.
SELECTORS = {
    "ad_card": "[data-testid='ad-card']",
    "ad_link": "a",
    "ad_title": "[data-testid='ad-title']",
    "ad_price": "[data-testid='ad-price']",
    "ad_location": "[data-testid='ad-location']",
    "reveal_phone_button": "button:has-text('Voir le numéro')",
    "phone_text": "[data-testid='ad-phone']",
}

POSTAL_CODE_RE = re.compile(r"\b(\d{5})\b")


@dataclass
class ScrapedAd:
    external_ref: str
    detail_url: str
    title: str
    price: str | None
    location_text: str | None


def _extract_postal_code(location_text: str | None, fallback: str) -> str:
    """Beaucoup de sites affichent "Ville (75011)" dans le libellé de
    localisation : on tente de l'en extraire. À défaut, on retombe sur le
    nom de ville tel quel — un vrai code postal manquant plutôt qu'inventé
    serait pire (Lead.postal_code est NOT NULL, donc une valeur imparfaite
    mais traçable vaut mieux qu'un blocage total de l'ingestion)."""
    if location_text:
        match = POSTAL_CODE_RE.search(location_text)
        if match:
            return match.group(1)
    return fallback[:10]


async def _list_ad_summaries(page: Page, search_url: str, max_results: int) -> list[ScrapedAd]:
    await page.goto(search_url, wait_until="domcontentloaded")

    cards = page.locator(SELECTORS["ad_card"])
    count = min(await cards.count(), max_results)

    summaries: list[ScrapedAd] = []
    for index in range(count):
        card = cards.nth(index)
        link = card.locator(SELECTORS["ad_link"]).first
        href = await link.get_attribute("href")
        if not href:
            continue

        detail_url = href if href.startswith("http") else f"{page.url.split('/', 3)[0]}//{page.url.split('/', 3)[2]}{href}"
        # L'external_ref est dérivé de l'URL de l'annonce (dernier segment
        # numérique) : motif courant, mais à vérifier contre la plateforme
        # réelle — certains sites exposent l'ID via un attribut data-* dédié,
        # plus fiable qu'un parsing d'URL.
        ref_match = re.search(r"(\d{6,})", detail_url)
        if not ref_match:
            logger.warning("ad_external_ref_introuvable", extra={"detail_url": detail_url})
            continue

        title = (await card.locator(SELECTORS["ad_title"]).first.text_content() or "").strip()
        price = (await card.locator(SELECTORS["ad_price"]).first.text_content() or "").strip() or None
        location = (await card.locator(SELECTORS["ad_location"]).first.text_content() or "").strip() or None

        summaries.append(
            ScrapedAd(
                external_ref=ref_match.group(1),
                detail_url=detail_url,
                title=title,
                price=price,
                location_text=location,
            )
        )

    return summaries


async def _reveal_contact(page: Page, detail_url: str) -> tuple[str | None, str | None]:
    """Visite la page de détail et tente de révéler le numéro du vendeur.
    Renvoie (nom_affiché, téléphone) — l'un ou l'autre peut être None si la
    plateforme ne les expose pas publiquement (cas fréquent : beaucoup de
    sites masquent le numéro derrière une action explicite, voire un
    captcha, auquel cas ce lead est simplement ignoré plutôt que créé avec
    un téléphone inventé)."""
    await page.goto(detail_url, wait_until="domcontentloaded")

    seller_name: str | None = None
    name_locator = page.locator("[data-testid='seller-name']").first
    if await name_locator.count() > 0:
        seller_name = (await name_locator.text_content() or "").strip() or None

    reveal_button = page.locator(SELECTORS["reveal_phone_button"]).first
    if await reveal_button.count() > 0:
        try:
            await reveal_button.click(timeout=3000)
            await page.wait_for_timeout(500)
        except Exception:  # bouton absent/non cliquable sur cette annonce
            logger.debug("reveal_phone_button_non_cliquable", extra={"detail_url": detail_url})

    phone_locator = page.locator(SELECTORS["phone_text"]).first
    phone: str | None = None
    if await phone_locator.count() > 0:
        raw_phone = (await phone_locator.text_content() or "").strip()
        digits = re.sub(r"\D", "", raw_phone)
        if len(digits) >= 8:
            phone = digits

    return seller_name, phone


async def _is_already_scraped(db: AsyncSession, external_ref: str) -> bool:
    stmt = select(Lead.id).where(
        Lead.lead_type == LeadType.REPRISE,
        Lead.source == LeadSource.TRADE_IN_SCRAPER.value,
        Lead.client_plate == external_ref,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none() is not None


async def run_sniper(
    search_url: str,
    max_results: int = 30,
    delay_seconds: float = 2.0,
    headless: bool = True,
) -> None:
    created_count = 0
    skipped_duplicate = 0
    skipped_no_phone = 0

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=headless)
        context = await browser.new_context(user_agent=USER_AGENT, locale="fr-FR")
        page = await context.new_page()

        try:
            summaries = await _list_ad_summaries(page, search_url, max_results)
            logger.info("annonces_listees", extra={"count": len(summaries), "search_url": search_url})

            for summary in summaries:
                async with SessionLocal() as db:
                    if await _is_already_scraped(db, summary.external_ref):
                        skipped_duplicate += 1
                        continue

                seller_name, phone = await _reveal_contact(page, summary.detail_url)
                await page.wait_for_timeout(int(delay_seconds * 1000))

                if not phone:
                    skipped_no_phone += 1
                    logger.info(
                        "annonce_sans_telephone_ignoree",
                        extra={"external_ref": summary.external_ref, "detail_url": summary.detail_url},
                    )
                    continue

                async with SessionLocal() as db:
                    lead = Lead(
                        lead_type=LeadType.REPRISE,
                        source=LeadSource.TRADE_IN_SCRAPER.value,
                        full_name=(seller_name or summary.title or "Vendeur particulier")[:120],
                        phone=phone,
                        email=None,
                        postal_code=_extract_postal_code(summary.location_text, fallback=summary.location_text or ""),
                        client_plate=summary.external_ref,
                        client_vehicle_details={
                            "titre_annonce": summary.title,
                            "prix_annonce": summary.price,
                            "localisation_annonce": summary.location_text,
                            "url_annonce": summary.detail_url,
                        },
                        dealer_id=settings.reprise_default_dealer_id,
                        # PENDING et non ROUTED : volontairement pas dispatché
                        # au CRM d'un dealer (voir docstring du module).
                        status=LeadStatus.PENDING,
                    )
                    db.add(lead)
                    await db.commit()
                    created_count += 1
                    logger.info("lead_scrape_cree", extra={"external_ref": summary.external_ref})
        finally:
            await browser.close()

    logger.info(
        "sniper_termine",
        extra={
            "crees": created_count,
            "doublons_ignores": skipped_duplicate,
            "sans_telephone_ignores": skipped_no_phone,
        },
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)

    cli_parser = argparse.ArgumentParser(
        description="Sniper B2C : scrape une page de résultats d'annonces et crée des leads de reprise à qualifier."
    )
    cli_parser.add_argument("--search-url", required=True, help="URL de la page de résultats sur la plateforme ciblée.")
    cli_parser.add_argument("--max-results", type=int, default=30)
    cli_parser.add_argument("--delay", type=float, default=2.0, help="Délai (s) entre deux visites de page de détail.")
    cli_parser.add_argument("--headed", action="store_true", help="Lance un navigateur visible (debug local).")
    args = cli_parser.parse_args()

    asyncio.run(
        run_sniper(
            search_url=args.search_url,
            max_results=args.max_results,
            delay_seconds=args.delay,
            headless=not args.headed,
        )
    )
