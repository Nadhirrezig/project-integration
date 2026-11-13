"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";

/** Affiche un toast succès/erreur à chaque nouveau résultat de Server Action. */
export function useActionToast(state: ActionResult, onSuccess?: () => void) {
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      onSuccessRef.current?.();
    } else {
      toast.error(state.message);
    }
  }, [state]);
}
