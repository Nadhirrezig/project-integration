"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { useActionToast } from "@/hooks/use-action-toast";
import { etatInitial, type ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

type Props = {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: Action;
  submitLabel?: string;
  children: (state: ActionResult) => React.ReactNode;
  className?: string;
};

/** Boîte de dialogue contenant un formulaire relié à une Server Action (toast + fermeture en cas de succès). */
export function FormDialog({ trigger, title, description, action, submitLabel = "Enregistrer", children, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={className ?? "sm:max-w-md"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {/* Le formulaire est démonté à la fermeture : son état repart de zéro à chaque ouverture */}
        <FormContent action={action} submitLabel={submitLabel} onSuccess={() => setOpen(false)}>
          {children}
        </FormContent>
      </DialogContent>
    </Dialog>
  );
}

function FormContent({
  action, submitLabel, onSuccess, children,
}: { action: Action; submitLabel: string; onSuccess: () => void; children: (state: ActionResult) => React.ReactNode }) {
  const [state, formAction, pending] = useActionState(action, etatInitial);
  useActionToast(state, onSuccess);

  return (
    <form action={formAction} className="space-y-4">
      {children(state)}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Annuler</Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
