// R4/R5 : découpage automatique de la période d'une formation en semaines.
// Calcul en UTC (dates stockées en @db.Date) pour éviter tout décalage de fuseau.

const JOUR_MS = 24 * 60 * 60 * 1000;

export type SemaineGeneree = {
  numero: number;
  dateDebut: Date;
  dateFin: Date;
};

/** Ramène une date à minuit UTC (YYYY-MM-DD). */
function minuitUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Génère `dureeSemaines` semaines consécutives à partir de `dateDebut`.
 * Semaine n : du jour J+7(n-1) au jour J+7(n-1)+6.
 */
export function genererSemaines(dateDebut: Date, dureeSemaines: number): SemaineGeneree[] {
  const debut = minuitUTC(dateDebut);
  return Array.from({ length: dureeSemaines }, (_, i) => {
    const d = new Date(debut.getTime() + i * 7 * JOUR_MS);
    return {
      numero: i + 1,
      dateDebut: d,
      dateFin: new Date(d.getTime() + 6 * JOUR_MS),
    };
  });
}
