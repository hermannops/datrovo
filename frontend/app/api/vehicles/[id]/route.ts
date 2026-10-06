import { NextResponse } from "next/server";
import { getVehicle } from "@/lib/api/vehicles";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Proxy côté serveur vers GET /api/v1/vehicles/{id}. Nécessaire pour la page
 * /favoris (composant client, lit localStorage) : elle ne peut pas appeler
 * lib/api/client.ts directement (API_BASE_URL est volontairement privé,
 * jamais exposé au bundle navigateur). Ce handler tourne côté serveur Next
 * et réutilise exactement le même client server-only que les Server
 * Components — aucune duplication de logique de fetch.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const vehicleId = Number(id);

  if (Number.isNaN(vehicleId)) {
    return NextResponse.json({ detail: "Identifiant invalide." }, { status: 400 });
  }

  const vehicle = await getVehicle(vehicleId);
  if (!vehicle) {
    return NextResponse.json({ detail: "Véhicule introuvable." }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}
