"use client";

import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/field-error";
import { FormDialog } from "@/components/form-dialog";
import { creerFormation, modifierFormation } from "@/lib/actions/formations";

export type FormationValeurs = {
  id: number;
  code: string;
  libelle: string;
  annee: string;
  dateDebut: string; // yyyy-MM-dd
  dureeSemaines: number;
  niveauRequis: string;
};

const LIBELLES: Record<string, string> = {
  TSIG: "Technicien Supérieur en Informatique de Gestion",
  ATBIG: "Agent Technique en Bureautique et Informatique de Gestion",
  CAPI: "Certificat d'Aptitude Professionnelle en Informatique",
};

export function FormationDialog({ formation, variant = "button" }: { formation?: FormationValeurs; variant?: "button" | "icon" }) {
  const edition = !!formation;
  const action = edition ? modifierFormation.bind(null, formation.id) : creerFormation;

  const trigger = edition ? (
    variant === "icon" ? (
      <Button variant="ghost" size="icon-sm" title="Modifier">
        <Pencil />
        <span className="sr-only">Modifier</span>
      </Button>
    ) : (
      <Button variant="outline">
        <Pencil /> Modifier
      </Button>
    )
  ) : (
    <Button>
      <Plus /> Ajouter
    </Button>
  );

  return (
    <FormDialog
      trigger={trigger}
      title={edition ? "Modifier la formation" : "Nouvelle formation"}
      description={
        edition
          ? "Les semaines sont régénérées si la date de début ou la durée change (uniquement si aucune séance n'est planifiée)."
          : "Les semaines de la formation seront générées automatiquement."
      }
      action={action}
      className="sm:max-w-lg"
    >
      {(state) => {
        const v = (k: keyof FormationValeurs) => state.fields?.[k] ?? (formation ? String(formation[k]) : "");
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Select name="code" defaultValue={v("code") || undefined}>
                  <SelectTrigger id="code" className="w-full">
                    <SelectValue placeholder="Choisir…" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(LIBELLES).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError messages={state.errors?.code} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input id="annee" name="annee" placeholder="2026-2027" defaultValue={v("annee") || "2026-2027"} />
                <FieldError messages={state.errors?.annee} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="libelle">Libellé</Label>
              <Input id="libelle" name="libelle" defaultValue={v("libelle")} placeholder={LIBELLES.TSIG} />
              <FieldError messages={state.errors?.libelle} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input id="dateDebut" name="dateDebut" type="date" defaultValue={v("dateDebut")} />
                <FieldError messages={state.errors?.dateDebut} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dureeSemaines">Durée (semaines)</Label>
                <Input id="dureeSemaines" name="dureeSemaines" type="number" min={1} max={104} defaultValue={v("dureeSemaines")} />
                <FieldError messages={state.errors?.dureeSemaines} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="niveauRequis">Niveau requis</Label>
              <Input id="niveauRequis" name="niveauRequis" defaultValue={v("niveauRequis")} placeholder="Baccalauréat" />
              <FieldError messages={state.errors?.niveauRequis} />
            </div>
          </>
        );
      }}
    </FormDialog>
  );
}
