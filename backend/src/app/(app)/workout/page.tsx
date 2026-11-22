import { revalidatePath } from "next/cache";
import { Check, Timer } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";
import { ensureProfile } from "@/lib/session";

async function toggleSet(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  await requireUser();
  const id = Number(formData.get("set_id"));
  await query("UPDATE workout_sets SET done = NOT done WHERE id = $1", [id]);
  revalidatePath("/workout");
}

async function logSet(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  await requireUser();
  const id = Number(formData.get("set_id"));
  const reps = Number(formData.get("reps") ?? 0);
  const weight = Number(formData.get("weight") ?? 0);
  await query("UPDATE workout_sets SET reps = $2, weight = $3, done = true WHERE id = $1", [id, reps, weight]);
  revalidatePath("/workout");
}

export default async function WorkoutPage() {
  const user = await guard();
  await ensureProfile(user.hub_user_id);
  const profile = await queryOne<any>("SELECT * FROM profiles WHERE user_id = $1", [user.hub_user_id]);
  // get today's workout (create once per day)
  let w = await queryOne<any>(
    "SELECT * FROM workouts WHERE user_id = $1 AND day = CURRENT_DATE ORDER BY id DESC LIMIT 1",
    [user.hub_user_id],
  );
  if (!w) {
    await query(
      "INSERT INTO workouts (user_id) VALUES ($1) ON CONFLICT (user_id, day) DO NOTHING",
      [user.hub_user_id],
    );
    w = await queryOne<any>(
      "SELECT * FROM workouts WHERE user_id = $1 AND day = CURRENT_DATE",
      [user.hub_user_id],
    );
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
            e.id AS ex_id, e.name_ar, e.name_en, e.rest_min,
            (SELECT count(*) FROM workout_sets x WHERE x.workout_id = $1 AND x.exercise_id = e.id) AS total_sets,
            (SELECT count(*) FROM workout_sets x WHERE x.workout_id = $1 AND x.exercise_id = e.id AND x.done) AS done_sets
     FROM workout_sets ws JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.workout_id = $1 ORDER BY e.id, ws.set_index`,
    [w.id],
  );
  const byEx = new Map<number, any[]>();
  for (const r of rows) {
    if (!byEx.has(r.ex_id)) byEx.set(r.ex_id, []);
    byEx.get(r.ex_id)!.push(r);
  }
  const ordinal = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  return (
    <>
      <Header />
      <main className="page">
        <div className="big" style={{ marginBottom: 12 }}>تمارين اليوم</div>
        {[...byEx.values()].map((sets) => {
          const first = sets[0];
          return (
            <div className="card" key={first.ex_id}>
              <div className="between">
                <div>
                  <div style={{ fontWeight: 800, color: "#16265c" }}>{first.name_ar}</div>
                  <div className="muted">{first.name_en}</div>
                </div>
                <span className="chip">تم إكمال {first.done_sets} من {first.total_sets} مجموعات</span>
              </div>
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {sets.map((s: any) => (
                  <form key={s.set_id} action={s.done ? toggleSet : logSet} className="row" style={{ gap: 8 }}>
                    <input type="hidden" name="set_id" value={s.set_id} />
                    <button
                      type="submit"
                      style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 8, border: "1px solid #e5e7eb",
                        borderRadius: 10, padding: "8px 12px",
                        background: s.done ? "#d9f7ee" : "#fff",
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: 6, border: "1.5px solid #9ca3af",
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: s.done ? "#22c55e" : "#fff",
                      }}>
                        {s.done ? <Check size={14} color="#fff" /> : null}
                      </span>
                      {ordinal[s.set_index - 1] ?? s.set_index} Set
                    </button>
                    {!s.done && (
                      <>
                        <input name="reps" defaultValue={s.reps} inputMode="numeric" aria-label="reps"
                          style={{ width: 56, padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} />
                        <input name="weight" defaultValue={s.weight} inputMode="decimal" aria-label="weight kg"
                          style={{ width: 64, padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }} placeholder="kg" />
                      </>
                    )}
                    {s.done && <span className="muted">× {s.reps} Reps · {s.weight}kg</span>}
                  </form>
                ))}
              </div>
            </div>
          );
        })}
        <div className="card row"><Timer size={20} color="#16265c" /> <b>Muscle Rest Time</b> <span className="muted">{rows[0]?.rest_min ?? 5} دقائق</span></div>
        <a href="/home" className="btn-outline">العودة الى لوحة المعلومات</a>
      </main>
      <BottomNav active="/workout" />
    </>
  );
}
