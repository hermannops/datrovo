// Miroir TypeScript des schémas Pydantic exposés par app/schemas/*.py côté
// FastAPI. À garder synchronisé manuellement tant qu'il n'y a pas de
// génération de client OpenAPI.

export type FuelType = "essence" | "diesel" | "hybride" | "electrique" | "gpl";
export type TransmissionType = "manuelle" | "automatique";
export type LeadSource = "trade_in_scraper" | "seo_landing" | "manual";
export type LeadType = "achat" | "reprise";

export interface Vehicle {
  id: number;
  dealer_id: number;
  brand: string;
  model: string;
  trim_level: string | null;
  // Pydantic v2 sérialise Decimal en string (pas en number) pour préserver
  // la précision — confirmé en observant la réponse réelle de /api/v1/vehicles.
  price: string;
  mileage: number;
  year: number;
  fuel_type: FuelType;
  transmission: TransmissionType;
  city: string;
  images_urls: string[];
  created_at: string;
  updated_at: string;
}

interface LeadContactPayload {
  source: LeadSource;
  full_name: string;
  phone: string;
  email?: string;
  postal_code: string;
}

// dealer_id/vehicle_brand/vehicle_model ne sont PAS envoyés par le client :
// le backend les dérive de vehicle_id (voir app/routers/leads.py) pour
// qu'un payload falsifié ne puisse pas associer un lead au mauvais dealer.
export interface AchatLeadPayload extends LeadContactPayload {
  lead_type: "achat";
  vehicle_id: number;
}

export interface RepriseLeadPayload extends LeadContactPayload {
  lead_type: "reprise";
  client_plate: string;
  client_vehicle_details?: Record<string, unknown> | null;
}

export type LeadPayload = AchatLeadPayload | RepriseLeadPayload;

export interface DealerPublic {
  id: number;
  name: string;
}

export interface LeadResponse {
  id: number;
  lead_type: LeadType;
  status: string;
  created_at: string;
  dealer_id: number;
}
