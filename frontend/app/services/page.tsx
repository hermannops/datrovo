import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  MapPinned,
  ShieldCheck,
  Timer,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Services",
  description: "Comment Datrovo simplifie l'achat et la reprise de véhicules auprès de concessionnaires partenaires.",
};

const SERVICES = [
  {
    icon: MapPinned,
    title: "Catalogue local",
    description: "Des annonces organisées par modèle et par ville pour trouver rapidement un véhicule près de chez vous.",
  },
  {
    icon: Timer,
    title: "Mise en relation instantanée",
    description: "Votre demande est transmise au concessionnaire en temps réel, sans intermédiaire ni délai inutile.",
  },
  {
    icon: Wallet,
    title: "Estimation de reprise",
    description: "Indiquez votre plaque, recevez une offre de reprise cash sous 24h, sans engagement.",
  },
  {
    icon: BadgeCheck,
    title: "Concessionnaires vérifiés",
    description: "Chaque annonce provient d'un concessionnaire partenaire identifié, pas d'un particulier anonyme.",
  },
  {
    icon: ShieldCheck,
    title: "Sans engagement",
    description: "Laisser vos coordonnées ne vous engage à rien : c'est le concessionnaire qui vous recontacte.",
  },
  {
    icon: Handshake,
    title: "Gratuit pour les acheteurs",
    description: "Consulter le catalogue et contacter un vendeur est entièrement gratuit, sans compte à créer.",
  },
];

const STEPS = [
  { title: "Parcourez ou estimez", description: "Trouvez un véhicule dans le catalogue, ou saisissez votre plaque pour une reprise." },
  { title: "Laissez vos coordonnées", description: "Un formulaire court, sans compte ni mot de passe." },
  { title: "Soyez recontacté", description: "Le concessionnaire reçoit votre demande immédiatement et vous répond directement." },
];

export default function ServicesPage() {
  return (
    <main>
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Des services pensés pour <span className="text-blue-600">simplifier</span> l&apos;achat et la
              revente
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Fiable. Transparent. Sans friction.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button render={<Link href="/" />} nativeButton={false} size="lg" className="h-12 rounded-full px-6">
                Parcourir le catalogue
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href="/reprise" />}
                nativeButton={false}
                size="lg"
                variant="secondary"
                className="h-12 rounded-full px-6"
              >
                Vendre mon véhicule
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden rounded-2xl">
            <Image
              src="/images/hero-suv.jpg"
              alt="Véhicule proposé par un concessionnaire partenaire"
              fill
              sizes="(min-width: 1024px) 560px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Nos services</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="size-5 text-blue-600" />
              </div>
              <p className="mt-4 font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-blue-50/60 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">Comment ça marche</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                  {index + 1}
                </div>
                <p className="mt-3 font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
