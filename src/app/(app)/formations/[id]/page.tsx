import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyRow } from "@/components/empty-row";
import { requireSession } from "@/lib/auth";
import { aujourdhuiUTC, formatDate, versInputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { FormationDialog } from "../formation-dialog";
import { AjouterModuleDialog, ModulesListe, type ModuleVue } from "./modules";

export default async function FormationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      semaines: { orderBy: { numero: "asc" } },
      modules: {
        orderBy: { id: "asc" },
        include: {
          matieres: {
            orderBy: { matiere: { nom: "asc" } },
            include: {
              matiere: {
                include: {
                  enseignant: true,
                  modules: { include: { module: { select: { formation: { select: { id: true, code: true } } } } } },
                },
              },
            },
          },
        },
      },
      demandesInscription: {
        where: { etat: "ACCEPTEE" },
        include: { etudiant: true },
        orderBy: { etudiant: { nom: "asc" } },
      },
      _count: { select: { seances: true } },
    },
  });
  if (!formation) notFound();

  const toutesMatieres = await prisma.matiere.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } });
  const dejaDansFormation = new Set(formation.modules.flatMap((m) => m.matieres.map((l) => l.matiereId)));
  const matieresDisponibles = toutesMatieres.filter((m) => !dejaDansFormation.has(m.id));

  const modules: ModuleVue[] = formation.modules.map((mod) => ({
    id: mod.id,
    nom: mod.nom,
    matieres: mod.matieres.map((l) => ({
      lienId: l.id,
      id: l.matiere.id,
      nom: l.matiere.nom,
      nbHeuresTotal: l.matiere.nbHeuresTotal,
      enseignant: l.matiere.enseignant ? `${l.matiere.enseignant.prenom} ${l.matiere.enseignant.nom}` : null,
      autresFormations: [
        ...new Set(l.matiere.modules.map((x) => x.module.formation).filter((f) => f.id !== formation.id).map((f) => f.code)),
      ],
    })),
  }));

  const aujourdhui = aujourdhuiUTC();
  const dateFin = formation.semaines.at(-1)?.dateFin;
  const nbMatieres = dejaDansFormation.size;
  const infos: [string, React.ReactNode][] = [
    ["Code", <Badge key="c">{formation.code}</Badge>],
    ["Libellé", formation.libelle],
    ["Année", formation.annee],
    ["Niveau requis", formation.niveauRequis],
    ["Date de début", formatDate(formation.dateDebut)],
    ["Date de fin", dateFin ? formatDate(dateFin) : "—"],
    ["Durée", `${formation.dureeSemaines} semaines`],
    ["Modules / matières", `${formation.modules.length} module(s) · ${nbMatieres} matière(s)`],
    ["Étudiants inscrits", formation.demandesInscription.length],
    ["Séances planifiées", formation._count.seances],
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/formations" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Retour aux formations
          </Link>
          <h2 className="text-xl font-semibold">
            {formation.code} — {formation.libelle}
          </h2>
        </div>
        <FormationDialog
          formation={{
            id: formation.id, code: formation.code, libelle: formation.libelle, annee: formation.annee,
            dateDebut: versInputDate(formation.dateDebut), dureeSemaines: formation.dureeSemaines, niveauRequis: formation.niveauRequis,
          }}
        />
      </div>

      <Tabs defaultValue="informations">
        <TabsList>
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="semaines">Semaines ({formation.semaines.length})</TabsTrigger>
          <TabsTrigger value="modules">Modules ({formation.modules.length})</TabsTrigger>
          <TabsTrigger value="etudiants">Étudiants ({formation.demandesInscription.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="informations">
          <Card>
            <CardContent>
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {infos.map(([label, valeur]) => (
                  <div key={label} className="border-b pb-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-medium">{valeur}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semaines">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">N°</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead className="pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formation.semaines.length === 0 ? (
                    <EmptyRow colSpan={4} message="Aucune semaine générée." />
                  ) : (
                    formation.semaines.map((s) => {
                      const enCours = s.dateDebut <= aujourdhui && aujourdhui <= s.dateFin;
                      return (
                        <TableRow key={s.id} className={enCours ? "bg-primary/5" : undefined}>
                          <TableCell className="pl-4 font-medium">Semaine {s.numero}</TableCell>
                          <TableCell>{formatDate(s.dateDebut)}</TableCell>
                          <TableCell>{formatDate(s.dateFin)}</TableCell>
                          <TableCell className="pr-4 text-right">{enCours && <Badge>En cours</Badge>}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Modules et matières</CardTitle>
              <AjouterModuleDialog formationId={formation.id} />
            </CardHeader>
            <CardContent>
              <ModulesListe modules={modules} matieresDisponibles={matieresDisponibles} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etudiants">
          <Card className="py-0">
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Matricule</TableHead>
                    <TableHead>Nom et prénom</TableHead>
                    <TableHead>CIN</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="pr-4">Date de demande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formation.demandesInscription.length === 0 ? (
                    <EmptyRow colSpan={5} message="Aucun étudiant inscrit dans cette formation." />
                  ) : (
                    formation.demandesInscription.map(({ etudiant: e, dateDemande, id: demandeId }) => (
                      <TableRow key={demandeId}>
                        <TableCell className="pl-4 font-mono text-xs">{e.matricule}</TableCell>
                        <TableCell className="font-medium">
                          {e.nom} {e.prenom}
                        </TableCell>
                        <TableCell>{e.cin}</TableCell>
                        <TableCell>{e.telephone}</TableCell>
                        <TableCell className="pr-4">{formatDate(dateDemande)}</TableCell>
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
