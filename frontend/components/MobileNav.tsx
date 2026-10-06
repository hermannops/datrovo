"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, LogIn, Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/reprise", label: "Reprise" },
  { href: "/services", label: "Services" },
  { href: "/a-propos", label: "À propos" },
];

const LINK_CLASS =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100";

/** Menu mobile (< sm) : la nav principale + Favoris/Connexion sont cachés en
 * `sm:flex` dans SiteHeader (place manquante sur un écran de téléphone) —
 * ce tiroir est leur seul point d'accès sous 640px. */
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<button type="button" aria-label="Ouvrir le menu" />}
        className="flex size-9 items-center justify-center rounded-lg text-white transition hover:bg-white/10 sm:hidden"
      >
        <Menu className="size-5" />
      </SheetTrigger>

      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 pb-4">
          {NAV_LINKS.map((link) => (
            <SheetClose
              key={link.href}
              render={<Link href={link.href} />}
              nativeButton={false}
              className={LINK_CLASS}
            >
              {link.label}
            </SheetClose>
          ))}

          <div className="my-2 border-t border-border" />

          <SheetClose render={<Link href="/favoris" />} nativeButton={false} className={LINK_CLASS}>
            <Heart className="size-4" />
            Favoris
          </SheetClose>
          <SheetClose render={<Link href="/connexion" />} nativeButton={false} className={LINK_CLASS}>
            <LogIn className="size-4" />
            Connexion
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
