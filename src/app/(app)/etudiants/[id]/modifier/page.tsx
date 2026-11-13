import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { versInputDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { EtudiantForm } from "../../etudiant-form";

export default async function ModifierEtudiantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const id = Number((await params).id);
  const e = Number.isInteger(id) ? await prisma.etudiant.findUnique({ where: { id } }) : null;
  if (!e) notFound();

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/etudiants/${e.id}`} className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour à la fiche
        </Link>
        <h2 className="text-xl font-semibold">
          Modifier — {e.prenom} {e.nom}
        </h2>
      </div>
      <EtudiantForm
        id={e.id}
        valeurs={{
          matricule: e.matricule, nom: e.nom, prenom: e.prenom, dateNaissance: versInputDate(e.dateNaissance),
          lieuNaissance: e.lieuNaissance, nationalite: e.nationalite, cin: e.cin, adresse: e.adresse,
          telephone: e.telephone, niveauEtude: e.niveauEtude, etatCivil: e.etatCivil, nomPereOuConjoint: e.nomPereOuConjoint,
        }}
      />
    </div>
  );
}
