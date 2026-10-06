import { apiFetch, ApiError } from "./client";
import type { DealerPublic } from "../types";

export async function getDealer(id: number): Promise<DealerPublic | null> {
  try {
    return await apiFetch<DealerPublic>(`/dealers/${id}`, { revalidate: 300 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
