import type { EtatDemande } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ETATS: Record<EtatDemande, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-amber-100 text-amber-800" },
  ACCEPTEE: { label: "Acceptée", className: "bg-emerald-100 text-emerald-800" },
  REFUSEE: { label: "Refusée", className: "bg-red-100 text-red-800" },
};

export function EtatBadge({ etat }: { etat: EtatDemande }) {
  const { label, className } = ETATS[etat];
  return <Badge className={cn("border-transparent", className)}>{label}</Badge>;
}
