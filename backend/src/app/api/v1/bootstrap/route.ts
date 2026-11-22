import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const profile = await queryOne<any>(
    `SELECT p.goal, p.level, p.streak, p.schedule, g.name AS gym_name, p.gym_id,
            u2.university, u2.faculty
     FROM profiles p JOIN users u2 ON u2.hub_user_id = p.user_id
     LEFT JOIN gyms g ON g.id = p.gym_id WHERE p.user_id = $1`,
    [u.hub_user_id],
  );
  const stats = await queryOne<any>(
    `SELECT COALESCE(SUM(ws.weight * ws.reps), 0)::float AS volume
     FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND w.day >= CURRENT_DATE - INTERVAL '7 days'`,
    [u.hub_user_id],
  );
  const kcal = await queryOne<any>(
    `SELECT COALESCE(SUM(ws.reps), 0) * 0.35 AS kcal FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id WHERE w.user_id = $1 AND ws.done AND w.day = CURRENT_DATE`,
    [u.hub_user_id],
  );
  const checkin = await queryOne(
    "SELECT 1 FROM checkins WHERE user_id = $1 AND at::date = CURRENT_DATE",
    [u.hub_user_id],
  );
  const volume = Math.round(stats?.volume ?? 0);
  return ok({
    user: u,
    profile,
    home: {
      volume,
      goalPct: Math.min(100, Math.round((volume / 15000) * 100)),
      kcalToday: Math.round(kcal?.kcal ?? 0),
      kcalGoal: 742,
      checkedIn: !!checkin,
    },
  });
}
