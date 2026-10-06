"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { TransmissionType, Vehicle } from "@/lib/types";
import { VehicleCard } from "@/components/VehicleCard";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { priceFormatter } from "@/lib/format";

interface CatalogFiltersProps {
  vehicles: Vehicle[];
  /** Préremplissage depuis la barre de recherche (query string) — voir
   * app/occasion/[brandModel]/[city]/page.tsx. */
  initialTransmission?: TransmissionType | "all";
  initialMinPrice?: number;
  initialMaxPrice?: number;
}

const TRANSMISSION_OPTIONS: { value: TransmissionType | "all"; label: string }[] = [
  { value: "all", label: "Toutes les boîtes" },
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
];

/** Bandeau de filtres rapides (prix, boîte) qui filtre la grille déjà
 * chargée côté client — instantané, sans aller-retour serveur. */
export function CatalogFilters({
  vehicles,
  initialTransmission = "all",
  initialMinPrice,
  initialMaxPrice,
}: CatalogFiltersProps) {
  const [minPrice, maxPrice] = useMemo(() => {
    const prices = vehicles.map((vehicle) => Number(vehicle.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Évite un slider à amplitude nulle si tous les véhicules ont le même prix.
    return [min, max > min ? max : min + 1000];
  }, [vehicles]);

  const [priceRange, setPriceRange] = useState<[number, number]>([
    initialMinPrice ?? minPrice,
    initialMaxPrice ?? maxPrice,
  ]);
  const [transmission, setTransmission] = useState<TransmissionType | "all">(initialTransmission);

  const filtered = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const price = Number(vehicle.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;
      if (transmission !== "all" && vehicle.transmission !== transmission) return false;
      return true;
    });
  }, [vehicles, priceRange, transmission]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-end sm:gap-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:hidden">
          <SlidersHorizontal className="size-4" />
          Filtres
        </div>

        <div className="flex-1">
          <Label className="mb-3 block text-sm">
            Budget : {priceFormatter.format(priceRange[0])} – {priceFormatter.format(priceRange[1])}
          </Label>
          <Slider
            min={minPrice}
            max={maxPrice}
            step={500}
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
          />
        </div>

        <div className="sm:w-52">
          <Label className="mb-3 block text-sm">Boîte de vitesses</Label>
          <Select
            value={transmission}
            onValueChange={(value) => setTransmission(value as TransmissionType | "all")}
          >
            <SelectTrigger className="h-9 w-full">
              {/* Base UI Select.Value ne mappe pas automatiquement la valeur
                  sélectionnée vers le label de son SelectItem (contrairement
                  à Radix) : il faut le faire explicitement via children. */}
              <SelectValue>
                {(value: TransmissionType | "all") =>
                  TRANSMISSION_OPTIONS.find((option) => option.value === value)?.label
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {TRANSMISSION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Aucun véhicule ne correspond à ces critères.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </div>
  );
}
