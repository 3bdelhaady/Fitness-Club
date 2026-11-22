import Link from "next/link";
import { Bell, Home, Dumbbell, BotMessageSquare, UserRound } from "lucide-react";
import { getSession } from "./session";

export function Header() {
  return (
    <div className="header">
      <span className="title">Fitness Club</span>
      <span className="row">
        <Bell size={22} color="#16265c" />
        <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#16265c", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <UserRound size={18} color="#fff" />
        </span>
      </span>
    </div>
  );
}

const tabs = [
  { href: "/home", label: "الرئيسية", icon: Home },
  { href: "/workout", label: "التمارين", icon: Dumbbell },
  { href: "/chat", label: "غامبول AI", icon: BotMessageSquare },
  { href: "/profile", label: "الملف الشخصي", icon: UserRound },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav className="bottomnav">
      {tabs.map((t) => {
        const Icon = t.icon;
        return (
          <Link key={t.href} href={t.href} className={active === t.href ? "active" : ""}>
            <span className="navicon"><Icon size={20} /></span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export async function guard(): Promise<import("./session").SessionUser> {
  const s = await getSession();
  if (!s) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return s!;
}
