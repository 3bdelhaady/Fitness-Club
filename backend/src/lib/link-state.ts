import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { makeSigned, verifySigned } from "./crypto";

const COOKIE = "fc_link_state";
const SECRET = () => process.env.FITNESS_SESSION_SECRET ?? "dev-fitness-session-secret";

export async function createLinkState(): Promise<string> {
  const state = randomUUID() + randomUUID().replaceAll("-", "");
  const token = makeSigned({ state, exp: Math.floor(Date.now() / 1000) + 600 }, SECRET());
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return state;
}

export async function checkLinkState(state: string): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  store.delete(COOKIE);
  if (!token) return false;
  const p = verifySigned<{ state: string; exp: number }>(token, SECRET());
  return !!p && p.state === state && p.exp * 1000 >= Date.now();
}
