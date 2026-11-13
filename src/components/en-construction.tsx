import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Page provisoire, remplacée au fur et à mesure du développement.
export function EnConstruction({ titre }: { titre: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Construction className="size-10 text-muted-foreground" />
        <p className="text-lg font-medium">{titre}</p>
        <p className="text-sm text-muted-foreground">Page en cours de construction</p>
      </CardContent>
    </Card>
  );
}
