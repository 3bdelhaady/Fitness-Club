import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query } from "@/lib/db";

const GOALS = new Set(["bulk", "cut", "shred"]);
const DAYS = new Set(["sat", "sun", "mon", "tue", "wed", "thu", "fri"]);

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const body = await req.json().catch(() => ({}));
  if (typeof body.goal === "string" && GOALS.has(body.goal)) {
    await query("UPDATE profiles SET goal = $2 WHERE user_id = $1", [u.hub_user_id, body.goal]);
  }
  if (Array.isArray(body.schedule) && body.schedule.every((d: string) => DAYS.has(d))) {
    await query("UPDATE profiles SET schedule = $2::jsonb WHERE user_id = $1", [u.hub_user_id, JSON.stringify(body.schedule)]);
  }
  return ok({ saved: true });
}
