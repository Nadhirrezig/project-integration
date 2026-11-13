"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aujourdhuiUTC } from "@/lib/format";
import type { ActionResult } from "@/lib/action-result";

const erreurFormulaire = (error: z.ZodError, fields?: Record<string, string>): ActionResult => ({
  success: false,
  message: "Veuillez corriger les erreurs du formulaire",
  errors: z.flattenError(error).fieldErrors,
  fields,
});

function rafraichir(matiereId?: number) {
  revalidatePath("/matieres");
  revalidatePath("/formations", "layout");
  revalidatePath("/");
  if (matiereId) revalidatePath(`/matieres/${matiereId}`);
}

// ───────── Matière ─────────

const matiereSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères"),
  nbHeuresTotal: z.coerce
    .number({ error: "Le nombre d'heures doit être un nombre" })
    .int("Le nombre d'heures doit être un entier")
    .min(1, "Le nombre d'heures doit être supérieur à 0")
    .max(1000, "Le nombre d'heures est trop élevé"),
  enseignantId: z.string(), // "aucun" ou id
});

function lireMatiere(formData: FormData) {
  const fields = {
    nom: String(formData.get("nom") ?? ""),
    nbHeuresTotal: String(formData.get("nbHeuresTotal") ?? ""),
    enseignantId: String(formData.get("enseignantId") || "aucun"),
  };
  return { fields, parsed: matiereSchema.safeParse(fields) };
}

/**
 * R6a : une matière est enseignée par UN seul enseignant, qui doit être validé
 * (demande d'enseignement acceptée). Renvoie l'id, null (aucun) ou un message d'erreur.
 */
async function verifierEnseignant(valeur: string): Promise<{ id: number | null } | { erreur: string }> {
  if (valeur === "aucun") return { id: null };
  const id = Number(valeur);
  const enseignant = await prisma.enseignant.findUnique({
    where: { id: Number.isInteger(id) ? id : -1 },
    include: { demandesEnseignement: { where: { etat: "ACCEPTEE" }, select: { id: true } } },
  });
  if (!enseignant) return { erreur: "Enseignant introuvable" };
  if (enseignant.demandesEnseignement.length === 0) {
    return { erreur: `${enseignant.prenom} ${enseignant.nom} n'a pas de demande d'enseignement acceptée` };
  }
  return { id: enseignant.id };
}

async function nomDejaPris(nom: string, saufId?: number) {
  return prisma.matiere.findFirst({
    where: { nom: { equals: nom, mode: "insensitive" }, ...(saufId ? { NOT: { id: saufId } } : {}) },
  });
}

export async function creerMatiere(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lireMatiere(formData);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  if (await nomDejaPris(parsed.data.nom)) {
    return { success: false, message: "Une matière porte déjà ce nom", errors: { nom: ["Une matière porte déjà ce nom"] }, fields };
  }
  const ens = await verifierEnseignant(parsed.data.enseignantId);
  if ("erreur" in ens) return { success: false, message: ens.erreur, errors: { enseignantId: [ens.erreur] }, fields };

  const matiere = await prisma.matiere.create({
    data: { nom: parsed.data.nom, nbHeuresTotal: parsed.data.nbHeuresTotal, enseignantId: ens.id },
  });
  rafraichir(matiere.id);
  return { success: true, message: `Matière « ${matiere.nom} » créée` };
}

export async function modifierMatiere(id: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const { fields, parsed } = lireMatiere(formData);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  const actuelle = await prisma.matiere.findUnique({ where: { id } });
  if (!actuelle) return { success: false, message: "Matière introuvable" };
  if (await nomDejaPris(parsed.data.nom, id)) {
    return { success: false, message: "Une matière porte déjà ce nom", errors: { nom: ["Une matière porte déjà ce nom"] }, fields };
  }
  const ens = await verifierEnseignant(parsed.data.enseignantId);
  if ("erreur" in ens) return { success: false, message: ens.erreur, errors: { enseignantId: [ens.erreur] }, fields };

  const data = { nom: parsed.data.nom, nbHeuresTotal: parsed.data.nbHeuresTotal, enseignantId: ens.id };

  // Changement d'enseignant : les séances à venir (à partir d'aujourd'hui) passent au nouvel enseignant,
  // les séances passées restent à l'ancien (journal et paie).
  if (ens.id !== actuelle.enseignantId) {
    const aujourdhui = aujourdhuiUTC();
    const futures = await prisma.seance.findMany({
      where: { matiereId: id, date: { gte: aujourdhui } },
      select: { id: true, date: true, heureDebut: true },
    });

    if (futures.length > 0) {
      if (ens.id === null) {
        return {
          success: false,
          message: `Impossible de retirer l'enseignant : ${futures.length} séance(s) à venir sont planifiées pour cette matière`,
          fields,
        };
      }
      // Le nouvel enseignant ne doit pas déjà avoir cours aux mêmes créneaux
      const conflits = await prisma.seance.count({
        where: {
          enseignantId: ens.id,
          matiereId: { not: id },
          OR: futures.map((s) => ({ date: s.date, heureDebut: s.heureDebut })),
        },
      });
      if (conflits > 0) {
        return {
          success: false,
          message: `Le nouvel enseignant a déjà ${conflits} séance(s) aux mêmes créneaux que cette matière`,
          errors: { enseignantId: ["Conflit d'emploi du temps"] },
          fields,
        };
      }
    }

    await prisma.$transaction([
      prisma.matiere.update({ where: { id }, data }),
      prisma.seance.updateMany({ where: { id: { in: futures.map((s) => s.id) } }, data: { enseignantId: ens.id! } }),
    ]);
    rafraichir(id);
    return {
      success: true,
      message: futures.length
        ? `Matière modifiée — ${futures.length} séance(s) à venir réaffectée(s) au nouvel enseignant`
        : "Matière modifiée",
    };
  }

  await prisma.matiere.update({ where: { id }, data });
  rafraichir(id);
  return { success: true, message: "Matière modifiée" };
}

