import { query } from "../src/lib/db";

async function main() {
  await query(`INSERT INTO gyms (name, area, lat, lng, rating_pct, members, focus) VALUES
    ('Up-Gym', 'قنا - وسط البلد', 26.1551, 32.7160, 91, 240, 'تضخيم وبناء عضلات'),
    ('PowerZone', 'قنا - الشيخ زايد', 26.1700, 32.7300, 42, 120, 'تضخيم وبناء عضلات'),
    ('O-Gym', 'قوص', 25.9167, 32.7500, 35, 85, 'تضخيم وبناء عضلات')
    ON CONFLICT DO NOTHING`);
  const gyms = await query<any>("SELECT id FROM gyms ORDER BY id");
  for (const g of gyms) {
    await query(`INSERT INTO gym_plans (gym_id, title, price_egp, period) VALUES
      ($1, 'تدريب فردي', 500, 'نصف شهري'),
      ($1, 'تدريب فردي', 800, 'شهري'),
      ($1, 'تدريب تحت إشراف مدرب', 800, 'نصف شهري')
      ON CONFLICT DO NOTHING`, [g.id]);
  }
  await query(`INSERT INTO exercises (name_ar, name_en, muscle, rest_min) VALUES
    ('بيك ديك', 'Pec Deck', 'صدر', 5),
    ('ضغط الصدر', 'Chest Press', 'صدر', 4),
    ('ضغط الأرجل', 'Leg Press', 'أرجل', 5),
    ('سحب أرضي', 'Lat Pulldown', 'ظهر', 4),
    ('كتف أمامي بالدمبل', 'Dumbbell Shoulder Press', 'أكتاف', 3),
    ('بايسبس بالبار', 'Barbell Curl', 'ذراع', 3)
    ON CONFLICT DO NOTHING`);
  const routines = [
    ["newbie", "مبتدئ جدًا", 10], ["beginner", "مبتدئ", 25], ["intermediate", "متوسط", 50],
    ["skilled", "متمرس", 35], ["advanced", "متقدم", 70], ["pro", "محترف", 90],
  ] as const;
  for (const [level, title, pct] of routines) {
    await query(
      "INSERT INTO routines (level, title_ar, pct) VALUES ($1, $2, $3) ON CONFLICT (level) DO NOTHING",
      [level, title, pct],
    );
  }
  const exIds = await query<any>("SELECT id FROM exercises ORDER BY id");
  const rids = await query<any>("SELECT id, level FROM routines");
  const plan: Record<string, [number, number, number][]> = {
    newbie: [[0, 2, 10], [4, 2, 10]],
    beginner: [[0, 3, 12], [4, 3, 12]],
    beginner_plus: [[0, 4, 12], [1, 4, 12], [2, 4, 12]],
    intermediate: [[0, 4, 12], [1, 4, 10], [3, 3, 12]],
    skilled: [[0, 4, 12], [1, 4, 10], [3, 4, 12], [5, 3, 12]],
    advanced: [[0, 5, 12], [1, 4, 10], [2, 4, 10], [3, 4, 12]],
    pro: [[0, 5, 10], [1, 5, 10], [2, 5, 10], [3, 5, 12], [4, 4, 10]],
  };
  for (const r of rids) {
    const rows = plan[r.level] ?? plan.beginner_plus;
    for (let i = 0; i < rows.length; i++) {
      const [exIdx, sets, reps] = rows[i];
      if (!exIds[exIdx]) continue;
      await query(
        "INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, position) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING",
        [r.id, exIds[exIdx].id, sets, reps, i],
      );
    }
  }
  await query(`INSERT INTO foods (name_ar, kcal, protein, unit) VALUES
    ('بيض', 78, 6.3, 'حبة'),
    ('رغيف بلدي', 300, 9, 'رغيف'),
    ('جبنة قريش', 98, 17, '100 جم'),
    ('صدر فراخ', 165, 31, '100 جم'),
    ('رز', 130, 2.7, '100 جم مطبوخ'),
    ('تونة', 116, 26, '100 جم'),
    ('زبادي', 60, 3.5, 'كوب'),
    ('موز', 89, 1.1, 'ثمرة')
    ON CONFLICT DO NOTHING`);
  console.log("seeded");
  process.exit(0);
}
main();
