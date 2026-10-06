import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listVehicles } from "@/lib/api/vehicles";
import { buildCatalogJsonLd } from "@/lib/seo/jsonld";
import { decodeSlug, slugify } from "@/lib/format";
import { CatalogFilters } from "@/components/CatalogFilters";
import type { TransmissionType, Vehicle } from "@/lib/types";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

interface RouteParams {
  brandModel: string;
  city: string;
}

interface SearchParams {
  transmission?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface CatalogPageProps {
  // `params`/`searchParams` sont des Promise depuis Next.js 15+ (à attendre
  // avant usage).
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}

const VALID_TRANSMISSIONS: TransmissionType[] = ["manuelle", "automatique"];

function canonicalPath(params: RouteParams): string {
  return `/occasion/${params.brandModel}/${params.city}`;
}

/**
 * Next.js App Router ne supporte PAS un dossier combinant deux segments
 * dynamiques au même niveau (`[brand]-[model]`) : testé en direct contre
 * Next.js 16, ça lève une `InvariantError` au runtime, et la doc officielle
 * (file-conventions/dynamic-routes) ne documente que [slug], [...slug] et
 * [[...slug]] — un seul paramètre capturé par segment.
 *
 * On garde donc un seul segment opaque `[brandModel]` (ex: "peugeot-308") et
 * on le résout en comparant son slug à celui de chaque véhicule plutôt qu'en
 * le "dé-slugifiant" à l'aveugle : un split naïf sur "-" casserait pour les
 * marques ou modèles contenant eux-mêmes un tiret.
 */
async function loadMatchingVehicles(brandModelSlug: string, citySlug: string): Promise<Vehicle[]> {
  const cityLabel = decodeSlug(citySlug);
  const candidates = await listVehicles({ city: cityLabel, limit: 200 });
  return candidates.filter((vehicle) => slugify(`${vehicle.brand}-${vehicle.model}`) === brandModelSlug);
}

export async function generateMetadata({ params }: CatalogPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const city = decodeSlug(resolvedParams.city);
  const vehicles = await loadMatchingVehicles(resolvedParams.brandModel, resolvedParams.city);

  if (vehicles.length === 0) {
    return {};
  }

  const { brand, model } = vehicles[0];
  const title = `${brand} ${model} d'occasion à ${city} — Annonces vérifiées`;
  const description = `Trouvez votre ${brand} ${model} d'occasion à ${city} parmi les annonces de nos concessionnaires partenaires. Prix, kilométrage et finitions mis à jour en continu.`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath(resolvedParams) },
    openGraph: { title, description, type: "website" },
  };
}

export default async function OccasionCatalogPage({ params, searchParams }: CatalogPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const city = decodeSlug(resolvedParams.city);
  const vehicles = await loadMatchingVehicles(resolvedParams.brandModel, resolvedParams.city);

  if (vehicles.length === 0) {
    notFound();
  }

  const initialTransmission: TransmissionType | "all" = VALID_TRANSMISSIONS.includes(
    resolvedSearchParams.transmission as TransmissionType
  )
    ? (resolvedSearchParams.transmission as TransmissionType)
    : "all";
  const initialMinPrice = Number(resolvedSearchParams.minPrice);
  const initialMaxPrice = Number(resolvedSearchParams.maxPrice);

  const { brand, model } = vehicles[0];

  const jsonLd = buildCatalogJsonLd({
    brand,
    model,
    city,
    vehicles,
    siteUrl: SITE_URL,
    canonicalPath: canonicalPath(resolvedParams),
  });

  return (
    <>
      {/* JSON-LD : le guide SEO officiel de Next.js (App Router) recommande de
          rendre le <script> directement dans la page plutôt que via l'API
          Metadata (qui ne couvre que <title>/<meta>). Google n'exige pas que
          les données structurées soient physiquement dans <head>. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">
          {brand} {model} d&apos;occasion à {city}
        </h1>
        <p className="mt-2 text-slate-600">
          {vehicles.length} annonce{vehicles.length > 1 ? "s" : ""} vérifiée
          {vehicles.length > 1 ? "s" : ""} chez nos concessionnaires partenaires.
        </p>
        <div className="mt-8">
          <CatalogFilters
            vehicles={vehicles}
            initialTransmission={initialTransmission}
            initialMinPrice={Number.isFinite(initialMinPrice) ? initialMinPrice : undefined}
            initialMaxPrice={Number.isFinite(initialMaxPrice) ? initialMaxPrice : undefined}
          />
        </div>
      </main>
    </>
  );
}
