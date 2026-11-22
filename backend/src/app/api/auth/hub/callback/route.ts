import { NextRequest, NextResponse } from "next/server";
import { verifyHubGrant } from "@/lib/hub";
import { checkLinkState } from "@/lib/link-state";
import { setSession, ensureProfile } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(reason)}`, req.url));

  const code = req.nextUrl.searchParams.get("code") ?? "";
  const state = req.nextUrl.searchParams.get("state") ?? "";

  // 1. local signature + issuer + audience + expiry validation
  const grant = verifyHubGrant(code);
  if (!grant || grant.state !== state) return fail("invalid_code");

  // 2. browser state cookie binding
  if (!(await checkLinkState(state))) return fail("state_mismatch");

  // 3. receiver-side one-use nonce storage with atomic consumption
  const consumed = await queryOne(
    `INSERT INTO consumed_codes (nonce, hub_user_id) VALUES ($1, $2)
     ON CONFLICT (nonce) DO NOTHING RETURNING nonce`,
    [grant.nonce, grant.hub_user_id],
  );
  if (!consumed) return fail("code_already_used");

  // 4. Hub-side consumption (also enforces one-time on the issuer side).
  //    In production this call is mandatory; in dev it is skipped when no
  //    HUB_URL consume endpoint is reachable.
  const hubUrl = process.env.HUB_URL;
  if (process.env.NODE_ENV === "production" || hubUrl) {
    if (!hubUrl) return fail("hub_not_configured");
    try {
      const res = await fetch(`${hubUrl}/api/fitness/consume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return fail("hub_rejected");
      const identity = await res.json();
      if (identity.hub_user_id !== grant.hub_user_id || identity.state !== state) {
        return fail("identity_mismatch");
      }
    } catch {
      if (process.env.NODE_ENV === "production") return fail("hub_unreachable");
    }
  }

  await query(
    `INSERT INTO users (hub_user_id, name, email, university, faculty)
     VALUES ($1, $2, $3, '', '')
     ON CONFLICT (hub_user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
    [grant.hub_user_id, grant.name, grant.email ?? ""],
  );
  await setSession({ hub_user_id: grant.hub_user_id, name: grant.name, email: grant.email ?? "" });
  await ensureProfile(grant.hub_user_id);
  return NextResponse.redirect(new URL("/home", req.url));
}
