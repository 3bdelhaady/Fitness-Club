import { makeSigned, verifySigned } from "./crypto";

export type HubGrant = {
  iss: string;
  aud: string;
  nonce: string;
  state: string;
  hub_user_id: string;
  name: string;
  email?: string;
  exp: number;
};

export const HUB_ISS = "student-hub-egypt";
export const HUB_AUD = "fitness-club";

// Fail closed: no signing secret fallback in production.
function secret(): string {
  const s = process.env.FITNESS_LINK_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("FITNESS_LINK_SECRET is required");
  }
  return "dev-fitness-link-secret";
}

export function verifyHubGrant(code: string): HubGrant | null {
  const grant = verifySigned<HubGrant>(code, secret());
  if (!grant) return null;
  if (grant.iss !== HUB_ISS || grant.aud !== HUB_AUD) return null;
  if (!grant.hub_user_id || !grant.name || !grant.nonce || !grant.state) return null;
  if (grant.exp * 1000 < Date.now()) return null;
  return grant;
}

// Dev/test only; production codes come from the Hub grant endpoint.
export function mintHubGrant(g: Omit<HubGrant, "exp" | "iss" | "aud">, ttlSec = 300): string {
  return makeSigned(
    { ...g, iss: HUB_ISS, aud: HUB_AUD, exp: Math.floor(Date.now() / 1000) + ttlSec },
    secret(),
  );
}
