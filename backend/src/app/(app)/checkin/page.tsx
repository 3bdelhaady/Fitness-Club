import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CheckCircle2, MapPin } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";

async function sendLocation(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  const lat = Number(formData.get("lat") ?? 30.0444);
  const lng = Number(formData.get("lng") ?? 31.2357);
  await query("INSERT INTO checkins (user_id, lat, lng) VALUES ($1, $2, $3)", [user.hub_user_id, lat, lng]);
  revalidatePath("/checkin");
  redirect("/workout");
}

export default async function CheckinPage() {
  const user = await guard();
  const today = await queryOne(
    `SELECT 1 FROM checkins WHERE user_id = $1 AND at::date = CURRENT_DATE`,
    [user.hub_user_id],
  );
  if (today) {
    return (
      <>
        <Header />
        <main className="page" style={{ textAlign: "center", paddingTop: 60 }}>
          <CheckCircle2 size={72} color="#22c55e" style={{ margin: "0 auto 16px" }} />
          <div className="big">تم تأكيد موقعك بنجاح</div>
          <p className="muted">يمكنك الآن متابعة تمارين اليوم</p>
          <a href="/workout" className="btn-navy" style={{ marginTop: 24 }}>الانتقال لمتابعة التمارين</a>
        </main>
        <BottomNav active="/home" />
      </>
    );
  }
  return (
    <>
      <Header />
      <main className="page" style={{ textAlign: "center", paddingTop: 60 }}>
        <div className="logo-circle" style={{ background: "#eef2ff", border: "none", margin: "0 auto 20px" }}>
          <MapPin size={48} color="#16265c" />
        </div>
        <div className="big">تأكيد الموقع</div>
        <p className="muted">شارك موقعك حتى نتأكد أنك في صالة التمرين ونسجل حضورك اليوم</p>
        <p className="chip">لم يتم تحديد الموقع بعد</p>
        <form action={sendLocation} style={{ marginTop: 24 }}>
          <button className="btn-navy" type="submit">ارسل الموقع الان</button>
        </form>
      </main>
      <BottomNav active="/home" />
    </>
  );
}
