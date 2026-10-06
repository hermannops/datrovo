import type { Vehicle } from "../types";

interface CatalogJsonLdParams {
  brand: string;
  model: string;
  city: string;
  vehicles: Vehicle[];
  siteUrl: string;
  canonicalPath: string;
}

/**
 * Product + AggregateOffer : schéma standard pour une page catalogue
 * programmatique représentant N annonces d'un même modèle dans une ville
 * (et non une fiche produit unique). lowPrice/highPrice/offerCount résument
 * la fourchette, chaque Offer pointe vers la fiche véhicule individuelle.
 */
export function buildCatalogJsonLd({
  brand,
  model,
  city,
  vehicles,
  siteUrl,
  canonicalPath,
}: CatalogJsonLdParams) {
  const prices = vehicles.map((vehicle) => Number(vehicle.price)).filter((price) => !Number.isNaN(price));
  const lowPrice = prices.length ? Math.min(...prices) : 0;
  const highPrice = prices.length ? Math.max(...prices) : 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${brand} ${model} d'occasion à ${city}`,
    url: `${siteUrl}${canonicalPath}`,
    brand: {
      "@type": "Brand",
      name: brand,
    },
    model,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice,
      highPrice,
      offerCount: vehicles.length,
      offers: vehicles.map((vehicle) => ({
        "@type": "Offer",
        price: vehicle.price,
        priceCurrency: "EUR",
        url: `${siteUrl}/vehicles/${vehicle.id}`,
        itemCondition: "https://schema.org/UsedCondition",
        availability: "https://schema.org/InStock",
      })),
    },
  };
}
