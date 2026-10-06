"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getFavoriteIds, FAVORITES_CHANGE_EVENT } from "@/lib/favorites";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/lib/types";

export function FavoritesList() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const ids = getFavoriteIds();
      if (ids.length === 0) {
        if (!cancelled) setVehicles([]);
        return;
      }

      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await fetch(`/api/vehicles/${id}`);
            return response.ok ? ((await response.json()) as Vehicle) : null;
          } catch {
            return null;
          }
        })
      );

      if (!cancelled) {
        setVehicles(results.filter((v): v is Vehicle => v !== null));
      }
    }

    load();
    // Recharge si un favori est ajouté/retiré depuis une autre carte pendant
    // que cette page est ouverte (même onglet).
    window.addEventListener(FAVORITES_CHANGE_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(FAVORITES_CHANGE_EVENT, load);
    };
  }, []);

  if (vehicles === null) {
    return <p className="mt-10 text-muted-foreground">Chargement de vos favoris...</p>;
  }

  if (vehicles.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-border py-16 text-center">
        <Heart className="mx-auto size-8 text-slate-300" />
        <p className="mt-3 text-muted-foreground">Vous n&apos;avez pas encore de favoris.</p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-4 rounded-full">
          Parcourir les annonces
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
