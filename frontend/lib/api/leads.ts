import { apiFetch } from "./client";
import type { LeadPayload, LeadResponse } from "../types";

/** POST /leads — jamais caché, toujours une écriture fraîche. */
export async function createLead(payload: LeadPayload): Promise<LeadResponse> {
  return apiFetch<LeadResponse>("/leads", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}
