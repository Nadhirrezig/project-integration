"use client";

import { useActionState, useRef, useTransition } from "react";
import { toast } from "sonner";
import { etatInitial, type ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/**
 * Formulaire relié à une Server Action :
 * - soumis via onSubmit → React ne réinitialise pas le formulaire (les champs et listes gardent leur saisie en cas d'erreur) ;
 * - le toast est affiché dès le retour de l'action, même si le composant disparaît ensuite (ligne retirée d'un tableau…).
 */
export function useFormAction(action: Action, onSuccess?: (res: ActionResult) => void) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const [state, dispatch, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const res = await action(prev, formData);
    if (res.success) {
      toast.success(res.message);
      onSuccessRef.current?.(res);
    } else {
      toast.error(res.message);
    }
    return res;
  }, etatInitial);
  const [, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => dispatch(formData));
  }

  return [state, onSubmit, pending] as const;
}
