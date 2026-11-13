"use client";

import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/field-error";
import { FormDialog } from "@/components/form-dialog";
import { creerMatiere, modifierMatiere } from "@/lib/actions/matieres";

export type EnseignantOption = { id: number; nom: string; specialite: string };
export type MatiereValeurs = { id: number; nom: string; nbHeuresTotal: number; enseignantId: number | null };

export function MatiereDialog({
  matiere, enseignants, variant = "button",
}: { matiere?: MatiereValeurs; enseignants: EnseignantOption[]; variant?: "button" | "icon" }) {
  const edition = !!matiere;
  const trigger = !edition ? (
    <Button><Plus /> Ajouter</Button>
  ) : variant === "icon" ? (
    <Button variant="ghost" size="icon-sm" title="Modifier">
      <Pencil />
      <span className="sr-only">Modifier</span>
    </Button>
  ) : (
    <Button variant="outline"><Pencil /> Modifier</Button>
  );

  return (
    <FormDialog
      trigger={trigger}
      title={edition ? "Modifier la matière" : "Nouvelle matière"}
      description="Une matière est enseignée par un seul enseignant (validé)."
      action={edition ? modifierMatiere.bind(null, matiere.id) : creerMatiere}
    >
      {(state) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" defaultValue={state.fields?.nom ?? matiere?.nom} placeholder="Ex. Algorithmique" />
            <FieldError messages={state.errors?.nom} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nbHeuresTotal">Nombre d&apos;heures total</Label>
            <Input
              id="nbHeuresTotal" name="nbHeuresTotal" type="number" min={1}
              defaultValue={state.fields?.nbHeuresTotal ?? matiere?.nbHeuresTotal}
            />
            <FieldError messages={state.errors?.nbHeuresTotal} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="enseignantId">Enseignant</Label>
            <Select name="enseignantId" defaultValue={state.fields?.enseignantId ?? (matiere?.enseignantId ? String(matiere.enseignantId) : "aucun")}>
              <SelectTrigger id="enseignantId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aucun">— Non affecté —</SelectItem>
                {enseignants.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.nom} <span className="text-muted-foreground">({e.specialite})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.errors?.enseignantId} />
          </div>
        </>
      )}
    </FormDialog>
  );
}
