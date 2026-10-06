"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, MessageCircleHeart } from "lucide-react";
import { submitPurchaseLead, type ActionResult } from "@/lib/actions/leads";
import { formatPhoneInput } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeadFormProps {
  vehicleId: number;
}

export function LeadForm({ vehicleId }: LeadFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [phoneDisplay, setPhoneDisplay] = useState("");

  function handleSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const response = await submitPurchaseLead({
        vehicleId,
        fullName: String(formData.get("full_name") ?? ""),
        phone: String(formData.get("phone") ?? "").replace(/\s+/g, ""),
        email: String(formData.get("email") ?? "") || undefined,
        postalCode: String(formData.get("postal_code") ?? ""),
      });
      setResult(response);
    });
  }

  if (result?.success) {
    return (
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
        <CheckCircle2 className="mx-auto size-7 text-blue-600" />
        <p className="mt-2 text-sm font-medium text-blue-800">{result.message}</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-4">
      {/* Intention pré-affichée pour réduire la friction : le visiteur n'a
       * qu'à confirmer ses coordonnées, pas à rédiger un message. */}
      <div className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-3 text-sm text-foreground">
        <MessageCircleHeart className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p>
          <span className="font-medium">« Je souhaite réserver un essai pour ce véhicule. »</span>
          <br />
          <span className="text-muted-foreground">Laissez vos coordonnées, le concessionnaire vous recontacte directement.</span>
        </p>
      </div>

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
        <Input id="postal_code" name="postal_code" required placeholder="69001" className="h-11" />
      </div>

      {result && !result.success && <p className="text-sm text-destructive">{result.message}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={isPending}
        className="h-12 w-full rounded-xl text-base font-semibold disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          "Réserver mon essai"
        )}
      </Button>
    </form>
  );
}
