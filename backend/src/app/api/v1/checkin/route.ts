import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const c = await queryOne("SELECT 1 FROM checkins WHERE user_id = $1 AND at::date = CURRENT_DATE", [u.hub_user_id]);
  return ok({ verified: !!c });
}

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { lat, lng } = await req.json().catch(() => ({}));
  await query("INSERT INTO checkins (user_id, lat, lng) VALUES ($1, $2, $3)", [
    u.hub_user_id, Number(lat ?? 30.0444), Number(lng ?? 31.2357),
  ]);
  return ok({ verified: true });
}
