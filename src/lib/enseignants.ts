import { prisma } from "@/lib/prisma";

/** Enseignants validés (demande d'enseignement acceptée) pour les listes de choix. */
export async function enseignantsValides() {
  const liste = await prisma.enseignant.findMany({
    where: { demandesEnseignement: { some: { etat: "ACCEPTEE" } } },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });
  return liste.map((e) => ({ id: e.id, nom: `${e.prenom} ${e.nom}`, specialite: e.specialite }));
}
