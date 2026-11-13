import { prisma } from "@/lib/prisma";

/** Listes de choix pour les demandes d'inscription. */
export async function optionsEtudiants() {
  const liste = await prisma.etudiant.findMany({ orderBy: [{ nom: "asc" }, { prenom: "asc" }] });
  return liste.map((e) => ({ id: e.id, label: `${e.nom} ${e.prenom} (${e.matricule})`, niveau: e.niveauEtude }));
}

export async function optionsFormations() {
  const liste = await prisma.formation.findMany({ orderBy: [{ annee: "desc" }, { code: "asc" }] });
  return liste.map((f) => ({ id: f.id, label: `${f.code} — ${f.annee}`, niveauRequis: f.niveauRequis }));
}
