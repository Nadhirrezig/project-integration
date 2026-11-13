import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

// Mise en page des pages connectées : barre latérale + barre supérieure.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const [utilisateur, parametre] = await Promise.all([
    prisma.utilisateur.findUnique({ where: { id: session.userId }, select: { nom: true } }),
    prisma.parametre.findUnique({ where: { id: 1 }, select: { nomCentre: true } }),
  ]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar nomCentre={parametre?.nomCentre ?? "Centre de formation"} />
      <div className="min-w-0 flex-1">
        <Topbar nomAdmin={utilisateur?.nom ?? session.nom} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
