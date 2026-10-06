import Link from "next/link";
import { Car, Mail, Phone, ShieldCheck } from "lucide-react";

const TRUST_PILLS = ["Concessionnaires vérifiés", "Sans engagement", "Réponse rapide"];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold text-white">
            <Car className="size-6 text-blue-600" />
            Datrovo
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-400">
            La plateforme qui met en relation acheteurs et vendeurs de véhicules avec des concessionnaires
            partenaires vérifiés.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TRUST_PILLS.map((pill) => (
              <span
                key={pill}
                className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
              >
                <ShieldCheck className="size-3 text-blue-400" />
                {pill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Liens rapides</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="transition hover:text-white">
                Accueil
              </Link>
            </li>
            <li>
              <Link href="/reprise" className="transition hover:text-white">
                Reprise cash
              </Link>
            </li>
            <li>
              <Link href="/services" className="transition hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/a-propos" className="transition hover:text-white">
                À propos
              </Link>
            </li>
            <li>
              <Link href="/favoris" className="transition hover:text-white">
                Mes favoris
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Contact</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-blue-400" />
              contact@datrovo.fr
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-blue-400" />
              01 23 45 67 89
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Datrovo. Tous droits réservés.
      </div>
    </footer>
  );
}
