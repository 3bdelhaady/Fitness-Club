import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";

const days = [
  ["sat", "السبت"], ["sun", "الأحد"], ["mon", "الاثنين"],
  ["tue", "الثلاثاء"], ["wed", "الأربعاء"], ["thu", "الخميس"], ["fri", "الجمعة"],
] as const;

async function save(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  const selected = days.map(([id]) => id).filter((id) => formData.get(id) === "on");
  await query("UPDATE profiles SET schedule = $2::jsonb WHERE user_id = $1", [user.hub_user_id, JSON.stringify(selected)]);
  revalidatePath("/profile");
  redirect("/profile");
}

export default async function SchedulePage() {
  const user = await guard();
  const profile = await queryOne<any>("SELECT schedule FROM profiles WHERE user_id = $1", [user.hub_user_id]);
  const current: string[] = profile?.schedule ?? [];
  return (
    <>
      <Header />
      <main className="page">
        <div className="card">
          <div className="big" style={{ marginBottom: 12 }}>جدول التمرين</div>
          <form action={save}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              {days.map(([id, label]) => (
                <label key={id} className="row" style={{
                  border: "1.5px solid", borderColor: current.includes(id) ? "#16265c" : "#e5e7eb",
                  borderRadius: 12, padding: "10px 12px", background: current.includes(id) ? "#eef2ff" : "#fff",
                }}>
                  <input type="checkbox" name={id} defaultChecked={current.includes(id)} />
                  {label}
                </label>
              ))}
            </div>
            <div className="notice" style={{ marginBottom: 14 }}>سيتم معالجة التعديلات بداية من الأسبوع القادم</div>
            <button className="btn-green" type="submit">حفظ</button>
          </form>
        </div>
      </main>
      <BottomNav active="/profile" />
    </>
  );
}
