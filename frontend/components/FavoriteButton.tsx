"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

interface FavoriteButtonProps {
  vehicleId: number;
  className?: string;
}

export function FavoriteButton({ vehicleId, className }: FavoriteButtonProps) {
  // false par défaut côté serveur (pas de localStorage) ; synchronisé au montage
  // pour éviter tout mismatch d'hydratation.
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(isFavorite(vehicleId));
  }, [vehicleId]);

  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={(event) => {
        // Les cartes véhicule sont elles-mêmes des <Link> : on empêche la
        // navigation pour que le clic ne fasse que togguer le favori.
        event.preventDefault();
        event.stopPropagation();
        setActive(toggleFavorite(vehicleId).includes(vehicleId));
      }}
      className={cn(
        "flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition hover:scale-105",
        className
      )}
    >
      <Heart className={cn("size-4", active ? "fill-red-500 text-red-500" : "text-slate-500")} />
    </button>
  );
}
