import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

/** À appeler dans chaque page et Server Action protégée (en plus du middleware). */
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
