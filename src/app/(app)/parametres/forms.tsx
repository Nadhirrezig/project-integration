"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/field-error";
import { changerMotDePasse, modifierParametres } from "@/lib/actions/parametres";
import { etatInitial } from "@/lib/action-result";
import { useActionToast } from "@/hooks/use-action-toast";

export function ParametresForm({ nomCentre, tauxHoraire }: { nomCentre: string; tauxHoraire: number }) {
  const [state, action, pending] = useActionState(modifierParametres, etatInitial);
  useActionToast(state);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nomCentre">Nom du centre</Label>
        <Input id="nomCentre" name="nomCentre" defaultValue={state.fields?.nomCentre ?? nomCentre} required />
        <FieldError messages={state.errors?.nomCentre} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tauxHoraire">Taux horaire (DT / heure)</Label>
        <Input id="tauxHoraire" name="tauxHoraire" type="number" step="0.001" min="0" defaultValue={state.fields?.tauxHoraire ?? tauxHoraire} required />
        <FieldError messages={state.errors?.tauxHoraire} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}

export function MotDePasseForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changerMotDePasse, etatInitial);
  useActionToast(state, () => formRef.current?.reset());

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ancien">Mot de passe actuel</Label>
        <Input id="ancien" name="ancien" type="password" autoComplete="current-password" required />
        <FieldError messages={state.errors?.ancien} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nouveau">Nouveau mot de passe</Label>
        <Input id="nouveau" name="nouveau" type="password" autoComplete="new-password" required />
        <FieldError messages={state.errors?.nouveau} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
        <Input id="confirmation" name="confirmation" type="password" autoComplete="new-password" required />
        <FieldError messages={state.errors?.confirmation} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Modification…" : "Modifier le mot de passe"}
      </Button>
    </form>
  );
}
