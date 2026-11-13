"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import type { ActionResult } from "@/lib/action-result";

const loginSchema = z.object({
  login: z.string().trim().min(1, "L'identifiant est obligatoire"),
  motDePasse: z.string().min(1, "Le mot de passe est obligatoire"),
});

export async function login(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    login: formData.get("login"),
    motDePasse: formData.get("motDePasse"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: "Veuillez remplir tous les champs",
      errors: z.flattenError(parsed.error).fieldErrors,
      fields: { login: String(formData.get("login") ?? "") },
    };
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { login: parsed.data.login } });
  const valide = utilisateur && (await bcrypt.compare(parsed.data.motDePasse, utilisateur.motDePasse));
  if (!utilisateur || !valide) {
    return { success: false, message: "Identifiant ou mot de passe incorrect", fields: { login: parsed.data.login } };
  }

  await createSession({ userId: utilisateur.id, login: utilisateur.login, nom: utilisateur.nom });
  return { success: true, message: `Bienvenue, ${utilisateur.nom}` };
}

export async function logout(): Promise<ActionResult> {
  await deleteSession();
  return { success: true, message: "Vous êtes déconnecté" };
}
