interface CarIllustrationProps {
  className?: string;
}

/**
 * Silhouette de voiture vue de profil, dessinée en SVG (formes primitives :
 * carrosserie, pavillon, vitres, roues). Pas une photo — un substitut
 * d'illustration propre tant qu'une vraie photo d'annonce n'est pas
 * disponible (voir app/services/xml_parser.py pour la source réelle des
 * photos par véhicule). La carrosserie hérite de `currentColor` pour
 * s'adapter au contexte (grand aplat pâle dans le hero, icône pleine ailleurs).
 */
export function CarIllustration({ className }: CarIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ombre au sol */}
      <ellipse cx="120" cy="96" rx="95" ry="7" fill="currentColor" opacity="0.12" />

      {/* carrosserie */}
      <rect x="15" y="55" width="210" height="32" rx="16" fill="currentColor" />
      {/* pavillon */}
      <path d="M70 55 L92 22 L158 22 L185 55 Z" fill="currentColor" />

      {/* rétroviseur */}
      <path d="M90 38 L82 36 L84 44 Z" fill="currentColor" />

      {/* vitres (découpe claire) */}
      <path d="M78 51 L95 28 L121 28 L121 51 Z" fill="white" fillOpacity="0.85" />
      <path d="M129 51 L129 28 L155 28 L178 51 Z" fill="white" fillOpacity="0.85" />

      {/* calandre / phare avant */}
      <circle cx="217" cy="66" r="4" fill="white" fillOpacity="0.9" />
      <rect x="205" y="78" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.5" />

      {/* roues */}
      <circle cx="68" cy="87" r="18" fill="#0f172a" />
      <circle cx="68" cy="87" r="8" fill="#94a3b8" />
      <circle cx="172" cy="87" r="18" fill="#0f172a" />
      <circle cx="172" cy="87" r="8" fill="#94a3b8" />
    </svg>
  );
}
