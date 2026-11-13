import { ClipboardList, GraduationCap, Presentation, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EtatBadge } from "@/components/etat-badge";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { aujourdhuiUTC, formatDate } from "@/lib/format";

export default async function TableauDeBordPage() {
  await requireSession();
  const aujourdhui = aujourdhuiUTC();

  const [etudiantsInscrits, enseignants, formations, inscriptionsEnAttente, enseignementEnAttente, dernieresDemandes, seancesDuJour] =
    await Promise.all([
      prisma.etudiant.count({ where: { demandesInscription: { some: { etat: "ACCEPTEE" } } } }),
      prisma.enseignant.count({ where: { demandesEnseignement: { some: { etat: "ACCEPTEE" } } } }),
      prisma.formation.count(),
      prisma.demandeInscription.count({ where: { etat: "EN_ATTENTE" } }),
      prisma.demandeEnseignement.count({ where: { etat: "EN_ATTENTE" } }),
      prisma.demandeInscription.findMany({
        take: 5,
        orderBy: [{ dateDemande: "desc" }, { id: "desc" }],
        include: { etudiant: true, formation: true },
      }),
      prisma.seance.findMany({
        where: { date: aujourdhui },
        orderBy: [{ heureDebut: "asc" }, { formationId: "asc" }],
        include: { formation: true, matiere: true, enseignant: true, absenceEnseignant: true },
      }),
    ]);

  const stats: { label: string; valeur: number; detail: string; icon: LucideIcon }[] = [
    { label: "Étudiants inscrits", valeur: etudiantsInscrits, detail: "inscriptions acceptées", icon: Users },
    { label: "Enseignants", valeur: enseignants, detail: "enseignants validés", icon: Presentation },
    { label: "Formations", valeur: formations, detail: "TSIG, ATBIG, CAPI", icon: GraduationCap },
    {
      label: "Demandes en attente",
      valeur: inscriptionsEnAttente + enseignementEnAttente,
      detail: `${inscriptionsEnAttente} d'inscription · ${enseignementEnAttente} d'enseignement`,
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, valeur, detail, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold text-primary">{valeur}</p>
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
              </div>
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dernières demandes d&apos;inscription</CardTitle>
          </CardHeader>
          <CardContent>
            {dernieresDemandes.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune demande d&apos;inscription.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Étudiant</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>État</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dernieresDemandes.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.etudiant.prenom} {d.etudiant.nom}
                      </TableCell>
                      <TableCell>{d.formation.code}</TableCell>
                      <TableCell>{formatDate(d.dateDemande)}</TableCell>
                      <TableCell>
                        <EtatBadge etat={d.etat} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Séances d&apos;aujourd&apos;hui — {formatDate(aujourdhui)}</CardTitle>
          </CardHeader>
          <CardContent>
            {seancesDuJour.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aucune séance aujourd&apos;hui.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horaire</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Matière</TableHead>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Salle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seancesDuJour.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="whitespace-nowrap">
                        {s.heureDebut} – {s.heureFin}
                      </TableCell>
                      <TableCell>{s.formation.code}</TableCell>
                      <TableCell>{s.matiere.nom}</TableCell>
                      <TableCell>
                        {s.enseignant.prenom} {s.enseignant.nom}
                        {s.absenceEnseignant && <span className="ml-2 text-xs text-destructive">(absent)</span>}
                      </TableCell>
                      <TableCell>{s.salle}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
