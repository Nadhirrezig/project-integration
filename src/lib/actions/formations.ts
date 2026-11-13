"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { genererSemaines } from "@/lib/semaines";
import { depuisInputDate } from "@/lib/format";
import type { ActionResult } from "@/lib/action-result";

const erreurFormulaire = (error: z.ZodError, fields?: Record<string, string>): ActionResult => ({
  success: false,
  message: "Veuillez corriger les erreurs du formulaire",
  errors: z.flattenError(error).fieldErrors,
  fields,
});

function rafraichir(formationId?: number) {
  revalidatePath("/formations");
  revalidatePath("/matieres");
  revalidatePath("/");
  if (formationId) revalidatePath(`/formations/${formationId}`);
}

// ───────── Formation ─────────

const formationSchema = z.object({
  code: z.enum(["TSIG", "ATBIG", "CAPI"], { error: "Veuillez choisir un code de formation" }),
  libelle: z.string().trim().min(3, "Le libellé doit contenir au moins 3 caractères"),
  annee: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Format attendu : 2026-2027")
    .refine((a) => Number(a.slice(5)) === Number(a.slice(0, 4)) + 1, "Les deux années doivent se suivre (ex. 2026-2027)"),
  dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "La date de début est obligatoire"),
  dureeSemaines: z.coerce
    .number({ error: "La durée doit être un nombre" })
    .int("La durée doit être un nombre entier")
    .min(1, "La durée doit être d'au moins 1 semaine")
    .max(104, "La durée ne peut pas dépasser 104 semaines"),
  niveauRequis: z.string().trim().min(2, "Le niveau requis est obligatoire"),
});

function lireFormation(formData: FormData) {
  const fields = Object.fromEntries(
    ["code", "libelle", "annee", "dateDebut", "dureeSemaines", "niveauRequis"].map((k) => [k, String(formData.get(k) ?? "")]),
  );
  return { fields, parsed: formationSchema.safeParse(fields) };
}

export async function creerFormation(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lireFormation(formData);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);
  const { dateDebut, ...data } = parsed.data;

  const existe = await prisma.formation.findUnique({ where: { code_annee: { code: data.code, annee: data.annee } } });
  if (existe) {
    return { success: false, message: `La formation ${data.code} existe déjà pour l'année ${data.annee}`, fields };
  }

  // R4/R5 : découpage automatique de la période en semaines
  const debut = depuisInputDate(dateDebut);
  const formation = await prisma.formation.create({
    data: { ...data, dateDebut: debut, semaines: { create: genererSemaines(debut, data.dureeSemaines) } },
  });
  rafraichir(formation.id);
  return { success: true, message: `Formation ${data.code} créée (${data.dureeSemaines} semaines générées)` };
}

export async function modifierFormation(id: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lireFormation(formData);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);
  const { dateDebut, ...data } = parsed.data;

  const actuelle = await prisma.formation.findUnique({ where: { id } });
  if (!actuelle) return { success: false, message: "Formation introuvable" };

  const doublon = await prisma.formation.findFirst({ where: { code: data.code, annee: data.annee, NOT: { id } } });
  if (doublon) {
    return { success: false, message: `La formation ${data.code} existe déjà pour l'année ${data.annee}`, fields };
  }

  const debut = depuisInputDate(dateDebut);
  const periodeModifiee =
    debut.getTime() !== actuelle.dateDebut.getTime() || data.dureeSemaines !== actuelle.dureeSemaines;

  if (periodeModifiee) {
    // Les semaines ne sont régénérées que si aucune séance n'est encore planifiée
    const nbSeances = await prisma.seance.count({ where: { formationId: id } });
    if (nbSeances > 0) {
      return {
        success: false,
        message: `Impossible de modifier la date de début ou la durée : ${nbSeances} séance(s) sont déjà planifiées`,
        fields,
      };
    }
    await prisma.$transaction([
      prisma.semaine.deleteMany({ where: { formationId: id } }),
      prisma.formation.update({
        where: { id },
        data: { ...data, dateDebut: debut, semaines: { create: genererSemaines(debut, data.dureeSemaines) } },
      }),
    ]);
    rafraichir(id);
    return { success: true, message: `Formation modifiée — ${data.dureeSemaines} semaines régénérées` };
  }

  await prisma.formation.update({ where: { id }, data: { ...data, dateDebut: debut } });
  rafraichir(id);
  return { success: true, message: "Formation modifiée" };
}

export async function supprimerFormation(id: number): Promise<ActionResult> {
  await requireSession();
  const [nbAcceptes, nbSeances] = await Promise.all([
    prisma.demandeInscription.count({ where: { formationId: id, etat: "ACCEPTEE" } }),
    prisma.seance.count({ where: { formationId: id } }),
  ]);
  if (nbAcceptes > 0) {
    return { success: false, message: `Impossible de supprimer : ${nbAcceptes} étudiant(s) inscrit(s) dans cette formation` };
  }
  if (nbSeances > 0) {
    return { success: false, message: `Impossible de supprimer : ${nbSeances} séance(s) sont planifiées` };
  }
  await prisma.formation.delete({ where: { id } });
  rafraichir();
  return { success: true, message: "Formation supprimée" };
}

