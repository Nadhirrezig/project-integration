import Link from "next/link";
import type { EtatDemande, Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyRow } from "@/components/empty-row";
import { ListHeader } from "@/components/list-header";
import { NiveauComparaison } from "@/components/niveau-badge";
import { requireSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { optionsEtudiants, optionsFormations } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { AccepterButton, NouvelleDemandeDialog, RefuserDialog } from "./demande-actions";

const ONGLETS: { etat: EtatDemande; valeur: string; label: string }[] = [
  { etat: "EN_ATTENTE", valeur: "attente", label: "En attente" },
  { etat: "ACCEPTEE", valeur: "acceptees", label: "Acceptées" },
  { etat: "REFUSEE", valeur: "refusees", label: "Refusées" },
];

export default async function InscriptionsPage({ searchParams }: { searchParams: Promise<{ q?: string; onglet?: string }> }) {
  await requireSession();
  const { q: brut, onglet } = await searchParams;
  const q = brut?.trim() ?? "";

  const where: Prisma.DemandeInscriptionWhereInput = q
    ? {
        OR: [
          { etudiant: { nom: { contains: q, mode: "insensitive" } } },
          { etudiant: { prenom: { contains: q, mode: "insensitive" } } },
          { etudiant: { matricule: { contains: q, mode: "insensitive" } } },
          { formation: { libelle: { contains: q, mode: "insensitive" } } },
          { formation: { code: { in: (["TSIG", "ATBIG", "CAPI"] as const).filter((c) => c.includes(q.toUpperCase())) } } },
        ],
      }
    : {};

  const [demandes, etudiants, formations] = await Promise.all([
    prisma.demandeInscription.findMany({
      where,
      orderBy: [{ dateDemande: "desc" }, { id: "desc" }],
      include: { etudiant: true, formation: true },
    }),
    optionsEtudiants(),
    optionsFormations(),
  ]);
  const parEtat = (etat: EtatDemande) => demandes.filter((d) => d.etat === etat);

  const celluleEtudiant = (d: (typeof demandes)[number]) => (
    <TableCell className="pl-4">
      <Link href={`/etudiants/${d.etudiant.id}`} className="font-medium hover:underline">
        {d.etudiant.nom} {d.etudiant.prenom}
      </Link>
      <div className="font-mono text-xs text-muted-foreground">{d.etudiant.matricule}</div>
    </TableCell>
  );
  const celluleFormation = (d: (typeof demandes)[number]) => (
    <TableCell>
      <Link href={`/formations/${d.formation.id}`}>
        <Badge>{d.formation.code}</Badge>
      </Link>
      <span className="ml-2 text-sm text-muted-foreground">{d.formation.annee}</span>
    </TableCell>
  );
  const vide = (label: string) => (q ? "Aucune demande ne correspond à la recherche." : `Aucune demande ${label}.`);

  return (
    <div>
      <ListHeader
        title="Demandes d'inscription"
        count={demandes.length}
        searchPlaceholder="Étudiant, matricule ou formation…"
        action={<NouvelleDemandeDialog etudiants={etudiants} formations={formations} />}
      />

      <Tabs defaultValue={ONGLETS.some((o) => o.valeur === onglet) ? onglet : "attente"}>
        <TabsList>
          {ONGLETS.map((o) => (
            <TabsTrigger key={o.valeur} value={o.valeur}>
              {o.label} ({parEtat(o.etat).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="attente">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Étudiant</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Niveau de l&apos;étudiant / niveau requis</TableHead>
                    <TableHead>Date de demande</TableHead>
                    <TableHead className="pr-4 text-right">Décision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parEtat("EN_ATTENTE").length === 0 ? (
                    <EmptyRow colSpan={5} message={vide("en attente")} />
                  ) : (
                    parEtat("EN_ATTENTE").map((d) => (
                      <TableRow key={d.id}>
                        {celluleEtudiant(d)}
                        {celluleFormation(d)}
                        <TableCell>
                          <NiveauComparaison niveauEtudiant={d.etudiant.niveauEtude} niveauRequis={d.formation.niveauRequis} />
                        </TableCell>
                        <TableCell>{formatDate(d.dateDemande)}</TableCell>
                        <TableCell className="pr-4">
                          <div className="flex justify-end gap-2">
                            <AccepterButton demandeId={d.id} />
                            <RefuserDialog
                              demandeId={d.id}
                              etudiant={`${d.etudiant.prenom} ${d.etudiant.nom}`}
                              formation={`${d.formation.code} ${d.formation.annee}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acceptees">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Étudiant</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Niveau d&apos;étude</TableHead>
                    <TableHead className="pr-4">Date de demande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parEtat("ACCEPTEE").length === 0 ? (
                    <EmptyRow colSpan={4} message={vide("acceptée")} />
                  ) : (
                    parEtat("ACCEPTEE").map((d) => (
                      <TableRow key={d.id}>
                        {celluleEtudiant(d)}
                        {celluleFormation(d)}
                        <TableCell>{d.etudiant.niveauEtude}</TableCell>
                        <TableCell className="pr-4">{formatDate(d.dateDemande)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refusees">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Étudiant</TableHead>
                    <TableHead>Formation</TableHead>
                    <TableHead>Date de demande</TableHead>
                    <TableHead className="pr-4">Motif de refus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parEtat("REFUSEE").length === 0 ? (
                    <EmptyRow colSpan={4} message={vide("refusée")} />
                  ) : (
                    parEtat("REFUSEE").map((d) => (
                      <TableRow key={d.id}>
                        {celluleEtudiant(d)}
                        {celluleFormation(d)}
                        <TableCell>{formatDate(d.dateDemande)}</TableCell>
                        <TableCell className="pr-4">{d.motifRefus}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
