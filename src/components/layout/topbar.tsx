"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { titrePage } from "./nav";

export function Topbar({ nomAdmin }: { nomAdmin: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function deconnecter() {
    startTransition(async () => {
      const res = await logout();
      toast.success(res.message);
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-8">
      <h1 className="text-lg font-semibold text-primary">{titrePage(pathname)}</h1>
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserCircle className="size-5" />
          {nomAdmin}
        </span>
        <Button variant="outline" size="sm" onClick={deconnecter} disabled={pending}>
          <LogOut className="size-4" />
          Déconnexion
        </Button>
      </div>
    </header>
  );
}
