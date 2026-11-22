import Link from "next/link";
import { Dumbbell } from "lucide-react";

export default function Splash() {
  return (
    <div className="splash">
      <div className="logo-circle"><Dumbbell size={56} color="#5eead4" /></div>
      <h1 style={{ fontSize: 26, margin: "0 0 8px" }}>مرحبا بك في نادي اللياقة البدنية</h1>
      <p style={{ opacity: 0.85, margin: "0 0 4px" }}>تتبع التمارين</p>
      <p style={{ opacity: 0.6, fontSize: 13, margin: "0 0 36px" }}>أحد منتجات مركز الطلاب</p>
      <Link href="/login" className="btn-navy" style={{ maxWidth: 260, background: "#fff", color: "#16265c" }}>
        ابدأ الآن
      </Link>
    </div>
  );
}
