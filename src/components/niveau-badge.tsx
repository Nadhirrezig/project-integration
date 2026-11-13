import { CircleAlert, CircleCheck } from "lucide-react";
import { comparerNiveau } from "@/lib/referentiels";

/** Aide à la décision : niveau de l'étudiant face au niveau requis par la formation. */
export function NiveauComparaison({ niveauEtudiant, niveauRequis }: { niveauEtudiant: string; niveauRequis: string }) {
  const resultat = comparerNiveau(niveauEtudiant, niveauRequis);
  return (
    <div className="space-y-0.5 text-sm">
      <div className="flex items-center gap-1.5">
        {resultat === "ok" && <CircleCheck className="size-4 shrink-0 text-emerald-600" aria-label="Niveau suffisant" />}
        {resultat === "insuffisant" && <CircleAlert className="size-4 shrink-0 text-red-600" aria-label="Niveau insuffisant" />}
        <span className={resultat === "insuffisant" ? "font-medium text-red-700" : undefined}>{niveauEtudiant}</span>
      </div>
      <div className="pl-5.5 text-xs text-muted-foreground">Requis : {niveauRequis}</div>
    </div>
  );
}
