import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyRow } from "@/components/empty-row";
import { requireSession } from "@/lib/auth";
import { enseignantsValides } from "@/lib/enseignants";
import { prisma } from "@/lib/prisma";
import { MatiereDialog } from "../matiere-dialog";
import { AjouterLeconDialog, LeconActions } from "./lecons";

export default async function MatiereDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [matiere, enseignants] = await Promise.all([
    prisma.matiere.findUnique({
      where: { id },
      include: {
        enseignant: true,
        lecons: { orderBy: { ordre: "asc" }, include: { _count: { select: { journaux: true } } } },
        modules: { include: { module: { include: { formation: { select: { id: true, code: true } } } } } },
        _count: { select: { seances: true } },
      },
    }),
    enseignantsValides(),
  ]);
  if (!matiere) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/matieres" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Retour aux matières
          </Link>
          <h2 className="text-xl font-semibold">{matiere.nom}</h2>
        </div>
        <MatiereDialog
          enseignants={enseignants}
          matiere={{ id: matiere.id, nom: matiere.nom, nbHeuresTotal: matiere.nbHeuresTotal, enseignantId: matiere.enseignantId }}
        />
      </div>

      <Card>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Nombre d&apos;heures</dt>
              <dd className="mt-1 font-medium">{matiere.nbHeuresTotal} h</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Enseignant</dt>
              <dd className="mt-1 font-medium">
                {matiere.enseignant ? (
                  `${matiere.enseignant.prenom} ${matiere.enseignant.nom}`
                ) : (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">Non affecté</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Formations</dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {matiere.modules.length === 0 && <span className="text-muted-foreground">—</span>}
                {matiere.modules.map((x) => (
                  <Link key={x.id} href={`/formations/${x.module.formation.id}`}>
                    <Badge variant="secondary">
                      {x.module.formation.code} · {x.module.nom}
                    </Badge>
                  </Link>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Séances planifiées</dt>
              <dd className="mt-1 font-medium">{matiere._count.seances}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leçons ({matiere.lecons.length})</CardTitle>
          <AjouterLeconDialog matiereId={matiere.id} nbLecons={matiere.lecons.length} />
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 pl-4">Ordre</TableHead>
                <TableHead>Titre</TableHead>
                <TableHead className="text-center">Séances (journal)</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matiere.lecons.length === 0 ? (
                <EmptyRow colSpan={4} message="Aucune leçon pour cette matière." />
              ) : (
                matiere.lecons.map((l, i) => (
                  <TableRow key={l.id}>
                    <TableCell className="pl-4">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {l.ordre}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{l.titre}</TableCell>
                    <TableCell className="text-center">{l._count.journaux}</TableCell>
                    <TableCell className="pr-4">
                      <LeconActions
                        lecon={{ id: l.id, titre: l.titre, ordre: l.ordre }}
                        premier={i === 0}
                        dernier={i === matiere.lecons.length - 1}
                      />
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
