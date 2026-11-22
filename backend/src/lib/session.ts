import { cookies } from "next/headers";
import { makeSigned, verifySigned } from "./crypto";
import { queryOne } from "./db";

export type SessionUser = { hub_user_id: string; name: string; email: string };
type SessionPayload = SessionUser & { exp: number };

const COOKIE = "fc_session";
const SECRET = () => process.env.FITNESS_SESSION_SECRET ?? "dev-fitness-session-secret";
const TTL = 7 * 24 * 3600;

export async function setSession(u: SessionUser) {
  const token = makeSigned({ ...u, exp: Math.floor(Date.now() / 1000) + TTL }, SECRET());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: TTL,
  });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const p = verifySigned<SessionPayload>(token, SECRET());
  if (!p || p.exp * 1000 < Date.now()) return null;
  return { hub_user_id: p.hub_user_id, name: p.name, email: p.email };
}
export async function requireUser(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("unauthenticated");
  return s;
}
export async function ensureProfile(userId: string) {
  await queryOne(
    `INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING user_id`,
    [userId],
  );
}
