import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MotDePasseForm, ParametresForm } from "./forms";

export default async function ParametresPage() {
  await requireSession();
  const parametre = await prisma.parametre.findUnique({ where: { id: 1 } });

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Paramètres du centre</CardTitle>
          <CardDescription>Le taux horaire est utilisé pour le calcul de la paie des enseignants.</CardDescription>
        </CardHeader>
        <CardContent>
          <ParametresForm
            nomCentre={parametre?.nomCentre ?? ""}
            tauxHoraire={parametre?.tauxHoraire ?? 15}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>Mot de passe du compte administrateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <MotDePasseForm />
        </CardContent>
      </Card>
    </div>
  );
}
