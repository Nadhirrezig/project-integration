"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MOTIFS_REFUS } from "@/lib/referentiels";
import type { ActionResult } from "@/lib/action-result";

const LIBELLE_ETAT = { EN_ATTENTE: "en attente", ACCEPTEE: "acceptée", REFUSEE: "refusée" } as const;

function rafraichir(etudiantId: number, formationId: number) {
  revalidatePath("/inscriptions");
  revalidatePath("/etudiants");
  revalidatePath(`/etudiants/${etudiantId}`);
  revalidatePath(`/formations/${formationId}`);
  revalidatePath("/formations");
  revalidatePath("/");
}

// R1 : un étudiant dépose une demande pour UNE formation → EN_ATTENTE
export async function creerDemande(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { etudiantId: String(formData.get("etudiantId") ?? ""), formationId: String(formData.get("formationId") ?? "") };
  const etudiantId = Number(fields.etudiantId);
  const formationId = Number(fields.formationId);
  const errors: Record<string, string[]> = {};
  if (!etudiantId) errors.etudiantId = ["Veuillez choisir un étudiant"];
  if (!formationId) errors.formationId = ["Veuillez choisir une formation"];
  if (Object.keys(errors).length) return { success: false, message: "Veuillez remplir tous les champs", errors, fields };

  const [etudiant, formation] = await Promise.all([
    prisma.etudiant.findUnique({ where: { id: etudiantId } }),
    prisma.formation.findUnique({ where: { id: formationId } }),
  ]);
  if (!etudiant || !formation) return { success: false, message: "Étudiant ou formation introuvable", fields };

  // Pas de doublon (même étudiant, même formation)
  const existante = await prisma.demandeInscription.findUnique({
    where: { etudiantId_formationId: { etudiantId, formationId } },
  });
  if (existante) {
    return {
      success: false,
      message: `${etudiant.prenom} ${etudiant.nom} a déjà une demande ${LIBELLE_ETAT[existante.etat]} pour ${formation.code} ${formation.annee}`,
      fields,
    };
  }

  await prisma.demandeInscription.create({ data: { etudiantId, formationId, etat: "EN_ATTENTE" } });
  rafraichir(etudiantId, formationId);
  return { success: true, message: `Demande enregistrée pour ${etudiant.prenom} ${etudiant.nom} (${formation.code}) — en attente` };
}

// R2 : EN_ATTENTE → ACCEPTEE
export async function accepterDemande(id: number): Promise<ActionResult> {
  await requireSession();
  const demande = await prisma.demandeInscription.findUnique({ where: { id }, include: { etudiant: true, formation: true } });
  if (!demande) return { success: false, message: "Demande introuvable" };
  if (demande.etat !== "EN_ATTENTE") return { success: false, message: `Cette demande est déjà ${LIBELLE_ETAT[demande.etat]}` };

  // Un étudiant ne peut être inscrit que dans une seule formation par année
  const autre = await prisma.demandeInscription.findFirst({
    where: { etudiantId: demande.etudiantId, etat: "ACCEPTEE", formation: { annee: demande.formation.annee }, NOT: { id } },
    include: { formation: true },
  });
  if (autre) {
    return {
      success: false,
      message: `${demande.etudiant.prenom} ${demande.etudiant.nom} est déjà inscrit(e) en ${autre.formation.code} pour ${autre.formation.annee}`,
    };
  }

  await prisma.demandeInscription.update({ where: { id }, data: { etat: "ACCEPTEE", motifRefus: null } });
  rafraichir(demande.etudiantId, demande.formationId);
  return { success: true, message: `Inscription de ${demande.etudiant.prenom} ${demande.etudiant.nom} en ${demande.formation.code} acceptée` };
}

// R2 : EN_ATTENTE → REFUSEE (motif obligatoire)
export async function refuserDemande(id: number, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  await requireSession();
  const fields = { motif: String(formData.get("motif") ?? ""), precision: String(formData.get("precision") ?? "").trim() };

  if (!MOTIFS_REFUS.includes(fields.motif as (typeof MOTIFS_REFUS)[number])) {
    return { success: false, message: "Le motif de refus est obligatoire", errors: { motif: ["Veuillez choisir un motif"] }, fields };
  }
  if (fields.motif === "Autre" && fields.precision.length < 3) {
    return { success: false, message: "Veuillez préciser le motif", errors: { precision: ["Précisez le motif (au moins 3 caractères)"] }, fields };
  }

  const demande = await prisma.demandeInscription.findUnique({ where: { id }, include: { etudiant: true, formation: true } });
  if (!demande) return { success: false, message: "Demande introuvable" };
  if (demande.etat !== "EN_ATTENTE") return { success: false, message: `Cette demande est déjà ${LIBELLE_ETAT[demande.etat]}` };

  const motifRefus = fields.motif === "Autre" ? `Autre : ${fields.precision}` : fields.precision ? `${fields.motif} : ${fields.precision}` : fields.motif;
  await prisma.demandeInscription.update({ where: { id }, data: { etat: "REFUSEE", motifRefus } });
  rafraichir(demande.etudiantId, demande.formationId);
  return { success: true, message: `Demande de ${demande.etudiant.prenom} ${demande.etudiant.nom} refusée` };
}
