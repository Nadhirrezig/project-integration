"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FieldError } from "@/components/field-error";
import { FormDialog } from "@/components/form-dialog";
import { useActionToast } from "@/hooks/use-action-toast";
import {
  ajouterMatiereAuModule, ajouterModule, renommerModule, retirerMatiereDuModule, supprimerModule,
} from "@/lib/actions/formations";
import { etatInitial } from "@/lib/action-result";

export type ModuleVue = {
  id: number;
  nom: string;
  matieres: { lienId: number; id: number; nom: string; nbHeuresTotal: number; enseignant: string | null; autresFormations: string[] }[];
};

export function AjouterModuleDialog({ formationId }: { formationId: number }) {
  return (
    <FormDialog
      trigger={<Button><Plus /> Ajouter un module</Button>}
      title="Nouveau module"
      action={ajouterModule.bind(null, formationId)}
    >
      {(state) => (
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du module</Label>
          <Input id="nom" name="nom" defaultValue={state.fields?.nom} placeholder="Ex. Programmation" autoFocus />
          <FieldError messages={state.errors?.nom} />
        </div>
      )}
    </FormDialog>
  );
}

function RenommerModuleDialog({ mod }: { mod: ModuleVue }) {
  return (
    <FormDialog
      trigger={
        <Button variant="ghost" size="icon-sm" title="Renommer">
          <Pencil />
          <span className="sr-only">Renommer</span>
        </Button>
      }
      title="Renommer le module"
      action={renommerModule.bind(null, mod.id)}
    >
      {(state) => (
        <div className="space-y-2">
          <Label htmlFor="nom">Nom du module</Label>
          <Input id="nom" name="nom" defaultValue={state.fields?.nom ?? mod.nom} autoFocus />
          <FieldError messages={state.errors?.nom} />
        </div>
      )}
    </FormDialog>
  );
}

function AjouterMatiereForm({ moduleId, options }: { moduleId: number; options: { id: number; nom: string }[] }) {
  const [valeur, setValeur] = useState("");
  const [state, action, pending] = useActionState(ajouterMatiereAuModule.bind(null, moduleId), etatInitial);
  useActionToast(state, () => setValeur(""));

  return (
    <form action={action} className="flex items-center gap-2">
      <Select name="matiereId" value={valeur} onValueChange={setValeur}>
        <SelectTrigger className="w-72" aria-label="Matière à ajouter">
          <SelectValue placeholder={options.length ? "Choisir une matière…" : "Toutes les matières sont déjà affectées"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((m) => (
            <SelectItem key={m.id} value={String(m.id)}>
              {m.nom}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" disabled={pending || !valeur}>
        <Plus /> Ajouter la matière
      </Button>
    </form>
  );
}

export function ModulesListe({ modules, matieresDisponibles }: { modules: ModuleVue[]; matieresDisponibles: { id: number; nom: string }[] }) {
  if (modules.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aucun module pour cette formation.</p>;
  }
  return (
    <div className="space-y-4">
      {modules.map((mod) => (
        <section key={mod.id} aria-label={`Module ${mod.nom}`} className="rounded-lg border">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{mod.nom}</span>
              <span className="text-xs text-muted-foreground">
                {mod.matieres.length} matière(s) · {mod.matieres.reduce((t, m) => t + m.nbHeuresTotal, 0)} h
              </span>
            </div>
            <div className="flex items-center gap-1">
              <RenommerModuleDialog mod={mod} />
              <ConfirmDialog
                description={`Supprimer le module « ${mod.nom} » ? Les matières ne sont pas supprimées, elles sont seulement retirées de cette formation.`}
                action={supprimerModule.bind(null, mod.id)}
              />
            </div>
          </div>
          <ul className="divide-y">
            {mod.matieres.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">Aucune matière dans ce module.</li>
            )}
            {mod.matieres.map((m) => (
              <li key={m.lienId} className="flex items-center justify-between px-4 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{m.nom}</span>
                  <span className="text-muted-foreground">· {m.nbHeuresTotal} h</span>
                  {m.enseignant ? (
                    <span className="text-muted-foreground">· {m.enseignant}</span>
                  ) : (
                    <Badge variant="outline" className="text-amber-700">Non affecté</Badge>
                  )}
                  {m.autresFormations.map((c) => (
                    <Badge key={c} variant="secondary" title="Aussi enseignée dans cette formation">
                      aussi en {c}
                    </Badge>
                  ))}
                </div>
                <ConfirmDialog
                  title="Retirer la matière"
                  description={`Retirer « ${m.nom} » du module « ${mod.nom} » ? La matière reste disponible pour les autres formations.`}
                  confirmLabel="Retirer"
                  action={retirerMatiereDuModule.bind(null, m.lienId)}
                  trigger={
                    <Button variant="ghost" size="icon-sm" title="Retirer" className="text-destructive hover:text-destructive">
                      <X />
                      <span className="sr-only">Retirer</span>
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
          <div className="border-t px-4 py-3">
            <AjouterMatiereForm moduleId={mod.id} options={matieresDisponibles} />
          </div>
        </section>
      ))}
    </div>
  );
}
