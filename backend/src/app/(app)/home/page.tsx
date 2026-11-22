import Link from "next/link";
import { Flame, MapPin } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query, queryOne } from "@/lib/db";

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default async function HomePage() {
  const user = await guard();
  const profile = await queryOne<any>(
    `SELECT p.*, g.name AS gym_name FROM profiles p LEFT JOIN gyms g ON g.id = p.gym_id WHERE p.user_id = $1`,
    [user.hub_user_id],
  );
  const stats = await queryOne<any>(
    `SELECT COALESCE(SUM(ws.weight * ws.reps), 0)::float AS volume,
            COUNT(*) FILTER (WHERE ws.done) AS done_sets
     FROM workout_sets ws JOIN workouts w ON w.id = ws.workout_id
     WHERE w.user_id = $1 AND w.day >= CURRENT_DATE - INTERVAL '7 days'`,
    [user.hub_user_id],
  );
  const kcal = await queryOne<any>(
    `SELECT COALESCE(SUM(ws.reps), 0) * 0.35 AS kcal FROM workout_sets ws
     JOIN workouts w ON w.id = ws.workout_id WHERE w.user_id = $1 AND ws.done AND w.day = CURRENT_DATE`,
    [user.hub_user_id],
  );
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });
  const volume = Math.round(stats?.volume ?? 0);
  const goalPct = Math.min(100, Math.round((volume / 15000) * 100));
  return (
    <>
      <Header />
      <main className="page">
        <div className="between" style={{ marginBottom: 12 }}>
          <div>
            <div className="big">أهلاً بك يا {user.name.split(" ")[0]}</div>
            <div className="muted row"><MapPin size={14} /> {profile?.gym_name ?? "لم تختر صالتك بعد"}</div>
          </div>
          <span className="chip"><Flame size={14} color="#f97316" /> سلسلة {profile?.streak ?? 0} يوم</span>
        </div>
        <div className="between" style={{ margin: "8px 0 16px" }}>
          {week.map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 12 }}>
              <div className="muted">{d.getDate()}</div>
              <div style={{
                width: 8, height: 8, borderRadius: 99, margin: "4px auto 0",
                background: d.toDateString() === today.toDateString() ? "#ef4444" : "#d1d5db",
              }} />
            </div>
          ))}
        </div>
        <div className="grid2">
          <div className="card" style={{ margin: 0 }}>
            <div className="muted">حجم الرفع</div>
            <div className="big">{volume.toLocaleString("ar-EG")} KG</div>
            <div className="muted">آخر ٧ أيام</div>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <div className="muted">الهدف</div>
            <div className="big">{goalPct}%</div>
            <div className="pbar"><div style={{ width: `${goalPct}%` }} /></div>
          </div>
        </div>
        <div className="card" style={{ marginTop: 12 }}>
          <div className="between">
            <div>
              <div className="muted">السعرات المحروقة اليوم</div>
              <div className="big">{Math.round(kcal?.kcal ?? 0)} سعرة</div>
            </div>
            <div style={{ width: 64, height: 64, borderRadius: "50%", border: "8px solid #5eead4", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#16265c" }}>
              {Math.min(100, Math.round(((kcal?.kcal ?? 0) / 742) * 100))}%
            </div>
          </div>
          <div className="muted">الهدف اليومي 742 سعرة</div>
        </div>
        <Link href="/checkin" className="btn-navy" style={{ marginTop: 8 }}>ابد الان</Link>
      </main>
      <BottomNav active="/home" />
    </>
  );
}
