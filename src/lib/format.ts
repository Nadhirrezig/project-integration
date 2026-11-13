// Affichage des dates au format dd/MM/yyyy (fuseau de Tunis).
const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Africa/Tunis",
});

export function formatDate(date: Date | string) {
  return FORMAT_DATE.format(new Date(date));
}

export function formatMontant(montant: number) {
  return `${montant.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} DT`;
}

/** Date du jour à minuit UTC (pour comparer avec les colonnes @db.Date). */
export function aujourdhuiUTC() {
  const [annee, mois, jour] = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" })
    .format(new Date())
    .split("-")
    .map(Number);
  return new Date(Date.UTC(annee, mois - 1, jour));
}

/** Valeur pour <input type="date"> (yyyy-MM-dd) d'une colonne @db.Date. */
export function versInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** "2026-09-14" → Date à minuit UTC. */
export function depuisInputDate(valeur: string) {
  return new Date(`${valeur}T00:00:00.000Z`);
}

/** "98456123" → "98 456 123" */
export function formatTelephone(tel: string) {
  return /^\d{8}$/.test(tel) ? `${tel.slice(0, 2)} ${tel.slice(2, 5)} ${tel.slice(5)}` : tel;
}
