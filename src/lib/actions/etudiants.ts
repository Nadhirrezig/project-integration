"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aujourdhuiUTC, depuisInputDate } from "@/lib/format";
import { ETATS_CIVILS, NIVEAUX_ETUDE } from "@/lib/referentiels";
import type { ActionResult } from "@/lib/action-result";

const CHAMPS = [
  "matricule", "nom", "prenom", "dateNaissance", "lieuNaissance", "nationalite", "cin",
  "adresse", "telephone", "niveauEtude", "etatCivil", "nomPereOuConjoint",
] as const;

const etudiantSchema = z.object({
  matricule: z.string().trim().toUpperCase().regex(/^ETU-\d{4}-\d{4}$/, "Format attendu : ETU-2026-0001"),
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères"),
  dateNaissance: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "La date de naissance est obligatoire")
    .refine((v) => {
      const d = depuisInputDate(v);
      const limite = aujourdhuiUTC();
      limite.setUTCFullYear(limite.getUTCFullYear() - 14);
      return d <= limite;
    }, "L'étudiant doit avoir au moins 14 ans"),
  lieuNaissance: z.string().trim().min(2, "Le lieu de naissance est obligatoire"),
  nationalite: z.string().trim().min(2, "La nationalité est obligatoire"),
  cin: z.string().trim().regex(/^\d{8}$/, "Le CIN doit contenir exactement 8 chiffres"),
  adresse: z.string().trim().min(5, "L'adresse doit contenir au moins 5 caractères"),
  telephone: z
    .string()
    .transform((v) => v.replace(/[\s.-]/g, "").replace(/^(\+216|00216)/, ""))
    .pipe(z.string().regex(/^\d{8}$/, "Le téléphone doit contenir 8 chiffres")),
  niveauEtude: z.enum(NIVEAUX_ETUDE, { error: "Veuillez choisir un niveau d'étude" }),
  etatCivil: z.enum(ETATS_CIVILS, { error: "Veuillez choisir un état civil" }),
  nomPereOuConjoint: z.string().trim().min(2, "Ce champ est obligatoire"),
});

function lire(formData: FormData) {
  const fields = Object.fromEntries(CHAMPS.map((k) => [k, String(formData.get(k) ?? "")])) as Record<string, string>;
  return { fields, parsed: etudiantSchema.safeParse(fields) };
}

/** Matricule et CIN doivent être uniques. */
async function verifierUnicite(data: { matricule: string; cin: string }, saufId?: number) {
  const exclure = saufId ? { NOT: { id: saufId } } : {};
  const errors: Record<string, string[]> = {};
  if (await prisma.etudiant.findFirst({ where: { matricule: data.matricule, ...exclure } })) {
    errors.matricule = ["Ce matricule est déjà attribué"];
  }
  if (await prisma.etudiant.findFirst({ where: { cin: data.cin, ...exclure } })) {
    errors.cin = ["Un étudiant avec ce CIN existe déjà"];
  }
  return Object.keys(errors).length ? errors : null;
}

function rafraichir(id?: number) {
  revalidatePath("/etudiants");
  revalidatePath("/inscriptions");
  revalidatePath("/formations", "layout");
  revalidatePath("/");
  if (id) revalidatePath(`/etudiants/${id}`);
}

export async function creerEtudiant(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lire(formData);
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les erreurs du formulaire", errors: z.flattenError(parsed.error).fieldErrors, fields };
  }
  const errors = await verifierUnicite(parsed.data);
  if (errors) return { success: false, message: "Matricule ou CIN déjà utilisé", errors, fields };

  const etudiant = await prisma.etudiant.create({
    data: { ...parsed.data, dateNaissance: depuisInputDate(parsed.data.dateNaissance) },
  });
  rafraichir(etudiant.id);
  return { success: true, message: `Étudiant ${etudiant.prenom} ${etudiant.nom} ajouté`, redirectTo: `/etudiants/${etudiant.id}` };
}

export async function modifierEtudiant(id: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lire(formData);
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les erreurs du formulaire", errors: z.flattenError(parsed.error).fieldErrors, fields };
  }
  const errors = await verifierUnicite(parsed.data, id);
  if (errors) return { success: false, message: "Matricule ou CIN déjà utilisé", errors, fields };

  await prisma.etudiant.update({
    where: { id },
    data: { ...parsed.data, dateNaissance: depuisInputDate(parsed.data.dateNaissance) },
  });
  rafraichir(id);
  return { success: true, message: "Étudiant modifié", redirectTo: `/etudiants/${id}` };
}

export async function supprimerEtudiant(id: number): Promise<ActionResult> {
  await requireSession();
  const [acceptees, absences] = await Promise.all([
    prisma.demandeInscription.count({ where: { etudiantId: id, etat: "ACCEPTEE" } }),
    prisma.absenceEtudiant.count({ where: { etudiantId: id } }),
  ]);
  if (acceptees > 0) return { success: false, message: "Impossible de supprimer : l'étudiant est inscrit dans une formation" };
  if (absences > 0) return { success: false, message: `Impossible de supprimer : ${absences} absence(s) enregistrée(s) pour cet étudiant` };

  const e = await prisma.etudiant.delete({ where: { id } });
  rafraichir();
  return { success: true, message: `Étudiant ${e.prenom} ${e.nom} supprimé`, redirectTo: "/etudiants" };
}
