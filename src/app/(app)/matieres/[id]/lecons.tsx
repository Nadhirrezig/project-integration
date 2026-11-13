"use client";

import { useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FieldError } from "@/components/field-error";
import { FormDialog } from "@/components/form-dialog";
import { ajouterLecon, deplacerLecon, modifierLecon, supprimerLecon } from "@/lib/actions/matieres";
import type { ActionResult } from "@/lib/action-result";

type Lecon = { id: number; titre: string; ordre: number };

function ChampsLecon({ state, lecon, ordreParDefaut }: { state: ActionResult; lecon?: Lecon; ordreParDefaut: number }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="titre">Titre</Label>
        <Input id="titre" name="titre" defaultValue={state.fields?.titre ?? lecon?.titre} autoFocus />
        <FieldError messages={state.errors?.titre} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ordre">Ordre</Label>
        <Input id="ordre" name="ordre" type="number" min={1} defaultValue={state.fields?.ordre ?? lecon?.ordre ?? ordreParDefaut} />
        <FieldError messages={state.errors?.ordre} />
      </div>
    </>
  );
}

export function AjouterLeconDialog({ matiereId, nbLecons }: { matiereId: number; nbLecons: number }) {
  return (
    <FormDialog
      trigger={<Button><Plus /> Ajouter une leçon</Button>}
      title="Nouvelle leçon"
      description="Les leçons suivantes sont décalées si vous choisissez un ordre déjà utilisé."
      action={ajouterLecon.bind(null, matiereId)}
    >
      {(state) => <ChampsLecon state={state} ordreParDefaut={nbLecons + 1} />}
    </FormDialog>
  );
}

export function LeconActions({ lecon, premier, dernier }: { lecon: Lecon; premier: boolean; dernier: boolean }) {
  const [pending, startTransition] = useTransition();
  const deplacer = (sens: "haut" | "bas") =>
    startTransition(async () => {
      const res = await deplacerLecon(lecon.id, sens);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    });

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon-sm" title="Monter" disabled={premier || pending} onClick={() => deplacer("haut")}>
        <ArrowUp />
        <span className="sr-only">Monter</span>
      </Button>
      <Button variant="ghost" size="icon-sm" title="Descendre" disabled={dernier || pending} onClick={() => deplacer("bas")}>
        <ArrowDown />
        <span className="sr-only">Descendre</span>
      </Button>
      <FormDialog
        trigger={
          <Button variant="ghost" size="icon-sm" title="Modifier">
            <Pencil />
            <span className="sr-only">Modifier</span>
          </Button>
        }
        title="Modifier la leçon"
        action={modifierLecon.bind(null, lecon.id)}
      >
        {(state) => <ChampsLecon state={state} lecon={lecon} ordreParDefaut={lecon.ordre} />}
      </FormDialog>
      <ConfirmDialog
        description={`Supprimer la leçon « ${lecon.titre} » ? Les leçons suivantes seront renumérotées.`}
        action={supprimerLecon.bind(null, lecon.id)}
      />
    </div>
  );
}
