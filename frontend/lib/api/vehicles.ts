import { apiFetch, ApiError } from "./client";
import type { Vehicle } from "../types";

export interface VehicleFilters {
  dealerId?: number;
  brand?: string;
  model?: string;
  city?: string;
  fuelType?: string;
  minPrice?: number;
  maxPrice?: number;
  skip?: number;
  limit?: number;
}

function buildQuery(filters: VehicleFilters): string {
  const params = new URLSearchParams();
  if (filters.dealerId !== undefined) params.set("dealer_id", String(filters.dealerId));
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.model) params.set("model", filters.model);
  if (filters.city) params.set("city", filters.city);
  if (filters.fuelType) params.set("fuel_type", filters.fuelType);
  if (filters.minPrice !== undefined) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max_price", String(filters.maxPrice));
  if (filters.skip !== undefined) params.set("skip", String(filters.skip));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/** Catalogue filtré — utilisé par les pages SEO programmatiques (ISR 5 min). */
export async function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  try {
    return await apiFetch<Vehicle[]>(`/vehicles${buildQuery(filters)}`, { revalidate: 300 });
  } catch (error) {
    // Au `docker build`, le backend n'est pas encore démarré (conteneur séparé) :
    // Next tente quand même un prerender statique de "/" à ce moment-là. On
    // retombe sur une liste vide (déjà géré par l'UI) plutôt que de faire
    // échouer le build ; l'ISR régénère la vraie page dans les 5 min suivant
    // le démarrage réel du backend en prod.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return [];
    }
    throw error;
  }
}

/** Fiche véhicule — ISR courte (1 min) car prix/statut peuvent changer vite. */
export async function getVehicle(id: number): Promise<Vehicle | null> {
  try {
    return await apiFetch<Vehicle>(`/vehicles/${id}`, { revalidate: 60 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
