import Link from "next/link";
import { Fuel, Gauge, MapPin, Settings2 } from "lucide-react";
import type { Vehicle } from "@/lib/types";
import { numberFormatter, priceFormatter } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CarIllustration } from "@/components/illustrations/CarIllustration";

const FUEL_LABELS: Record<Vehicle["fuel_type"], string> = {
  essence: "Essence",
  diesel: "Diesel",
  hybride: "Hybride",
  electrique: "Électrique",
  gpl: "GPL",
};

const TRANSMISSION_LABELS: Record<Vehicle["transmission"], string> = {
  manuelle: "Manuelle",
  automatique: "Automatique",
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const price = priceFormatter.format(Number(vehicle.price));
  const cover = vehicle.images_urls[0];

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <Card className="h-full overflow-hidden p-0 transition-shadow hover:shadow-lg hover:shadow-slate-900/10">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {cover ? (
            // Pas de next/image : domaines d'images distants (un par dealer)
            // pas encore configurés côté MVP.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-slate-300">
              <CarIllustration className="h-14 w-auto" />
              <span className="text-xs text-slate-400">Photo à venir</span>
            </div>
          )}
          <Badge className="absolute top-3 left-3 bg-slate-900 text-white shadow-sm">{vehicle.year}</Badge>
          <FavoriteButton vehicleId={vehicle.id} className="absolute top-3 right-3" />
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.trim_level && <p className="text-sm text-muted-foreground">{vehicle.trim_level}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Gauge className="size-3.5" />
              {numberFormatter.format(vehicle.mileage)} km
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="size-3.5" />
              {FUEL_LABELS[vehicle.fuel_type]}
            </span>
            <span className="flex items-center gap-1">
              <Settings2 className="size-3.5" />
              {TRANSMISSION_LABELS[vehicle.transmission]}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xl font-bold text-blue-600">{price}</p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {vehicle.city}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export { FUEL_LABELS, TRANSMISSION_LABELS };
