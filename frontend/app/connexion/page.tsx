import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Tag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connexion à votre compte Datrovo.",
};

const POINTS = [
  { icon: ShieldCheck, title: "Sécurisé", description: "Vos données restent confidentielles." },
  { icon: Tag, title: "Meilleurs prix", description: "Accédez aux meilleures offres du marché." },
  { icon: Zap, title: "Rapide", description: "Achetez ou vendez en quelques étapes." },
];

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16">
      <div className="grid w-full grid-cols-1 overflow-hidden rounded-2xl border border-border shadow-xl lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 bg-blue-600 p-10 text-white">
          <Link href="/" className="text-xl font-bold">
            Datrovo
          </Link>
          <p className="text-sm text-blue-100">
            Votre plateforme de confiance pour acheter et vendre des véhicules.
          </p>
          <div className="space-y-4">
            {POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-blue-100">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5 bg-white p-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Bon retour</h1>
            <p className="text-sm text-muted-foreground">Connectez-vous pour continuer.</p>
          </div>

          {/* Honnêteté d'abord : pas de compte utilisateur côté backend pour
              l'instant, donc pas de faux formulaire qui prétend fonctionner. */}
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Les comptes utilisateurs arrivent bientôt. Aucune connexion n&apos;est requise pour parcourir le
            catalogue ou contacter un concessionnaire.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" type="email" placeholder="vous@email.fr" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" placeholder="••••••••" disabled />
          </div>

          <Button disabled className="h-11 w-full rounded-xl">
            Se connecter
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Besoin d&apos;aide ?{" "}
            <Link href="/a-propos" className="text-blue-600 hover:underline">
              Contactez-nous
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
