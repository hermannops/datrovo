import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Calendar, Fuel, Gauge, MapPin, Settings2, ShieldCheck, Store } from "lucide-react";
import { getVehicle, listVehicles } from "@/lib/api/vehicles";
import { getDealer } from "@/lib/api/dealers";
import { numberFormatter, priceFormatter } from "@/lib/format";
import { LeadForm } from "@/components/LeadForm";
import { VehicleGallery } from "@/components/VehicleGallery";
import { VehicleCard } from "@/components/VehicleCard";
import { Card, CardContent } from "@/components/ui/card";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/components/VehicleCard";

interface VehiclePageProps {
  // `params` est une Promise depuis Next.js 15+ — voir la même remarque dans
  // app/occasion/[brandModel]/[city]/page.tsx.
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicleId = Number(id);
  if (Number.isNaN(vehicleId)) return {};

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) return {};

  const title = `${vehicle.brand} ${vehicle.model} ${vehicle.trim_level ?? ""} — ${vehicle.city}`;
  const description = `${vehicle.brand} ${vehicle.model} ${vehicle.year}, ${vehicle.mileage} km, à ${vehicle.city}. Contactez le concessionnaire via Datrovo.`;

  return { title, description };
}

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "Annonce vérifiée" },
  { icon: ShieldCheck, label: "Concessionnaire partenaire" },
];

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicleId = Number(id);
  if (Number.isNaN(vehicleId)) {
    notFound();
  }

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) {
    notFound();
  }

  const [dealer, nearbyVehicles] = await Promise.all([
    getDealer(vehicle.dealer_id),
    listVehicles({ city: vehicle.city, limit: 5 }),
  ]);
  const similarVehicles = nearbyVehicles.filter((v) => v.id !== vehicle.id).slice(0, 4);

  const specs = [
    { icon: Gauge, label: "Kilométrage", value: `${numberFormatter.format(vehicle.mileage)} km` },
    { icon: Calendar, label: "Année", value: String(vehicle.year) },
    { icon: Fuel, label: "Carburant", value: FUEL_LABELS[vehicle.fuel_type] },
    { icon: Settings2, label: "Boîte", value: TRANSMISSION_LABELS[vehicle.transmission] },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Colonne gauche : galerie + détails techniques complets */}
        <div>
          <VehicleGallery images={vehicle.images_urls} alt={`${vehicle.brand} ${vehicle.model}`} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {vehicle.brand} {vehicle.model} {vehicle.trim_level}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {vehicle.city}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {specs.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="items-center gap-1 p-4 text-center">
                <Icon className="size-5 text-blue-600" />
                <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </Card>
            ))}
          </div>

          {dealer && (
            <Card className="mt-6 flex-row items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-50">
                <Store className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendu par</p>
                <p className="text-sm font-semibold text-slate-900">{dealer.name}</p>
              </div>
            </Card>
          )}

          {similarVehicles.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold text-slate-900">Véhicules similaires à {vehicle.city}</h2>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {similarVehicles.map((similar) => (
                  <VehicleCard key={similar.id} vehicle={similar} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite : prix + formulaire, collant au scroll */}
        <aside className="self-start lg:sticky lg:top-24">
          <Card className="rounded-2xl border shadow-xl p-6">
            <CardContent className="p-0">
              <p className="text-sm text-muted-foreground">Prix</p>
              <p className="text-3xl font-bold text-slate-900">
                {priceFormatter.format(Number(vehicle.price))}
              </p>

              <LeadForm vehicleId={vehicle.id} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
