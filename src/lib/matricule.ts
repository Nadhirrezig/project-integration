import { prisma } from "@/lib/prisma";

/** Prochain matricule libre pour l'année en cours : ETU-2026-0001, ETU-2026-0002… */
export async function prochainMatricule() {
  const prefixe = `ETU-${new Date().getFullYear()}-`;
  const existants = await prisma.etudiant.findMany({
    where: { matricule: { startsWith: prefixe } },
    select: { matricule: true },
  });
  const max = existants.reduce((m, e) => Math.max(m, Number(e.matricule.slice(prefixe.length)) || 0), 0);
  return `${prefixe}${String(max + 1).padStart(4, "0")}`;
}
