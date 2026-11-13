"use client";

import { useState, useTransition } from "react";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/field-error";
import { FormDialog } from "@/components/form-dialog";
import { accepterDemande, creerDemande, refuserDemande } from "@/lib/actions/inscriptions";
import { MOTIFS_REFUS } from "@/lib/referentiels";

export type EtudiantOption = { id: number; label: string; niveau: string };
export type FormationOption = { id: number; label: string; niveauRequis: string };

/** « Nouvelle demande » : étudiant + formation → EN_ATTENTE (R1). `etudiant` fixe l'étudiant (fiche étudiant). */
export function NouvelleDemandeDialog({
  etudiants, formations, etudiant,
}: { etudiants?: EtudiantOption[]; formations: FormationOption[]; etudiant?: EtudiantOption }) {
  return (
    <FormDialog
      trigger={<Button><Plus /> Nouvelle demande</Button>}
      title="Nouvelle demande d'inscription"
      description="La demande est créée à l'état « En attente »."
      action={creerDemande}
      submitLabel="Créer la demande"
    >
      {(state) => (
        <>
          <div className="space-y-2">
            <Label htmlFor="etudiantId">Étudiant</Label>
            {etudiant ? (
              <>
                <input type="hidden" name="etudiantId" value={etudiant.id} />
                <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">{etudiant.label}</p>
              </>
            ) : (
              <Select name="etudiantId" defaultValue={state.fields?.etudiantId || undefined}>
                <SelectTrigger id="etudiantId" className="w-full">
                  <SelectValue placeholder="Choisir un étudiant…" />
                </SelectTrigger>
                <SelectContent>
                  {etudiants?.map((e) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.label}
                      <span className="text-xs text-muted-foreground">— {e.niveau}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <FieldError messages={state.errors?.etudiantId} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="formationId">Formation</Label>
            <Select name="formationId" defaultValue={state.fields?.formationId || undefined}>
              <SelectTrigger id="formationId" className="w-full">
                <SelectValue placeholder="Choisir une formation…" />
              </SelectTrigger>
              <SelectContent>
                {formations.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.label}
                    <span className="text-xs text-muted-foreground">— requis : {f.niveauRequis}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={state.errors?.formationId} />
          </div>
        </>
      )}
    </FormDialog>
  );
}

export function AccepterButton({ demandeId }: { demandeId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      className="bg-emerald-600 text-white hover:bg-emerald-700"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await accepterDemande(demandeId);
          if (res.success) toast.success(res.message);
          else toast.error(res.message);
        })
      }
    >
      <Check /> Accepter
    </Button>
  );
}

export function RefuserDialog({ demandeId, etudiant, formation }: { demandeId: number; etudiant: string; formation: string }) {
  return (
    <FormDialog
      trigger={<Button size="sm" variant="destructive"><X /> Refuser</Button>}
      title="Refuser la demande"
      description={`${etudiant} — ${formation}. Le motif de refus est obligatoire.`}
      action={refuserDemande.bind(null, demandeId)}
      submitLabel="Confirmer le refus"
    >
      {(state) => <ChampsRefus motifInitial={state.fields?.motif} precisionInitiale={state.fields?.precision} errors={state.errors} />}
    </FormDialog>
  );
}

function ChampsRefus({
  motifInitial, precisionInitiale, errors,
}: { motifInitial?: string; precisionInitiale?: string; errors?: Record<string, string[] | undefined> }) {
  const [motif, setMotif] = useState(motifInitial ?? "");
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="motif">Motif</Label>
        <Select name="motif" value={motif} onValueChange={setMotif}>
          <SelectTrigger id="motif" className="w-full">
            <SelectValue placeholder="Choisir un motif…" />
          </SelectTrigger>
          <SelectContent>
            {MOTIFS_REFUS.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError messages={errors?.motif} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="precision">Précision {motif === "Autre" ? "(obligatoire)" : "(facultatif)"}</Label>
        <Textarea id="precision" name="precision" rows={3} defaultValue={precisionInitiale} placeholder="Ex. relevé de notes manquant" />
        <FieldError messages={errors?.precision} />
      </div>
    </>
  );
}
