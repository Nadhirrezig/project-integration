import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Session = JWT (HS256) signé avec SESSION_SECRET, stocké dans un cookie httpOnly « session ».
export const SESSION_COOKIE = "session";
const DUREE_SECONDES = 8 * 60 * 60; // 8 h

export type SessionPayload = {
  userId: number;
  login: string;
  nom: string;
};

function cle() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET manquant dans .env");
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_SECONDES}s`)
    .sign(cle());
}

/** Renvoie le contenu de la session, ou null si le jeton est absent, invalide ou expiré. */
export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, cle(), { algorithms: ["HS256"] });
    return {
      userId: Number(payload.userId),
      login: String(payload.login),
      nom: String(payload.nom),
    };
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encrypt(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SECONDES,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decrypt(store.get(SESSION_COOKIE)?.value);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
