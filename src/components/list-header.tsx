import { Suspense } from "react";
import { SearchInput } from "@/components/search-input";

/** En-tête standard des pages de liste : titre, compteur, recherche, bouton « Ajouter ». */
export function ListHeader({
  title, count, searchPlaceholder, action,
}: { title: string; count: number; searchPlaceholder?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{count} élément(s)</p>
      </div>
      <div className="flex flex-1 items-center justify-end gap-3">
        <Suspense>
          <SearchInput placeholder={searchPlaceholder} />
        </Suspense>
        {action}
      </div>
    </div>
  );
}
