// Favoris stockés en localStorage, par appareil — pas de compte utilisateur
// ni de backend dédié (voir memory projet : scope limité aux pages avec
// données réelles). Honnête : "Enregistrés sur cet appareil", pas "Mon compte".

const STORAGE_KEY = "datrovo:favorites";
const CHANGE_EVENT = "datrovo:favorites-changed";

function readStorage(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === "number") : [];
  } catch {
    // Stockage indisponible (navigation privée, quota, etc.) : on dégrade
    // silencieusement plutôt que de casser la page.
    return [];
  }
}

export function getFavoriteIds(): number[] {
  return readStorage();
}

export function isFavorite(vehicleId: number): boolean {
  return readStorage().includes(vehicleId);
}

export function toggleFavorite(vehicleId: number): number[] {
  const current = readStorage();
  const next = current.includes(vehicleId)
    ? current.filter((id) => id !== vehicleId)
    : [...current, vehicleId];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // idem : échec silencieux, l'UI reste cohérente avec l'état en mémoire.
  }

  return next;
}

export { CHANGE_EVENT as FAVORITES_CHANGE_EVENT };
