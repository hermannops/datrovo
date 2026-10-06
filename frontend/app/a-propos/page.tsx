import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, Eye, HeadphonesIcon, ShieldCheck, Tag, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "À propos",
  description: "Datrovo met en relation acheteurs et vendeurs de véhicules avec des concessionnaires partenaires vérifiés.",
};

const WHY_US = [
  { icon: ShieldCheck, title: "Concessionnaires vérifiés", description: "Chaque annonce provient d'un partenaire identifié." },
  { icon: Tag, title: "Transparence des prix", description: "Les prix affichés sont ceux du concessionnaire, sans marge cachée." },
  { icon: Compass, title: "Simple et rapide", description: "Quelques champs suffisent, pas de compte à créer." },
  { icon: HeadphonesIcon, title: "Réactivité", description: "Votre demande part vers le concessionnaire en temps réel." },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Notre histoire
          </span>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
            Simplifier l&apos;achat et la revente de véhicules
          </h1>
          <p className="mt-4 text-slate-600">
            Datrovo est né d&apos;un constat simple : acheter ou revendre une voiture reste souvent lent et
            opaque. Nous connectons directement les acheteurs et les vendeurs particuliers avec un réseau de
            concessionnaires partenaires, pour des échanges plus rapides et plus transparents.
          </p>
        </div>

        <div className="relative h-64 overflow-hidden rounded-2xl sm:h-80">
          <Image
            src="/images/dealership-lot-1.jpg"
            alt="Véhicules chez un concessionnaire partenaire"
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card className="gap-2 p-6">
          <Target className="size-6 text-blue-600" />
          <p className="font-semibold text-slate-900">Notre mission</p>
          <p className="text-sm text-muted-foreground">
            Offrir une expérience d&apos;achat et de reprise rapide, transparente et sans friction, en
            connectant chaque demande directement au bon concessionnaire.
          </p>
        </Card>
        <Card className="gap-2 p-6">
          <Eye className="size-6 text-blue-600" />
          <p className="font-semibold text-slate-900">Notre vision</p>
          <p className="text-sm text-muted-foreground">
            Devenir le point de passage de référence entre particuliers et concessionnaires automobiles en
            France.
          </p>
        </Card>
      </div>

      <div className="mt-16">
        <h2 className="text-2xl font-bold text-slate-900">Pourquoi choisir Datrovo</h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_US.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Icon className="size-5 text-blue-600" />
              <p className="mt-3 font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-16 overflow-hidden rounded-2xl">
        <Image
          src="/images/dealership-lot-2.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="relative flex flex-col items-center justify-between gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-lg font-semibold text-white">Prêt à trouver votre prochain véhicule ?</p>
            <p className="text-sm text-slate-300">Parcourez le catalogue ou estimez votre reprise dès maintenant.</p>
          </div>
          <Button render={<Link href="/" />} nativeButton={false} className="rounded-full px-6">
            Découvrir le catalogue
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
