import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/session";

// Toutes les pages exigent une session, sauf /login.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);
  const pagePublique = pathname === "/login";

  if (!session && !pagePublique) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (session && pagePublique) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Exclut les fichiers statiques et internes de Next.js
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
