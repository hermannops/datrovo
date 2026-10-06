import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Car, Clock3, HeadphonesIcon, ShieldCheck, Tag } from "lucide-react";
import { listVehicles } from "@/lib/api/vehicles";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/VehicleCard";
import { SearchBar, type SearchCombo } from "@/components/SearchBar";

const TRUST_POINTS = [
  { icon: ShieldCheck, title: "Plateforme de confiance", description: "Vendeurs vérifiés, transactions sécurisées." },
  { icon: Tag, title: "Meilleurs prix", description: "Comparez les prix du marché en un coup d'œil." },
  { icon: Clock3, title: "Rapide et simple", description: "Achetez ou vendez en quelques étapes." },
  { icon: HeadphonesIcon, title: "Support 24/7", description: "Notre équipe vous accompagne à tout moment." },
];

function buildSearchCombos(vehicles: { brand: string; model: string; city: string }[]): SearchCombo[] {
  const combos = new Map<string, SearchCombo>();

  for (const vehicle of vehicles) {
    const brandModelSlug = slugify(`${vehicle.brand}-${vehicle.model}`);
    const citySlug = slugify(vehicle.city);

    if (!combos.has(brandModelSlug)) {
      combos.set(brandModelSlug, {
        slug: brandModelSlug,
        label: `${vehicle.brand} ${vehicle.model}`,
        cities: [],
      });
    }

    const combo = combos.get(brandModelSlug)!;
    if (!combo.cities.some((city) => city.slug === citySlug)) {
      combo.cities.push({ slug: citySlug, label: vehicle.city });
    }
  }

  return Array.from(combos.values());
}

export default async function HomePage() {
  // Un seul fetch sert à la fois la grille "dernières annonces" (8 premières,
  // déjà triées par date desc côté API) et les options de la barre de
  // recherche (sur l'ensemble récupéré, pour couvrir plus de combinaisons
  // marque/modèle/ville réellement en stock).
  const allVehicles = await listVehicles({ limit: 200 });
  const vehicles = allVehicles.slice(0, 8);
  const searchCombos = buildSearchCombos(allVehicles);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Trouvez votre <span className="text-blue-600">voiture idéale</span> ou vendez en toute
              confiance
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              La manière simple d&apos;acheter ou de vendre un véhicule. Sûr. Rapide. Fiable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                render={<Link href="#annonces" />}
                nativeButton={false}
                size="lg"
                className="h-12 rounded-full px-6 text-base"
              >
                Voir les annonces
                <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href="/reprise" />}
                nativeButton={false}
                size="lg"
                variant="secondary"
                className="h-12 rounded-full px-6 text-base"
              >
                Vendre mon véhicule
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-h-72">
            {/* Pas de z-index négatif : avec un index négatif, un navigateur
                peut peindre cet élément SOUS le fond de la page (comportement
                du stacking context), le rendant invisible. L'ordre DOM suffit
                ici (ce div vient avant l'image, donc dessous). */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-blue-50 to-transparent [clip-path:polygon(18%_0%,100%_0%,100%_100%,0%_100%)]" />
            <div className="relative mx-auto h-72 w-full max-w-md">
              <Image
                src="/images/hero-car.jpg"
                alt="Véhicule en vedette"
                fill
                priority
                sizes="(min-width: 1024px) 448px, 90vw"
                className="object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <SearchBar combos={searchCombos} />
        </div>

        {/* Points de confiance */}
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 border-t border-slate-100 px-4 py-8 sm:grid-cols-4">
          {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Icon className="size-4.5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dernières annonces */}
      <section id="annonces" className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Dernières annonces</h2>
        </div>

        {vehicles.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
            Aucune annonce disponible pour le moment.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </section>

      {/* Bandeau reprise */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-blue-50 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Car className="size-6 text-blue-600" />
            <div>
              <p className="font-semibold text-slate-900">Envie de vendre votre voiture ?</p>
              <p className="text-sm text-slate-600">Obtenez une estimation cash en 2 minutes.</p>
            </div>
          </div>
          <Button
            render={<Link href="/reprise" />}
            nativeButton={false}
            variant="secondary"
            className="rounded-full px-6"
          >
            Vendre maintenant
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>
    </main>
  );
}
