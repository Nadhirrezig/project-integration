"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Champ de recherche : met à jour le paramètre ?q= de l'URL (filtrage côté serveur). */
export function SearchInput({ placeholder = "Rechercher…" }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [valeur, setValeur] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (valeur.trim()) params.set("q", valeur.trim());
      else params.delete("q");
      const qs = params.toString();
      if (qs !== searchParams.toString()) router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [valeur, pathname, router, searchParams]);

  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={valeur} onChange={(e) => setValeur(e.target.value)} placeholder={placeholder} className="pl-8" />
    </div>
  );
}