// ───────── Modules ─────────

const moduleSchema = z.object({
  nom: z.string().trim().min(2, "Le nom du module doit contenir au moins 2 caractères"),
});

export async function ajouterModule(formationId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { nom: String(formData.get("nom") ?? "") };
  const parsed = moduleSchema.safeParse(fields);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  const doublon = await prisma.module.findFirst({
    where: { formationId, nom: { equals: parsed.data.nom, mode: "insensitive" } },
  });
  if (doublon) return { success: false, message: "Un module porte déjà ce nom dans cette formation", fields };

  await prisma.module.create({ data: { formationId, nom: parsed.data.nom } });
  rafraichir(formationId);
  return { success: true, message: "Module ajouté" };
}

export async function renommerModule(moduleId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { nom: String(formData.get("nom") ?? "") };
  const parsed = moduleSchema.safeParse(fields);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  const mod = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!mod) return { success: false, message: "Module introuvable" };
  const doublon = await prisma.module.findFirst({
    where: { formationId: mod.formationId, nom: { equals: parsed.data.nom, mode: "insensitive" }, NOT: { id: moduleId } },
  });
  if (doublon) return { success: false, message: "Un module porte déjà ce nom dans cette formation", fields };

  await prisma.module.update({ where: { id: moduleId }, data: { nom: parsed.data.nom } });
  rafraichir(mod.formationId);
  return { success: true, message: "Module renommé" };
}

/** Une matière ne peut pas quitter une formation si des séances y sont déjà planifiées. */
async function seancesBloquantes(formationId: number, matiereId: number) {
  return prisma.seance.count({ where: { formationId, matiereId } });
}

export async function supprimerModule(moduleId: number): Promise<ActionResult> {
  await requireSession();
  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { matieres: { include: { matiere: true } } },
  });
  if (!mod) return { success: false, message: "Module introuvable" };

  for (const { matiere } of mod.matieres) {
    const n = await seancesBloquantes(mod.formationId, matiere.id);
    if (n > 0) {
      return {
        success: false,
        message: `Impossible de supprimer : la matière « ${matiere.nom} » a ${n} séance(s) planifiée(s) dans cette formation`,
      };
    }
  }
  await prisma.module.delete({ where: { id: moduleId } });
  rafraichir(mod.formationId);
  return { success: true, message: `Module « ${mod.nom} » supprimé` };
}

// ───────── Matières d'un module (R7) ─────────

export async function ajouterMatiereAuModule(moduleId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const matiereId = Number(formData.get("matiereId"));
  if (!matiereId) return { success: false, message: "Veuillez choisir une matière", errors: { matiereId: ["Veuillez choisir une matière"] } };

  const [mod, matiere] = await Promise.all([
    prisma.module.findUnique({ where: { id: moduleId } }),
    prisma.matiere.findUnique({ where: { id: matiereId } }),
  ]);
  if (!mod || !matiere) return { success: false, message: "Module ou matière introuvable" };

  // R7 : une matière peut appartenir à plusieurs formations, mais une seule fois par formation
  const dejaDansFormation = await prisma.moduleMatiere.findFirst({
    where: { matiereId, module: { formationId: mod.formationId } },
    include: { module: true },
  });
  if (dejaDansFormation) {
    return {
      success: false,
      message: `« ${matiere.nom} » fait déjà partie du module « ${dejaDansFormation.module.nom} » de cette formation`,
    };
  }

  await prisma.moduleMatiere.create({ data: { moduleId, matiereId } });
  rafraichir(mod.formationId);
  return { success: true, message: `« ${matiere.nom} » ajoutée au module « ${mod.nom} »` };
}

export async function retirerMatiereDuModule(moduleMatiereId: number): Promise<ActionResult> {
  await requireSession();
  const lien = await prisma.moduleMatiere.findUnique({
    where: { id: moduleMatiereId },
    include: { module: true, matiere: true },
  });
  if (!lien) return { success: false, message: "Lien introuvable" };

  const n = await seancesBloquantes(lien.module.formationId, lien.matiereId);
  if (n > 0) {
    return { success: false, message: `Impossible de retirer « ${lien.matiere.nom} » : ${n} séance(s) planifiée(s) dans cette formation` };
  }
  await prisma.moduleMatiere.delete({ where: { id: moduleMatiereId } });
  rafraichir(lien.module.formationId);
  return { success: true, message: `« ${lien.matiere.nom} » retirée du module` };
}
