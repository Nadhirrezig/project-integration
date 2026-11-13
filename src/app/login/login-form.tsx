"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/actions/auth";
import { etatInitial } from "@/lib/action-result";

export function LoginForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState(login, etatInitial);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast.success(state.message);
      router.replace("/");
      router.refresh();
    } else {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login">Identifiant</Label>
        <Input id="login" name="login" defaultValue={state.fields?.login} autoComplete="username" autoFocus required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="motDePasse">Mot de passe</Label>
        <Input id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required />
      </div>
      {!state.success && state.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
