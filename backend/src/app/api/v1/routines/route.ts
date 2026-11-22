import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const levels = await query("SELECT level, title_ar, pct FROM routines ORDER BY pct");
  const profile = await queryOne<any>("SELECT level FROM profiles WHERE user_id = $1", [u.hub_user_id]);
  return ok({ levels, current: profile?.level ?? "beginner" });
}

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { level } = await req.json().catch(() => ({}));
  const exists = await queryOne("SELECT 1 FROM routines WHERE level = $1", [level]);
  if (!exists) return NextResponse.json({ error: "unknown_level" }, { status: 400 });
  await query("UPDATE profiles SET level = $2 WHERE user_id = $1", [u.hub_user_id, level]);
  return ok({ saved: true });
}
