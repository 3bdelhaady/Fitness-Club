import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";

async function choosePlan(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  const gymId = Number(formData.get("gym_id"));
  const planId = Number(formData.get("plan_id"));
  await query("UPDATE profiles SET gym_id = $2 WHERE user_id = $1", [user.hub_user_id, gymId]);
  await query(
    "INSERT INTO subscriptions (user_id, gym_id, plan_id) VALUES ($1, $2, $3)",
    [user.hub_user_id, gymId, planId],
  );
  revalidatePath("/profile");
  redirect("/profile");
}

export default async function GymPage({ params }: { params: Promise<{ id: string }> }) {
  await guard();
  const { id } = await params;
  const gym = await queryOne<any>("SELECT * FROM gyms WHERE id = $1", [Number(id)]);
  if (!gym) return <main className="page"><Header />الجيم غير موجود</main>;
  const plans = await query<any>("SELECT * FROM gym_plans WHERE gym_id = $1 ORDER BY price_egp", [gym.id]);
  return (
    <>
      <Header />
      <main className="page">
        <div className="card">
          <div className="between">
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#16265c" }}>{gym.name}</div>
              <div className="muted">{gym.area} · {gym.focus}</div>
            </div>
            <span className="chip">الأنسب لك +</span>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>التقييمات الايجابية {gym.rating_pct}%</div>
          <div className="pbar" style={{ marginTop: 6 }}><div style={{ width: `${gym.rating_pct}%` }} /></div>
        </div>
        <div className="card">
          <b>الأصدقاء في هذا الجيم</b>
          <div className="muted" style={{ marginTop: 6 }}>لا يوجد أصدقاء مسجلون بعد — كن أولهم <Flame size={14} style={{ display: "inline" }} /></div>
        </div>
        <b style={{ display: "block", margin: "4px 0 10px" }}>خطط الاشتراك</b>
        <form action={choosePlan}>
          <input type="hidden" name="gym_id" value={gym.id} />
          <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
            {plans.map((p, i) => (
              <label key={p.id} className="card row" style={{ margin: 0, border: i === 1 ? "2px solid #16265c" : "1px solid #e5e7eb" }}>
                <input type="radio" name="plan_id" value={p.id} defaultChecked={i === 1} />
                <span style={{ flex: 1 }}>
                  <b style={{ color: "#16265c" }}>{p.price_egp} جنيه</b>
                  <div className="muted">{p.title}</div>
                  <div className="muted">{p.period}</div>
                </span>
              </label>
            ))}
          </div>
          <button className="btn-navy" type="submit">اختر خطة اشتراك</button>
        </form>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}
