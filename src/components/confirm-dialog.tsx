"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

type Props = {
  title?: string;
  description: string;
  action: () => Promise<ActionResult>;
  confirmLabel?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

/** Confirmation avant suppression. Par défaut : bouton icône « corbeille ». */
export function ConfirmDialog({ title = "Confirmer la suppression", description, action, confirmLabel = "Supprimer", trigger, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmer() {
    startTransition(async () => {
      const res = await action();
      if (res.success) {
        toast.success(res.message);
        setOpen(false);
        onSuccess?.();
        if (res.redirectTo) router.push(res.redirectTo);
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon-sm" title="Supprimer" className="text-destructive hover:text-destructive">
            <Trash2 />
            <span className="sr-only">Supprimer</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirmer} disabled={pending}>
            {pending ? "Suppression…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
