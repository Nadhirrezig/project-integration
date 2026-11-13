import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyRow } from "@/components/empty-row";
import { EtatBadge } from "@/components/etat-badge";
import { NiveauComparaison } from "@/components/niveau-badge";
import { supprimerEtudiant } from "@/lib/actions/etudiants";
import { requireSession } from "@/lib/auth";
import { formatDate, formatTelephone } from "@/lib/format";
import { optionsFormations } from "@/lib/options";
import { prisma } from "@/lib/prisma";
import { NouvelleDemandeDialog } from "../../inscriptions/demande-actions";

function Bloc({ titre, lignes }: { titre: string; lignes: [string, React.ReactNode][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titre}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {lignes.map(([label, valeur]) => (
            <div key={label} className="grid grid-cols-[10rem_1fr] gap-2 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{valeur}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default async function EtudiantFichePage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [e, formations] = await Promise.all([
    prisma.etudiant.findUnique({
      where: { id },
      include: {
        demandesInscription: { include: { formation: true }, orderBy: { dateDemande: "desc" } },
        absences: { select: { justifiee: true } },
      },
    }),
    optionsFormations(),
  ]);
  if (!e) notFound();

  const nbAbsences = e.absences.length;
  const nbJustifiees = e.absences.filter((a) => a.justifiee).length;
  const inscrit = e.demandesInscription.find((d) => d.etat === "ACCEPTEE");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/etudiants" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Retour aux étudiants
          </Link>
          <h2 className="flex items-center gap-3 text-xl font-semibold">
            {e.prenom} {e.nom}
            <span className="font-mono text-sm font-normal text-muted-foreground">{e.matricule}</span>
            {inscrit && <Badge>Inscrit(e) en {inscrit.formation.code}</Badge>}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/etudiants/${e.id}/modifier`}><Pencil /> Modifier</Link>
          </Button>
          <ConfirmDialog
            description={`Supprimer l'étudiant ${e.prenom} ${e.nom} ? Cette action est impossible s'il est inscrit ou a des absences.`}
            action={supprimerEtudiant.bind(null, e.id)}
            trigger={<Button variant="destructive"><Trash2 /> Supprimer</Button>}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Bloc
          titre="Identité"
          lignes={[
            ["Matricule", <span key="m" className="font-mono">{e.matricule}</span>],
            ["Nom et prénom", `${e.nom} ${e.prenom}`],
            ["Date de naissance", formatDate(e.dateNaissance)],
            ["Lieu de naissance", e.lieuNaissance],
            ["Nationalité", e.nationalite],
            ["CIN", e.cin],
          ]}
        />
        <Bloc
          titre="Coordonnées"
          lignes={[
            ["Adresse", e.adresse],
            ["Téléphone", formatTelephone(e.telephone)],
          ]}
        />
        <Bloc
          titre="Situation"
          lignes={[
            ["Niveau d'étude", e.niveauEtude],
            ["État civil", e.etatCivil],
            ["Père / conjoint", e.nomPereOuConjoint],
            [
              "Absences",
              nbAbsences === 0 ? "Aucune" : `${nbAbsences} (${nbJustifiees} justifiée(s), ${nbAbsences - nbJustifiees} non justifiée(s))`,
            ],
          ]}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Demandes d&apos;inscription ({e.demandesInscription.length})</CardTitle>
          <NouvelleDemandeDialog
            formations={formations}
            etudiant={{ id: e.id, label: `${e.nom} ${e.prenom} (${e.matricule})`, niveau: e.niveauEtude }}
          />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Formation</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Date de demande</TableHead>
                <TableHead>État</TableHead>
                <TableHead className="pr-4">Motif de refus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {e.demandesInscription.length === 0 ? (
                <EmptyRow colSpan={6} message="Aucune demande d'inscription." />
              ) : (
                e.demandesInscription.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-4">
                      <Link href={`/formations/${d.formation.id}`} className="font-medium hover:underline">
                        {d.formation.code}
                      </Link>{" "}
                      <span className="text-muted-foreground">— {d.formation.libelle}</span>
                    </TableCell>
                    <TableCell>{d.formation.annee}</TableCell>
                    <TableCell>
                      <NiveauComparaison niveauEtudiant={e.niveauEtude} niveauRequis={d.formation.niveauRequis} />
                    </TableCell>
                    <TableCell>{formatDate(d.dateDemande)}</TableCell>
                    <TableCell><EtatBadge etat={d.etat} /></TableCell>
                    <TableCell className="pr-4 text-sm">{d.motifRefus ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
