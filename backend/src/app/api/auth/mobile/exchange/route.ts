import { NextRequest, NextResponse } from "next/server";
import { verifyHubGrant } from "@/lib/hub";
import { mintApiToken } from "@/lib/api-auth";
import { ensureProfile } from "@/lib/session";
import { query, queryOne } from "@/lib/db";

// Mobile counterpart of /api/auth/hub/callback: the Flutter app generated the
// state itself and checked it on the deep-link return, so there is no browser
// state cookie here. Signature + iss/aud/exp are validated, the nonce is
// consumed once locally and once at the Hub.
export async function POST(req: NextRequest) {
  const { code, state } = await req.json().catch(() => ({}));
  if (typeof code !== "string" || typeof state !== "string") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const grant = verifyHubGrant(code);
  if (!grant || grant.state !== state) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }
  const consumed = await queryOne(
    `INSERT INTO consumed_codes (nonce, hub_user_id) VALUES ($1, $2)
     ON CONFLICT (nonce) DO NOTHING RETURNING nonce`,
    [grant.nonce, grant.hub_user_id],
  );
  if (!consumed) return NextResponse.json({ error: "code_already_used" }, { status: 400 });
  const hubUrl = process.env.HUB_URL;
  if (process.env.NODE_ENV === "production" || hubUrl) {
    if (!hubUrl) return NextResponse.json({ error: "hub_not_configured" }, { status: 500 });
    try {
      const res = await fetch(`${hubUrl}/api/fitness/consume`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return NextResponse.json({ error: "hub_rejected" }, { status: 400 });
      const identity = await res.json();
      if (identity.hub_user_id !== grant.hub_user_id || identity.state !== state) {
        return NextResponse.json({ error: "identity_mismatch" }, { status: 400 });
      }
    } catch {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "hub_unreachable" }, { status: 502 });
      }
    }
  }
  await query(
    `INSERT INTO users (hub_user_id, name, email) VALUES ($1, $2, $3)
     ON CONFLICT (hub_user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email`,
    [grant.hub_user_id, grant.name, grant.email ?? ""],
  );
  await ensureProfile(grant.hub_user_id);
  await query(
    `INSERT INTO notifications (user_id, title, body)
     SELECT $1, 'أهلاً بك في نادي اللياقة البدنية', 'ابدأ بتأكيد موقعك في الجيم ثم سجّل تمارينك اليومية.'
     WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = $1)`,
    [grant.hub_user_id],
  );
  const user = { hub_user_id: grant.hub_user_id, name: grant.name, email: grant.email ?? "" };
  return NextResponse.json({ token: mintApiToken(user), user });
}
