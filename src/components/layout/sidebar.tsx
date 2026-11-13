"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, estActif } from "./nav";

export function Sidebar({ nomCentre }: { nomCentre: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-sidebar text-sidebar-foreground">
      <div className="sticky top-0 flex h-screen flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-md bg-white/10">
          <GraduationCap className="size-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold text-white">Gestion de Scolarité</p>
          <p className="text-xs text-sidebar-foreground/70">{nomCentre}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const actif = estActif(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                actif
                  ? "bg-white font-medium text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
      </div>
    </aside>
  );
}
