import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Server-to-server: the Fitness app exchanges a code for the identity it
// carries. Verifies signature, audience and expiry, then atomically consumes
// the nonce — a code works exactly once.
const AUD = "fitness-club";

export async function POST(req: NextRequest) {
  const secret = process.env.FITNESS_LINK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "fitness link not configured" }, { status: 503 });
  }
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (typeof code !== "string") {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const dot = code.lastIndexOf(".");
  if (dot <= 0) return NextResponse.json({ error: "invalid code" }, { status: 400 });
  const payload = code.slice(0, dot);
  const sig = Buffer.from(code.slice(dot + 1));
  const expected = Buffer.from(createHmac("sha256", secret).update(payload).digest("base64url"));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  let data: any;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  if (data.aud !== AUD || typeof data.nonce !== "string" || data.exp * 1000 < Date.now()) {
    return NextResponse.json({ error: "invalid code" }, { status: 400 });
  }
  const consumed = await db.execute(
    sql`UPDATE fitness_link_nonces SET consumed_at = now() WHERE nonce = ${data.nonce} AND consumed_at IS NULL RETURNING nonce`,
  );
  if (!consumed.rows?.length) {
    return NextResponse.json({ error: "code already used" }, { status: 400 });
  }
  return NextResponse.json({
    hub_user_id: data.hub_user_id,
    name: data.name,
    email: data.email,
    state: data.state,
  });
}
