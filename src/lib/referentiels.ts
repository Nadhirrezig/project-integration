// Listes de valeurs partagées (formulaires + contrôles serveur).

/** Niveaux d'étude, du plus bas au plus élevé (l'ordre sert à la comparaison). */
export const NIVEAUX_ETUDE = [
  "9ème année de base",
  "1ère année secondaire",
  "2ème année secondaire",
  "3ème année secondaire",
  "4ème année secondaire",
  "Baccalauréat",
  "Bac + 2",
  "Licence",
  "Master",
] as const;

export const ETATS_CIVILS = ["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"] as const;

export const MOTIFS_REFUS = ["Dossier incomplet", "Niveau insuffisant", "Autre"] as const;

/**
 * Compare le niveau de l'étudiant au niveau requis par la formation.
 * "ok" = suffisant, "insuffisant", ou "inconnu" si l'un des niveaux n'est pas dans la liste.
 */
export function comparerNiveau(niveauEtudiant: string, niveauRequis: string): "ok" | "insuffisant" | "inconnu" {
  const a = NIVEAUX_ETUDE.indexOf(niveauEtudiant as (typeof NIVEAUX_ETUDE)[number]);
  const b = NIVEAUX_ETUDE.indexOf(niveauRequis as (typeof NIVEAUX_ETUDE)[number]);
  if (a < 0 || b < 0) return "inconnu";
  return a >= b ? "ok" : "insuffisant";
}
