import Link from "next/link";
import { Car, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FavoritesNavLink } from "@/components/FavoritesNavLink";
import { MobileNav } from "@/components/MobileNav";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/reprise", label: "Reprise" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <Car className="size-6 text-blue-600" />
          Datrovo
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-5 text-sm font-medium text-slate-300 sm:flex">
            <FavoritesNavLink />
            <Link href="/connexion" className="flex items-center gap-1.5 transition hover:text-white">
              <LogIn className="size-4" />
              Connexion
            </Link>
          </div>

          <Button render={<Link href="/reprise" />} nativeButton={false} className="rounded-full px-4">
            Vendre mon véhicule
          </Button>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
