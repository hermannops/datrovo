"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, MapPin, Search, Settings2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface CityOption {
  slug: string;
  label: string;
}

export interface SearchCombo {
  slug: string;
  label: string;
  cities: CityOption[];
}

interface SearchBarProps {
  combos: SearchCombo[];
}

const TRANSMISSION_OPTIONS = [
  { value: "all", label: "Toutes les boîtes" },
  { value: "manuelle", label: "Manuelle" },
  { value: "automatique", label: "Automatique" },
];

const BUDGET_OPTIONS = [
  { value: "all", label: "Tous les budgets" },
  { value: "0-15000", label: "Moins de 15 000 €" },
  { value: "15000-30000", label: "15 000 € – 30 000 €" },
  { value: "30000-", label: "Plus de 30 000 €" },
];

/**
 * Reproduit la barre de recherche du template (4 segments compacts icône +
 * label + valeur, séparés par de fins traits verticaux, bouton plein à
 * droite). Chaque champ est réellement câblé — pas de facette décorative :
 * - Véhicule / Ville pilotent la destination (/occasion/[brandModel]/[city]),
 *   la ville dépend TOUJOURS du modèle choisi pour ne jamais pointer vers une
 *   combinaison inexistante (donc un 404).
 * - Boîte / Budget partent en query string et préremplissent les filtres de
 *   la page catalogue (voir CatalogFilters + app/occasion/.../page.tsx).
 */
export function SearchBar({ combos }: SearchBarProps) {
  const router = useRouter();
  const [brandModelSlug, setBrandModelSlug] = useState(combos[0]?.slug ?? "");
  const selectedCombo = combos.find((combo) => combo.slug === brandModelSlug);
  const [citySlug, setCitySlug] = useState(selectedCombo?.cities[0]?.slug ?? "");
  const [transmission, setTransmission] = useState("all");
  const [budget, setBudget] = useState("all");

  if (combos.length === 0) {
    return null;
  }

  const cityOptions = selectedCombo?.cities ?? [];

  function handleBrandModelChange(slug: string | null) {
    setBrandModelSlug(slug ?? "");
    const combo = combos.find((c) => c.slug === slug);
    setCitySlug(combo?.cities[0]?.slug ?? "");
  }

  function handleSubmit() {
    if (!brandModelSlug || !citySlug) return;

    const query = new URLSearchParams();
    if (transmission !== "all") query.set("transmission", transmission);
    if (budget !== "all") {
      const [min, max] = budget.split("-");
      if (min) query.set("minPrice", min);
      if (max) query.set("maxPrice", max);
    }

    const queryString = query.toString();
    router.push(`/occasion/${brandModelSlug}/${citySlug}${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="relative z-10 mx-auto -mt-8 flex w-full max-w-5xl flex-col rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-stretch">
      <div className="flex flex-1 flex-col divide-y divide-border sm:flex-row sm:divide-x sm:divide-y-0">
        {/* Véhicule */}
        <Select value={brandModelSlug} onValueChange={handleBrandModelChange}>
          <SelectTrigger className="h-auto flex-1 justify-start gap-3 rounded-xl border-0 bg-transparent px-4 py-2.5 shadow-none hover:bg-slate-50 focus-visible:ring-0">
            <Car className="size-5 shrink-0 text-blue-600" />
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="text-xs text-muted-foreground">Véhicule</span>
              <SelectValue className="text-sm font-medium text-slate-900">
                {(value: string) => combos.find((combo) => combo.slug === value)?.label}
              </SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {combos.map((combo) => (
              <SelectItem key={combo.slug} value={combo.slug}>
                {combo.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Boîte de vitesses */}
        <Select value={transmission} onValueChange={(value) => setTransmission(value ?? "all")}>
          <SelectTrigger className="h-auto flex-1 justify-start gap-3 rounded-xl border-0 bg-transparent px-4 py-2.5 shadow-none hover:bg-slate-50 focus-visible:ring-0">
            <Settings2 className="size-5 shrink-0 text-blue-600" />
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="text-xs text-muted-foreground">Boîte</span>
              <SelectValue className="text-sm font-medium text-slate-900">
                {(value: string) => TRANSMISSION_OPTIONS.find((option) => option.value === value)?.label}
              </SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {TRANSMISSION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Budget */}
        <Select value={budget} onValueChange={(value) => setBudget(value ?? "all")}>
          <SelectTrigger className="h-auto flex-1 justify-start gap-3 rounded-xl border-0 bg-transparent px-4 py-2.5 shadow-none hover:bg-slate-50 focus-visible:ring-0">
            <Wallet className="size-5 shrink-0 text-blue-600" />
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="text-xs text-muted-foreground">Budget</span>
              <SelectValue className="text-sm font-medium text-slate-900">
                {(value: string) => BUDGET_OPTIONS.find((option) => option.value === value)?.label}
              </SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {BUDGET_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ville */}
        <Select
          value={citySlug}
          onValueChange={(value) => setCitySlug(value ?? "")}
          disabled={cityOptions.length === 0}
        >
          <SelectTrigger className="h-auto flex-1 justify-start gap-3 rounded-xl border-0 bg-transparent px-4 py-2.5 shadow-none hover:bg-slate-50 focus-visible:ring-0">
            <MapPin className="size-5 shrink-0 text-blue-600" />
            <span className="flex min-w-0 flex-col items-start text-left">
              <span className="text-xs text-muted-foreground">Ville</span>
              <SelectValue className="text-sm font-medium text-slate-900">
                {(value: string) => cityOptions.find((city) => city.slug === value)?.label}
              </SelectValue>
            </span>
          </SelectTrigger>
          <SelectContent>
            {cityOptions.map((city) => (
              <SelectItem key={city.slug} value={city.slug}>
                {city.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSubmit} size="lg" className="mt-2 h-auto shrink-0 rounded-xl px-8 py-3 sm:mt-0 sm:ml-2">
        <Search className="size-4" />
        Rechercher
      </Button>
    </div>
  );
}
