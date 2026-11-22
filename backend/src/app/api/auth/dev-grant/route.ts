import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mintHubGrant } from "@/lib/hub";
import { createLinkState } from "@/lib/link-state";

// Dev/test only: mints a Hub-shaped code locally and runs it through the real
// callback, so the full receiver path (signature, aud/iss, state cookie,
// one-use nonce) is exercised without a running Hub. Remote Hub consumption
// is skipped only outside production. Disabled in production unless
// FITNESS_DEV_GRANT=1 is explicitly set.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.FITNESS_DEV_GRANT !== "1") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const u = req.nextUrl.searchParams.get("user") ?? "demo-student";
  const name = req.nextUrl.searchParams.get("name") ?? "طالب تجريبي";
  const state = await createLinkState();
  const code = mintHubGrant({
    nonce: randomUUID(),
    state,
    hub_user_id: u,
    name,
    email: `${u}@hub.local`,
  });
  return NextResponse.redirect(
    new URL(
      `/api/auth/hub/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      req.url,
    ),
  );
}
