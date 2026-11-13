import Link from "next/link";
import type { CodeFormation, Prisma } from "@prisma/client";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyRow } from "@/components/empty-row";
import { ListHeader } from "@/components/list-header";
import { supprimerFormation } from "@/lib/actions/formations";
import { requireSession } from "@/lib/auth";
import { formatDate, versInputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { FormationDialog } from "./formation-dialog";

const CODES: CodeFormation[] = ["TSIG", "ATBIG", "CAPI"];

export default async function FormationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession();
  const q = (await searchParams).q?.trim() ?? "";

  const where: Prisma.FormationWhereInput = q
    ? {
        OR: [
          { libelle: { contains: q, mode: "insensitive" } },
          { annee: { contains: q } },
          { niveauRequis: { contains: q, mode: "insensitive" } },
          { code: { in: CODES.filter((c) => c.includes(q.toUpperCase())) } },
        ],
      }
    : {};

  const formations = await prisma.formation.findMany({
    where,
    orderBy: [{ annee: "desc" }, { code: "asc" }],
    include: { _count: { select: { demandesInscription: { where: { etat: "ACCEPTEE" } } } } },
  });

  return (
    <div>
      <ListHeader
        title="Gestion des formations"
        count={formations.length}
        searchPlaceholder="Rechercher une formation…"
        action={<FormationDialog />}
      />
      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Année</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead className="text-center">Durée (semaines)</TableHead>
                <TableHead className="text-center">Étudiants inscrits</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formations.length === 0 ? (
                <EmptyRow colSpan={7} message={q ? "Aucune formation ne correspond à la recherche." : "Aucune formation enregistrée."} />
              ) : (
                formations.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="pl-4">
                      <Badge>{f.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/formations/${f.id}`} className="hover:underline">
                        {f.libelle}
                      </Link>
                    </TableCell>
                    <TableCell>{f.annee}</TableCell>
                    <TableCell>{formatDate(f.dateDebut)}</TableCell>
                    <TableCell className="text-center">{f.dureeSemaines}</TableCell>
                    <TableCell className="text-center">{f._count.demandesInscription}</TableCell>
                    <TableCell className="pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" asChild title="Voir le détail">
                          <Link href={`/formations/${f.id}`}>
                            <Eye />
                            <span className="sr-only">Voir le détail</span>
                          </Link>
                        </Button>
                        <FormationDialog
                          variant="icon"
                          formation={{
                            id: f.id, code: f.code, libelle: f.libelle, annee: f.annee,
                            dateDebut: versInputDate(f.dateDebut), dureeSemaines: f.dureeSemaines, niveauRequis: f.niveauRequis,
                          }}
                        />
                        <ConfirmDialog
                          description={`Supprimer la formation ${f.code} (${f.annee}) ? Ses semaines et modules seront aussi supprimés.`}
                          action={supprimerFormation.bind(null, f.id)}
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
