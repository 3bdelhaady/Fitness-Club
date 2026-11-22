import { revalidatePath } from "next/cache";
import { Pencil, MapPin } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";

async function setGoal(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  await query("UPDATE profiles SET goal = $2 WHERE user_id = $1", [user.hub_user_id, String(formData.get("goal"))]);
  revalidatePath("/profile");
}

const goals = [
  { id: "bulk", label: "تضخيم" },
  { id: "cut", label: "خسارة الوزن" },
  { id: "shred", label: "التنشيف" },
];
const dayLabels: Record<string, string> = { sat: "السبت", sun: "الأحد", mon: "الاثنين", tue: "الثلاثاء", wed: "الأربعاء", thu: "الخميس", fri: "الجمعة" };

export default async function ProfilePage() {
  const user = await guard();
  const profile = await queryOne<any>(
    `SELECT p.*, g.name AS gym_name, u.university, u.faculty FROM profiles p
     JOIN users u ON u.hub_user_id = p.user_id
     LEFT JOIN gyms g ON g.id = p.gym_id WHERE p.user_id = $1`,
    [user.hub_user_id],
  );
  const schedule: string[] = profile?.schedule ?? [];
  const sub = await queryOne<any>(
    `SELECT s.status, gp.title, gp.price_egp, gp.period, g.name AS gym_name
     FROM subscriptions s JOIN gym_plans gp ON gp.id = s.plan_id JOIN gyms g ON g.id = s.gym_id
     WHERE s.user_id = $1 ORDER BY s.id DESC LIMIT 1`,
    [user.hub_user_id],
  );
  return (
    <>
      <Header />
      <main className="page">
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#16265c", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 26, fontWeight: 800 }}>
            {user.name[0]}
          </div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{user.name}</div>
          <div className="muted">المعرف {user.hub_user_id}</div>
          <div className="row" style={{ justifyContent: "center", marginTop: 8 }}>
            {profile?.university && <span className="chip">{profile.university}</span>}
            {profile?.faculty && <span className="chip">{profile.faculty}</span>}
          </div>
        </div>
        <div className="card">
          <b>هدفك</b>
          <div className="row" style={{ marginTop: 10 }}>
            {goals.map((g) => (
              <form key={g.id} action={setGoal}>
                <input type="hidden" name="goal" value={g.id} />
                <button type="submit" className="chip" style={{
                  border: 0,
                  background: profile?.goal === g.id ? "#16265c" : "#eef2ff",
                  color: profile?.goal === g.id ? "#fff" : "#16265c",
                }}>{g.label}</button>
              </form>
            ))}
          </div>
        </div>
        <div className="card between">
          <div>
            <b>صالة التمرين الخاصة بي</b>
            <div className="muted row"><MapPin size={14} /> {profile?.gym_name ?? "لم تختر صالة بعد"}</div>
          </div>
          <a href="/gyms" className="chip">البحث عن جيم</a>
        </div>
        <div className="card between">
          <div>
            <b>جدول التمرين الخاص بي</b>
            <div className="muted">{schedule.map((d) => dayLabels[d] ?? d).join("، ") || "—"}</div>
          </div>
          <a href="/profile/schedule" className="chip"><Pencil size={13} /> تعديل</a>
        </div>
        {sub && (
          <div className="card">
            <b>اشتراكك</b>
            <div className="muted">{sub.gym_name} — {sub.title} ({sub.price_egp} جنيه / {sub.period})</div>
            <span className="chip" style={{ marginTop: 6 }}>{sub.status === "requested" ? "طلب قيد المراجعة" : sub.status}</span>
          </div>
        )}
        <div className="card between"><b>اللغة</b><span className="chip">العربية (AR)</span></div>
        <div className="card between"><b>المظهر</b><span className="chip">فاتح</span></div>
        <form action={async () => { "use server"; const { clearSession } = await import("@/lib/session"); await clearSession(); const { redirect } = await import("next/navigation"); redirect("/login"); }}>
          <button className="btn-outline" type="submit">تسجيل الخروج</button>
        </form>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}
