import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prochainMatricule } from "@/lib/matricule";
import { EtudiantForm } from "../etudiant-form";

export default async function NouvelEtudiantPage() {
  await requireSession();
  const matricule = await prochainMatricule();

  return (
    <div className="space-y-4">
      <div>
        <Link href="/etudiants" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Retour aux étudiants
        </Link>
        <h2 className="text-xl font-semibold">Nouvel étudiant</h2>
      </div>
      <EtudiantForm
        valeurs={{
          matricule, nom: "", prenom: "", dateNaissance: "", lieuNaissance: "", nationalite: "Tunisienne",
          cin: "", adresse: "", telephone: "", niveauEtude: "", etatCivil: "Célibataire", nomPereOuConjoint: "",
        }}
      />
    </div>
  );
}
