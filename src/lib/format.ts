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
