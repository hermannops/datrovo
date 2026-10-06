"use server";

import { createLead } from "@/lib/api/leads";

export interface ActionResult {
  success: boolean;
  message: string;
}

interface PurchaseLeadInput {
  vehicleId: number;
  fullName: string;
  phone: string;
  email?: string;
  postalCode: string;
}

/** Formulaire d'achat sur la fiche véhicule — source "seo_landing" car le
 * visiteur arrive via le catalogue programmatique. dealer_id/vehicle_brand/
 * vehicle_model ne sont plus envoyés : le backend les dérive de vehicle_id. */
export async function submitPurchaseLead(input: PurchaseLeadInput): Promise<ActionResult> {
  try {
    await createLead({
      lead_type: "achat",
      source: "seo_landing",
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || undefined,
      postal_code: input.postalCode,
      vehicle_id: input.vehicleId,
    });
    return {
      success: true,
      message: "Votre demande a bien été envoyée. Le concessionnaire va vous recontacter rapidement.",
    };
  } catch (error) {
    console.error("submitPurchaseLead a échoué", error);
    return { success: false, message: "Une erreur est survenue, merci de réessayer dans un instant." };
  }
}

interface TradeInLeadInput {
  licensePlate: string;
  fullName: string;
  phone: string;
  email?: string;
  postalCode: string;
}

/** Formulaire de reprise cash — paquet propre : plus de vehicle_brand/model
 * ni de dealer_id bricolés, le backend gère la reprise comme un lead_type à
 * part entière (client_plate, pas de dealer assigné à la capture). */
export async function submitTradeInLead(input: TradeInLeadInput): Promise<ActionResult> {
  try {
    await createLead({
      lead_type: "reprise",
      source: "manual",
      full_name: input.fullName,
      phone: input.phone,
      email: input.email || undefined,
      postal_code: input.postalCode,
      client_plate: input.licensePlate.toUpperCase(),
    });
    return {
      success: true,
      message: "Merci ! Nous revenons vers vous avec une estimation sous 24h.",
    };
  } catch (error) {
    console.error("submitTradeInLead a échoué", error);
    return { success: false, message: "Une erreur est survenue, merci de réessayer dans un instant." };
  }
}
