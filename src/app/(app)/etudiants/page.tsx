import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyRow } from "@/components/empty-row";
import { ListHeader } from "@/components/list-header";
import { supprimerEtudiant } from "@/lib/actions/etudiants";
import { requireSession } from "@/lib/auth";
import { formatTelephone } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function EtudiantsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession();
  const q = (await searchParams).q?.trim() ?? "";

  // Recherche par nom, prénom, matricule ou CIN
  const where: Prisma.EtudiantWhereInput = q
    ? {
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { prenom: { contains: q, mode: "insensitive" } },
          { matricule: { contains: q, mode: "insensitive" } },
          { cin: { contains: q } },
        ],
      }
    : {};

  const etudiants = await prisma.etudiant.findMany({
    where,
    orderBy: { matricule: "asc" },
    include: {
      demandesInscription: { where: { etat: "ACCEPTEE" }, include: { formation: { select: { id: true, code: true } } } },
    },
  });

  return (
    <div>
      <ListHeader
        title="Gestion des étudiants"
        count={etudiants.length}
        searchPlaceholder="Nom, matricule ou CIN…"
        action={
          <Button asChild>
            <Link href="/etudiants/nouveau"><Plus /> Ajouter</Link>
          </Button>
        }
      />
      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Matricule</TableHead>
                <TableHead>Nom et prénom</TableHead>
                <TableHead>CIN</TableHead>
                <TableHead>Niveau d&apos;étude</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Formation</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {etudiants.length === 0 ? (
                <EmptyRow colSpan={7} message={q ? "Aucun étudiant ne correspond à la recherche." : "Aucun étudiant enregistré."} />
              ) : (
                etudiants.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4 font-mono text-xs">{e.matricule}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/etudiants/${e.id}`} className="hover:underline">
                        {e.nom} {e.prenom}
                      </Link>
                    </TableCell>
                    <TableCell>{e.cin}</TableCell>
                    <TableCell>{e.niveauEtude}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatTelephone(e.telephone)}</TableCell>
                    <TableCell>
                      {e.demandesInscription.length === 0 ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        e.demandesInscription.map((d) => (
                          <Link key={d.id} href={`/formations/${d.formation.id}`}>
                            <Badge>{d.formation.code}</Badge>
                          </Link>
                        ))
                      )}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild title="Voir la fiche">
                          <Link href={`/etudiants/${e.id}`}><Eye /><span className="sr-only">Voir la fiche</span></Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild title="Modifier">
                          <Link href={`/etudiants/${e.id}/modifier`}><Pencil /><span className="sr-only">Modifier</span></Link>
                        </Button>
                        <ConfirmDialog
                          description={`Supprimer l'étudiant ${e.prenom} ${e.nom} (${e.matricule}) ? Ses demandes en attente ou refusées seront aussi supprimées.`}
                          action={supprimerEtudiant.bind(null, e.id)}
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
    </div>
  );
}
