"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getFavoriteIds, FAVORITES_CHANGE_EVENT } from "@/lib/favorites";

export function FavoritesNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(getFavoriteIds().length);
    update();
    window.addEventListener(FAVORITES_CHANGE_EVENT, update);
    // "storage" se déclenche si un autre onglet modifie les favoris.
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(FAVORITES_CHANGE_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return (
    <Link href="/favoris" className="relative flex items-center gap-1.5 transition hover:text-white">
      <Heart className="size-4" />
      Favoris
      {count > 0 && (
        <span className="absolute -top-2 -right-3 flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
