import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { FavoritesList } from "@/components/FavoritesList";

export const metadata: Metadata = {
  title: "Mes favoris",
  description: "Retrouvez les véhicules que vous avez enregistrés.",
};

export default function FavoritesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-blue-50">
          <Heart className="size-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes favoris</h1>
          <p className="text-sm text-muted-foreground">Enregistrés sur cet appareil.</p>
        </div>
      </div>

      <FavoritesList />
    </main>
  );
}
