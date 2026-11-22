import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

process.env.PGLITE_DIR = mkdtempSync(path.join(tmpdir(), "fc-nutrition-"));

import { query } from "../src/lib/db";
import { answerNutrition } from "../src/lib/nutrition";




async function seed() {
  await query(`INSERT INTO foods (name_ar, kcal, protein, unit) VALUES
    ('بيض', 78, 6.3, 'حبة'), ('رغيف بلدي', 300, 9, 'رغيف'), ('موز', 89, 1.1, 'ثمرة')`);
  await query(`INSERT INTO users (hub_user_id, name) VALUES ('u1', 'طالب')`);
  await query(`INSERT INTO profiles (user_id, level) VALUES ('u1', 'beginner')`);
  await query(`INSERT INTO routines (level, title_ar, pct) VALUES ('beginner', 'مبتدئ', 25)`);
  await query(`INSERT INTO exercises (name_ar, name_en) VALUES ('بيك ديك', 'Pec Deck')`);
  await query(
    `INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, position)
     SELECT r.id, e.id, 3, 12, 0 FROM routines r, exercises e`,
  );
}

test("calorie estimate with quantities", async () => {
  await seed();
  const reply = await answerNutrition("2 بيض و رغيف بلدي", "u1");
  assert.match(reply, /456 سعرة/);
  assert.match(reply, /22 جم بروتين/);
});

test("today's workout from the user's routine", async () => {
  const reply = await answerNutrition("ما هو تمريني اليوم؟", "u1");
  assert.match(reply, /بيك ديك/);
  assert.match(reply, /3 مجموعات × 12/);
});

test("meal suggestion", async () => {
  const reply = await answerNutrition("اقتراح وجبة", "u1");
  assert.match(reply, /سعرة/);
});

test("unknown food falls back to guidance", async () => {
  const reply = await answerNutrition("كالك حاجة مش موجودة", "u1");
  assert.match(reply, /أقدر أحسب/);
});
