import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyRow } from "@/components/empty-row";
import { ListHeader } from "@/components/list-header";
import { supprimerMatiere } from "@/lib/actions/matieres";
import { requireSession } from "@/lib/auth";
import { enseignantsValides } from "@/lib/enseignants";
import { prisma } from "@/lib/prisma";
import { MatiereDialog } from "./matiere-dialog";

export default async function MatieresPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession();
  const q = (await searchParams).q?.trim() ?? "";

  const where: Prisma.MatiereWhereInput = q
    ? {
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { enseignant: { nom: { contains: q, mode: "insensitive" } } },
          { enseignant: { prenom: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  const [matieres, enseignants] = await Promise.all([
    prisma.matiere.findMany({
      where,
      orderBy: { nom: "asc" },
      include: {
        enseignant: true,
        modules: { include: { module: { select: { formation: { select: { id: true, code: true } } } } } },
        _count: { select: { lecons: true } },
      },
    }),
    enseignantsValides(),
  ]);

  return (
    <div>
      <ListHeader
        title="Gestion des matières"
        count={matieres.length}
        searchPlaceholder="Rechercher une matière ou un enseignant…"
        action={<MatiereDialog enseignants={enseignants} />}
      />
      <Card className="py-0">
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Nom</TableHead>
                <TableHead className="text-center">Nb heures</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead>Formations</TableHead>
                <TableHead className="text-center">Leçons</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matieres.length === 0 ? (
                <EmptyRow colSpan={6} message={q ? "Aucune matière ne correspond à la recherche." : "Aucune matière enregistrée."} />
              ) : (
                matieres.map((m) => {
                  const formations = [...new Map(m.modules.map((x) => [x.module.formation.id, x.module.formation])).values()];
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="pl-4 font-medium">
                        <Link href={`/matieres/${m.id}`} className="hover:underline">
                          {m.nom}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">{m.nbHeuresTotal} h</TableCell>
                      <TableCell>
                        {m.enseignant ? (
                          `${m.enseignant.prenom} ${m.enseignant.nom}`
                        ) : (
                          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Non affecté</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {formations.length === 0 && <span className="text-sm text-muted-foreground">—</span>}
                          {formations.map((f) => (
                            <Link key={f.id} href={`/formations/${f.id}`}>
                              <Badge variant="secondary">{f.code}</Badge>
                            </Link>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{m._count.lecons}</TableCell>
                      <TableCell className="pr-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild title="Leçons">
                            <Link href={`/matieres/${m.id}`}>
                              <ListOrdered />
                              <span className="sr-only">Leçons</span>
                            </Link>
                          </Button>
                          <MatiereDialog
                            variant="icon"
                            enseignants={enseignants}
                            matiere={{ id: m.id, nom: m.nom, nbHeuresTotal: m.nbHeuresTotal, enseignantId: m.enseignantId }}
                          />
                          <ConfirmDialog
                            description={`Supprimer la matière « ${m.nom} » ? Ses leçons seront aussi supprimées et elle sera retirée de toutes les formations.`}
                            action={supprimerMatiere.bind(null, m.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