export async function supprimerMatiere(id: number): Promise<ActionResult> {
  await requireSession();
  const nbSeances = await prisma.seance.count({ where: { matiereId: id } });
  if (nbSeances > 0) {
    return { success: false, message: `Impossible de supprimer : ${nbSeances} séance(s) sont planifiées pour cette matière` };
  }
  const matiere = await prisma.matiere.delete({ where: { id } });
  rafraichir();
  return { success: true, message: `Matière « ${matiere.nom} » supprimée` };
}

// ───────── Leçons ─────────

/** Place la leçon `leconId` à la position `position` (1..n) et renumérote toutes les leçons de 1 à n. */
async function renumeroter(matiereId: number, leconId?: number, position?: number) {
  const lecons = await prisma.lecon.findMany({ where: { matiereId }, orderBy: [{ ordre: "asc" }, { id: "asc" }] });
  const ordonnees = lecons.filter((l) => l.id !== leconId);
  const cible = lecons.find((l) => l.id === leconId);
  if (cible) {
    const index = Math.min(Math.max((position ?? ordonnees.length + 1) - 1, 0), ordonnees.length);
    ordonnees.splice(index, 0, cible);
  }
  await prisma.$transaction(
    ordonnees.map((l, i) => prisma.lecon.update({ where: { id: l.id }, data: { ordre: i + 1 } })),
  );
}

const leconSchema = z.object({
  titre: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères"),
  ordre: z.union([
    z.literal(""),
    z.coerce.number({ error: "L'ordre doit être un nombre" }).int("L'ordre doit être un entier").min(1, "L'ordre doit être supérieur ou égal à 1"),
  ]),
});

export async function ajouterLecon(matiereId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { titre: String(formData.get("titre") ?? ""), ordre: String(formData.get("ordre") ?? "") };
  const parsed = leconSchema.safeParse(fields);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  const nb = await prisma.lecon.count({ where: { matiereId } });
  const lecon = await prisma.lecon.create({ data: { matiereId, titre: parsed.data.titre, ordre: nb + 1 } });
  if (parsed.data.ordre !== "") await renumeroter(matiereId, lecon.id, parsed.data.ordre);
  rafraichir(matiereId);
  return { success: true, message: "Leçon ajoutée" };
}

export async function modifierLecon(leconId: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { titre: String(formData.get("titre") ?? ""), ordre: String(formData.get("ordre") ?? "") };
  const parsed = leconSchema.safeParse(fields);
  if (!parsed.success) return erreurFormulaire(parsed.error, fields);

  const lecon = await prisma.lecon.update({ where: { id: leconId }, data: { titre: parsed.data.titre } });
  if (parsed.data.ordre !== "" && parsed.data.ordre !== lecon.ordre) {
    await renumeroter(lecon.matiereId, lecon.id, parsed.data.ordre);
  }
  rafraichir(lecon.matiereId);
  return { success: true, message: "Leçon modifiée" };
}

export async function deplacerLecon(leconId: number, sens: "haut" | "bas"): Promise<ActionResult> {
  await requireSession();
  const lecon = await prisma.lecon.findUnique({ where: { id: leconId } });
  if (!lecon) return { success: false, message: "Leçon introuvable" };
  await renumeroter(lecon.matiereId, lecon.id, sens === "haut" ? lecon.ordre - 1 : lecon.ordre + 1);
  rafraichir(lecon.matiereId);
  return { success: true, message: sens === "haut" ? "Leçon déplacée vers le haut" : "Leçon déplacée vers le bas" };
}

export async function supprimerLecon(leconId: number): Promise<ActionResult> {
  await requireSession();
  const lecon = await prisma.lecon.delete({ where: { id: leconId } });
  await renumeroter(lecon.matiereId);
  rafraichir(lecon.matiereId);
  return { success: true, message: `Leçon « ${lecon.titre} » supprimée` };
}
