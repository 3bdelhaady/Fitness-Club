import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { sql } from "drizzle-orm";

// Fitness Club auth bridge. Mints an HMAC-signed one-time code for the
// signed-in Hub user. The code carries an audience, the caller's state and a
// random nonce recorded here; it becomes valid only after /api/fitness/consume
// marks the nonce consumed exactly once.
const AUD = "fitness-club";

export async function POST(req: NextRequest) {
  const secret = process.env.FITNESS_LINK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "fitness link not configured" }, { status: 503 });
  }
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const state = typeof body.state === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(body.state) ? body.state : null;
  if (!state) {
    return NextResponse.json({ error: "invalid state" }, { status: 400 });
  }
  const nonce = randomUUID();
  await db.execute(
    sql`INSERT INTO fitness_link_nonces (nonce, user_id) VALUES (${nonce}, ${session.user.id})`,
  );
  const payload = Buffer.from(
    JSON.stringify({
      iss: "student-hub-egypt",
      aud: AUD,
      nonce,
      state,
      hub_user_id: session.user.id,
      name: session.user.name ?? "طالب",
      email: session.user.email ?? "",
      exp: Math.floor(Date.now() / 1000) + 300,
    }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return NextResponse.json({ code: `${payload}.${sig}` });
}
