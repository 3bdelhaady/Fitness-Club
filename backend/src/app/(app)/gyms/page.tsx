import { MapPin } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query } from "@/lib/db";

export default async function GymsPage() {
  await guard();
  const gyms = await query<any>("SELECT * FROM gyms ORDER BY id");
  return (
    <>
      <Header />
      <main className="page">
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="big">الجيمات القريبة منك</div>
          <span className="chip">عرض الكل</span>
        </div>
        <div className="card" style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", background: "#e8eef7" }}>
          <span className="muted row"><MapPin size={16} /> خريطة المواقع — موقعك و {gyms.length} جيمات قريبة</span>
        </div>
        {gyms.map((g) => (
          <a key={g.id} href={`/gyms/${g.id}`} className="card" style={{ display: "block" }}>
            <div className="between">
              <b style={{ color: "#16265c" }}>{g.name}</b>
              <span className="chip">{g.rating_pct}%</span>
            </div>
            <div className="muted">{g.area} · {g.focus}</div>
            <div className="muted">{g.members} عضو · التقييمات الايجابية</div>
            <div className="pbar" style={{ marginTop: 6 }}><div style={{ width: `${g.rating_pct}%` }} /></div>
          </a>
        ))}
      </main>
      <BottomNav active="/profile" />
    </>
  );
}
