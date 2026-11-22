import { revalidatePath } from "next/cache";
import { Sprout, Plus } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query } from "@/lib/db";
import { queryOne } from "@/lib/db";

const pastel = ["#d9f7ee", "#e0f2fe", "#fff7ed", "#fef2f2", "#faf5ff", "#ecfccb"];
const levels = [
  { level: "newbie", title: "مبتدئ جدًا", pct: 10 },
  { level: "beginner", title: "مبتدئ", pct: 25 },
  { level: "intermediate", title: "متوسط", pct: 50 },
  { level: "skilled", title: "متمرس", pct: 35 },
  { level: "advanced", title: "متقدم", pct: 70 },
  { level: "pro", title: "محترف", pct: 90 },
];

async function choose(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  const level = String(formData.get("level"));
  await query("UPDATE profiles SET level = $2 WHERE user_id = $1", [user.hub_user_id, level]);
  revalidatePath("/routines");
}

export default async function RoutinesPage() {
  const user = await guard();
  const profile = await queryOne<any>("SELECT * FROM profiles WHERE user_id = $1", [user.hub_user_id]);
  return (
    <>
      <Header />
      <main className="page">
        <div className="big" style={{ marginBottom: 12 }}>تعديل الروتين</div>
        {levels.map((l, i) => (
          <form key={l.level} action={choose}>
            <input type="hidden" name="level" value={l.level} />
            <button type="submit" className="pastel" style={{
              width: "100%", border: profile?.level === l.level ? "2px solid #16265c" : "none",
              background: pastel[i], marginBottom: 12, textAlign: "start",
            }}>
              <div className="between">
                <span className="row"><Sprout size={20} color="#16265c" /><b>{l.title}</b></span>
                <b style={{ color: "#16265c" }}>{l.pct}%</b>
              </div>
              <div className="muted">Muscle Gain</div>
            </button>
          </form>
        ))}
        <div className="card" style={{ background: "#16265c", color: "#fff", textAlign: "center" }}>
          <div className="row" style={{ justifyContent: "center", gap: 8 }}>
            <Plus size={20} color="#5eead4" />
            <b>إنشاء روتين مخصص</b>
          </div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>صمم مسار تدريبك خاص بك</div>
        </div>
        <div className="notice">سوف يتم إضافة تخصيص روتين تدريبي قريبا جدا</div>
        <a href="/workout" className="btn-green" style={{ display: "block", textAlign: "center", marginTop: 12 }}>العودة لصفحة التمارين</a>
      </main>
      <BottomNav active="/workout" />
    </>
  );
}
