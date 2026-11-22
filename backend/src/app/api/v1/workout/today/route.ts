import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  let w = await queryOne<any>(
    "SELECT * FROM workouts WHERE user_id = $1 AND day = CURRENT_DATE",
    [u.hub_user_id],
  );
  if (!w) {
    await query("INSERT INTO workouts (user_id) VALUES ($1) ON CONFLICT (user_id, day) DO NOTHING", [u.hub_user_id]);
    w = await queryOne<any>("SELECT * FROM workouts WHERE user_id = $1 AND day = CURRENT_DATE", [u.hub_user_id]);
    const profile = await queryOne<any>("SELECT level FROM profiles WHERE user_id = $1", [u.hub_user_id]);
    const exs = await query<any>(
      `SELECT re.exercise_id, re.sets, re.reps FROM routine_exercises re
       JOIN routines r ON r.id = re.routine_id WHERE r.level = $1 ORDER BY re.position`,
      [profile?.level ?? "beginner"],
    );
    for (const ex of exs) {
      for (let s = 1; s <= ex.sets; s++) {
        await query(
          "INSERT INTO workout_sets (workout_id, exercise_id, set_index, reps) VALUES ($1, $2, $3, $4)",
          [w.id, ex.exercise_id, s, ex.reps],
        );
      }
    }
  }
  const rows = await query<any>(
    `SELECT ws.id AS set_id, ws.set_index, ws.reps, ws.weight, ws.done,
            e.id AS ex_id, e.name_ar, e.name_en, e.rest_min
     FROM workout_sets ws JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = $1 ORDER BY e.id, ws.set_index`,
    [w.id],
  );
  const exercises: Record<number, any> = {};
  for (const r of rows) {
    exercises[r.ex_id] ??= { ex_id: r.ex_id, name_ar: r.name_ar, name_en: r.name_en, rest_min: r.rest_min, sets: [] };
    exercises[r.ex_id].sets.push({ set_id: r.set_id, set_index: r.set_index, reps: r.reps, weight: Number(r.weight), done: r.done });
  }
  return ok({ workout_id: w.id, exercises: Object.values(exercises) });
}
