// Client API léger, fetch natif, pensé pour n'être appelé QUE côté serveur
// (Server Components, generateMetadata, Server Actions). API_BASE_URL n'a
// volontairement pas le préfixe NEXT_PUBLIC_ : si ce module est importé par
// erreur depuis un composant 'use client', l'appel échouera au lieu
// d'exposer silencieusement l'URL interne du backend au navigateur.

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "cache"> {
  /** Durée de revalidation ISR (secondes). Omis => pas de cache Next.js. */
  revalidate?: number;
  cache?: RequestCache;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { revalidate, cache, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    cache,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...(revalidate !== undefined ? { next: { revalidate } } : {}),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      (detail && typeof detail.detail === "string" && detail.detail) ||
        `Erreur API FastAPI (${response.status}) sur ${path}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
