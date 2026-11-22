import { NextRequest, NextResponse } from "next/server";
import { makeSigned, verifySigned } from "./crypto";

export type ApiUser = { hub_user_id: string; name: string; email: string };
type Token = ApiUser & { exp: number };

const SECRET = () => process.env.FITNESS_SESSION_SECRET ?? "dev-fitness-session-secret";
const TTL = 30 * 24 * 3600;

export function mintApiToken(u: ApiUser): string {
  return makeSigned({ ...u, exp: Math.floor(Date.now() / 1000) + TTL }, SECRET());
}

export function apiUser(req: NextRequest): ApiUser | null {
  const h = req.headers.get("authorization") ?? "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;
  const p = verifySigned<Token>(token, SECRET());
  if (!p || p.exp * 1000 < Date.now()) return null;
  return { hub_user_id: p.hub_user_id, name: p.name, email: p.email };
}

export function requireApiUser(req: NextRequest): ApiUser | NextResponse {
  const u = apiUser(req);
  return u ?? NextResponse.json({ error: "unauthenticated" }, { status: 401 });
}

export function ok(data: unknown) {
  return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
}
