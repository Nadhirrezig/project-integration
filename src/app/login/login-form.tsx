"use client";

import { useRouter } from "next/navigation";
import { useFormAction } from "@/hooks/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [state, onSubmit, pending] = useFormAction(login, () => {
    router.replace("/");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
