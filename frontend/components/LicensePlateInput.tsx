"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type LicensePlateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className">;

/**
 * Imite une plaque d'immatriculation européenne : bandeau bleu étoilé à
 * gauche, corps blanc, bordure bleue — pour rendre l'étape 1 de la reprise
 * immédiatement reconnaissable (pattern Turo/Virtuo).
 */
export const LicensePlateInput = forwardRef<HTMLInputElement, LicensePlateInputProps>(
  function LicensePlateInput(props, ref) {
    return (
      <div className="mx-auto flex h-20 w-full max-w-md overflow-hidden rounded-xl border-[3px] border-blue-600 bg-white shadow-lg shadow-blue-900/10 sm:h-24">
        <div className="flex w-10 flex-shrink-0 flex-col items-center justify-between bg-blue-600 py-2 sm:w-12">
          <div
            aria-hidden
            className="grid grid-cols-3 gap-[2px] leading-none"
            style={{ fontSize: "6px" }}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="text-yellow-400">
                ★
              </span>
            ))}
          </div>
          <span className="text-xs font-bold tracking-wide text-white">EU</span>
        </div>
        <input
          ref={ref}
          {...props}
          className={cn(
            "h-full w-full bg-white px-3 text-center font-mono text-2xl font-black uppercase tracking-[0.2em] text-slate-900",
            "outline-none placeholder:text-slate-300 sm:text-3xl"
          )}
        />
      </div>
    );
  }
);
