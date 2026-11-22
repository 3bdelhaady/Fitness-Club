import { Dumbbell } from "lucide-react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const s = await getSession();
  if (s) redirect("/home");
  const connect = "/api/auth/start";
  return (
    <div className="splash">
      <div className="logo-circle"><Dumbbell size={56} color="#5eead4" /></div>
      <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>تسجيل الدخول</h1>
      <p style={{ opacity: 0.8, fontSize: 14, margin: "0 0 8px", maxWidth: 300 }}>
        التطبيق مخصص لأعضاء مركز الطلاب فقط. سجّل الدخول بحسابك في مركز الطلاب للمتابعة.
      </p>
      <p className="notice" style={{ maxWidth: 300, margin: "0 0 24px" }}>
        لا يوجد تسجيل مباشر — تحتاج حساب مركز الطلاب أولاً.
      </p>
      <a href={connect} className="btn-navy" style={{ maxWidth: 300 }}>
        الدخول بحساب مركز الطلاب
      </a>
    </div>
  );
}
