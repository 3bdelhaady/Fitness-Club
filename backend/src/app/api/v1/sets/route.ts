import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { set_id, reps, weight, done } = await req.json().catch(() => ({}));
  if (typeof set_id !== "number") return NextResponse.json({ error: "invalid" }, { status: 400 });
  await query(
    `UPDATE workout_sets ws SET reps = COALESCE($2, ws.reps), weight = COALESCE($3, ws.weight),
            done = COALESCE($4, ws.done)
     FROM workouts w WHERE ws.id = $1 AND w.id = ws.workout_id AND w.user_id = $5`,
    [set_id, reps ?? null, weight ?? null, done ?? null, u.hub_user_id],
  );
  return ok({ saved: true });
}
