/** "peugeot" -> "Peugeot", "aix-en-provence" -> "Aix En Provence". */
export function decodeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "Peugeot 308 GT" -> "peugeot-308-gt" (accents retirés, pour matcher un slug d'URL). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Masque de saisie téléphone FR : "0612345678" -> "06 12 34 56 78",
 * "+33612345678" -> "+33 6 12 34 56 78". Purement visuel — les espaces sont
 * retirés avant l'envoi au backend (voir components/TradeInForm.tsx /
 * LeadForm.tsx), qui valide le format réel via son propre regex. */
export function formatPhoneInput(value: string): string {
  const hasPlus = value.trim().startsWith("+");
  const digits = value.replace(/\D/g, "");

  if (hasPlus) {
    const country = digits.slice(0, 2);
    const rest = digits.slice(2).match(/.{1,2}/g) ?? [];
    return ["+" + country, ...rest].join(" ").trim();
  }

  return (digits.match(/.{1,2}/g) ?? []).join(" ");
}

export const priceFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export const numberFormatter = new Intl.NumberFormat("fr-FR");
