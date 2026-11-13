"use client";

import Link from "next/link";

import { useRouter } from "next/navigation";
import { useFormAction } from "@/hooks/use-form-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/field-error";
import { creerEtudiant, modifierEtudiant } from "@/lib/actions/etudiants";
import { ETATS_CIVILS, NIVEAUX_ETUDE } from "@/lib/referentiels";

export type EtudiantValeurs = {
  matricule: string; nom: string; prenom: string; dateNaissance: string; lieuNaissance: string;
  nationalite: string; cin: string; adresse: string; telephone: string; niveauEtude: string;
  etatCivil: string; nomPereOuConjoint: string;
};

export function EtudiantForm({ id, valeurs }: { id?: number; valeurs: EtudiantValeurs }) {
  const router = useRouter();
  const [state, onSubmit, pending] = useFormAction(id ? modifierEtudiant.bind(null, id) : creerEtudiant, (res) => {
    if (res.redirectTo) router.push(res.redirectTo);
  });

  const v = (k: keyof EtudiantValeurs) => state.fields?.[k] ?? valeurs[k];
  const champ = (k: keyof EtudiantValeurs, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} name={k} defaultValue={v(k)} aria-invalid={!!state.errors?.[k]} {...props} />
      <FieldError messages={state.errors?.[k]} />
    </div>
  );
  const liste = (k: keyof EtudiantValeurs, label: string, options: readonly string[]) => (
    <div className="space-y-2">
      <Label htmlFor={k}>{label}</Label>
      <Select name={k} defaultValue={v(k) || undefined}>
        <SelectTrigger id={k} className="w-full" aria-invalid={!!state.errors?.[k]}>
          <SelectValue placeholder="Choisir…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError messages={state.errors?.[k]} />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>Le matricule est proposé automatiquement mais reste modifiable.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {champ("matricule", "Matricule", { placeholder: "ETU-2026-0001", className: "font-mono" })}
          {champ("cin", "CIN", { inputMode: "numeric", maxLength: 8, placeholder: "8 chiffres" })}
          {champ("nom", "Nom")}
          {champ("prenom", "Prénom")}
          {champ("dateNaissance", "Date de naissance", { type: "date" })}
          {champ("lieuNaissance", "Lieu de naissance")}
          {champ("nationalite", "Nationalité")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">{champ("adresse", "Adresse")}</div>
          {champ("telephone", "Téléphone", { inputMode: "tel", placeholder: "8 chiffres, ex. 98 456 123" })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Situation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {liste("niveauEtude", "Niveau d'étude", NIVEAUX_ETUDE)}
          {liste("etatCivil", "État civil", ETATS_CIVILS)}
          {champ("nomPereOuConjoint", "Nom du père ou du conjoint")}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <Link href={id ? `/etudiants/${id}` : "/etudiants"}>Annuler</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : id ? "Enregistrer les modifications" : "Ajouter l'étudiant"}
        </Button>
      </div>
    </form>
  );
}
