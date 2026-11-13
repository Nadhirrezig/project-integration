"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/action-result";

const parametresSchema = z.object({
  nomCentre: z.string().trim().min(2, "Le nom du centre doit contenir au moins 2 caractères"),
  tauxHoraire: z.coerce
    .number({ error: "Le taux horaire doit être un nombre" })
    .positive("Le taux horaire doit être supérieur à 0")
    .max(1000, "Le taux horaire est trop élevé"),
});

export async function modifierParametres(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = {
    nomCentre: String(formData.get("nomCentre") ?? ""),
    tauxHoraire: String(formData.get("tauxHoraire") ?? ""),
  };
  const parsed = parametresSchema.safeParse({ ...fields, tauxHoraire: fields.tauxHoraire.replace(",", ".") });
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les erreurs du formulaire", errors: z.flattenError(parsed.error).fieldErrors, fields };
  }

  await prisma.parametre.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });
  revalidatePath("/", "layout");
  return { success: true, message: "Paramètres enregistrés" };
}

const motDePasseSchema = z
  .object({
    ancien: z.string().min(1, "Le mot de passe actuel est obligatoire"),
    nouveau: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirmation: z.string(),
  })
  .refine((d) => d.nouveau === d.confirmation, {
    message: "La confirmation ne correspond pas au nouveau mot de passe",
    path: ["confirmation"],
  });

export async function changerMotDePasse(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = motDePasseSchema.safeParse({
    ancien: formData.get("ancien"),
    nouveau: formData.get("nouveau"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les erreurs du formulaire", errors: z.flattenError(parsed.error).fieldErrors };
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: session.userId } });
  if (!utilisateur || !(await bcrypt.compare(parsed.data.ancien, utilisateur.motDePasse))) {
    return { success: false, message: "Mot de passe actuel incorrect", errors: { ancien: ["Mot de passe actuel incorrect"] } };
  }

  await prisma.utilisateur.update({
    where: { id: utilisateur.id },
    data: { motDePasse: await bcrypt.hash(parsed.data.nouveau, 10) },
  });
  return { success: true, message: "Mot de passe modifié avec succès" };
}
