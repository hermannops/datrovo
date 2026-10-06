"use client";

import { type FormEvent, useState, useTransition } from "react";
import { ArrowRight, Loader2, PenLine, Sparkles } from "lucide-react";
import { submitTradeInLead } from "@/lib/actions/leads";
import { formatPhoneInput } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LicensePlateInput } from "@/components/LicensePlateInput";

type Step = "plate" | "contact" | "done";

export function TradeInForm() {
  const [step, setStep] = useState<Step>("plate");
  const [plate, setPlate] = useState("");
  const [phoneDisplay, setPhoneDisplay] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handlePlateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (plate.replace(/[^A-Z0-9]/g, "").length < 4) {
      setError("Merci de saisir une plaque valide.");
      return;
    }
    setError(null);
    setStep("contact");
  }

  function handleContactSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitTradeInLead({
        licensePlate: plate,
        fullName: String(formData.get("full_name") ?? ""),
        phone: String(formData.get("phone") ?? "").replace(/\s+/g, ""),
        email: String(formData.get("email") ?? "") || undefined,
        postalCode: String(formData.get("postal_code") ?? ""),
      });
      if (result.success) {
        setMessage(result.message);
        setStep("done");
      } else {
        setError(result.message);
      }
    });
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center shadow-sm">
        <Sparkles className="mx-auto size-8 text-blue-600" />
        <p className="mt-3 text-lg font-semibold text-blue-900">C&apos;est envoyé !</p>
        <p className="mt-2 text-sm text-blue-700">{message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      {/* Repères d'étape */}
      <div className="mb-6 flex items-center justify-center gap-3 text-xs font-semibold tracking-wide uppercase">
        <span className={step === "plate" ? "text-blue-600" : "text-muted-foreground"}>
          1. Plaque
        </span>
        <span className="h-px w-8 bg-border" />
        <span className={step === "contact" ? "text-blue-600" : "text-muted-foreground"}>
          2. Coordonnées
        </span>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-slate-900/5 sm:p-8">
        {step === "plate" && (
          <form onSubmit={handlePlateSubmit} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Saisissez votre plaque d&apos;immatriculation</p>
            </div>

            <LicensePlateInput
              value={plate}
              onChange={(event) => setPlate(event.target.value.toUpperCase())}
              placeholder="AB-123-CD"
              maxLength={12}
              required
            />

            {error && <p className="text-center text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              size="lg"
              className="h-14 w-full rounded-xl text-base font-semibold"
            >
              Estimer ma voiture
              <ArrowRight className="size-5" />
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Estimation gratuite et sans engagement, réponse sous 24h.
            </p>
          </form>
        )}

        {step === "contact" && (
          <form action={handleContactSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("plate")}
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm font-medium text-foreground"
            >
              <PenLine className="size-3.5" />
              Plaque : <span className="font-mono tracking-wider">{plate}</span>
            </button>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input id="full_name" name="full_name" required placeholder="Jean Dupont" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="06 12 34 56 78"
                value={phoneDisplay}
                onChange={(event) => setPhoneDisplay(formatPhoneInput(event.target.value))}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email (optionnel)</Label>
              <Input id="email" name="email" type="email" placeholder="jean.dupont@email.fr" className="h-11" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="postal_code">Code postal</Label>
              <Input id="postal_code" name="postal_code" required placeholder="75001" className="h-11" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="h-14 w-full rounded-xl text-base font-semibold disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Recevoir mon offre de reprise"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
