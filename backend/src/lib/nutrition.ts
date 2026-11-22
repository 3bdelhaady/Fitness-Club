// Deterministic nutrition answers for غامبول AI (no external LLM).
import { query } from "./db";

export async function answerNutrition(question: string, userId: string): Promise<string> {
  const q = question.trim();
  if (/تمريني اليوم|تمرين اليوم/.test(q)) {
    const rows = await query<any>(
      `SELECT e.name_ar, re.sets, re.reps FROM routine_exercises re
       JOIN exercises e ON e.id = re.exercise_id
       JOIN routines r ON r.id = re.routine_id
       JOIN profiles p ON p.level = r.level WHERE p.user_id = $1 ORDER BY re.position`,
      [userId],
    );
    if (!rows.length) return "لم يتم تحديد روتينك بعد. افتح صفحة التمارين واختر مستواك.";
    return "تمرينك اليوم:\n" + rows.map((r) => `• ${r.name_ar}: ${r.sets} مجموعات × ${r.reps} تكرار`).join("\n");
  }
  if (/وجبة|اقتراح/.test(q)) {
    return "اقتراح وجبة: ٢ بيض مسلوق + رغيف بلدي + طبق سلطة + كوب زبادي ≈ 480 سعرة و 28 جم بروتين.";
  }
  // calorie estimate: match food names, optional quantity like "2 بيض" or "بيضتين"
  const foods = await query<any>("SELECT name_ar, kcal, protein, unit FROM foods");
  const hits: { f: any; qty: number }[] = [];
  for (const f of foods) {
    const re = new RegExp(`(?:([0-9]+)\\s*)?${f.name_ar}`);
    const m = q.match(re);
    if (m) hits.push({ f, qty: m[1] ? Number(m[1]) : 1 });
  }
  if (!hits.length) {
    return "أقدر أحسب السعرات والبروتين لأكلات زي: بيض، رغيف بلدي، جبنة قريش، صدر فراخ، رز، تونة. اكتب الأكل والكمية مثلاً: «2 بيض و رغيف».";
  }
  const kcal = hits.reduce((s, h) => s + h.f.kcal * h.qty, 0);
  const protein = hits.reduce((s, h) => s + Number(h.f.protein) * h.qty, 0);
  const lines = hits.map((h) => `• ${h.qty > 1 ? `${h.qty} × ` : ""}${h.f.name_ar}: ${h.f.kcal * h.qty} سعرة`);
  return `الحسبة التقريبية:\n${lines.join("\n")}\nالإجمالي: ${Math.round(kcal)} سعرة، ${protein.toFixed(0)} جم بروتين.`;
}
