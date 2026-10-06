import type { Metadata } from "next";
import Image from "next/image";
import { BadgeEuro, ShieldCheck, Timer } from "lucide-react";
import { TradeInForm } from "@/components/TradeInForm";

export const metadata: Metadata = {
  title: "Reprise cash de votre véhicule — Estimation gratuite",
  description:
    "Obtenez une offre de reprise cash pour votre véhicule en moins de 2 minutes. Saisissez votre plaque, recevez une estimation sous 24h.",
};

const TRUST_POINTS = [
  { icon: Timer, label: "Estimation en 2 min" },
  { icon: BadgeEuro, label: "Paiement sécurisé" },
  { icon: ShieldCheck, label: "Sans engagement" },
];

export default function ReprisePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-16 sm:py-24">
      {/* Bandeau photo limité à h-80 (pas toute la page) : le fondu se fait
          sur SA propre hauteur, le reste de la page reste un fond blanc uni,
          le formulaire plus bas n'est jamais affecté. Et comme un élément
          `absolute` peint TOUJOURS au-dessus d'un sibling statique (quel que
          soit l'ordre DOM — contrairement au cas où les deux sont absolute),
          le contenu ci-dessous a besoin de son propre `relative` pour
          repasser au même niveau d'empilement et s'afficher par-dessus. */}
      <div className="absolute inset-x-0 top-0 h-80">
        <Image
          src="/images/private-seller-car.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-white" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Reprise cash
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Vendez votre voiture cash,
          <br className="hidden sm:block" /> sans tracas
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Estimation gratuite en 2 minutes. Paiement sécurisé, enlèvement offert.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Icon className="size-4 text-blue-600" />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-12">
        <TradeInForm />
      </div>
    </main>
  );
}
