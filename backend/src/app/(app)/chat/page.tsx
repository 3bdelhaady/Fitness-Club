import { revalidatePath } from "next/cache";
import { Bot, Send } from "lucide-react";
import { Header, BottomNav, guard } from "@/lib/ui";
import { query } from "@/lib/db";
import { answerNutrition } from "@/lib/nutrition";

async function send(formData: FormData) {
  "use server";
  const { requireUser } = await import("@/lib/session");
  const user = await requireUser();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;
  await query("INSERT INTO chat_messages (user_id, role, body) VALUES ($1, 'user', $2)", [user.hub_user_id, body]);
  const reply = await answerNutrition(body, user.hub_user_id);
  await query("INSERT INTO chat_messages (user_id, role, body) VALUES ($1, 'bot', $2)", [user.hub_user_id, reply]);
  revalidatePath("/chat");
}

const chips = ["احسب السعرات", "اقتراح وجبة", "ما هو تمريني اليوم؟"];

export default async function ChatPage() {
  const user = await guard();
  const msgs = await query<any>(
    "SELECT role, body FROM chat_messages WHERE user_id = $1 ORDER BY id DESC LIMIT 50",
    [user.hub_user_id],
  );
  msgs.reverse();
  return (
    <>
      <Header />
      <main className="page">
        <div className="row" style={{ marginBottom: 16 }}>
          <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#16265c", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={24} color="#5eead4" />
          </span>
          <div>
            <div style={{ fontWeight: 800, color: "#16265c" }}>غامبول AI</div>
            <div className="muted">مساعدك الشخصي للياقة البدنية</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {msgs.length === 0 && (
            <div className="card muted">اسأل غامبول عن السعرات، البروتين، اقتراح وجبة، أو تمرينك اليوم.</div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{
              maxWidth: "85%", padding: "10px 14px", borderRadius: 16, whiteSpace: "pre-line",
              justifySelf: m.role === "user" ? "start" : "end",
              background: m.role === "user" ? "#16265c" : "#fff",
              color: m.role === "user" ? "#fff" : "#111827",
              boxShadow: "0 1px 3px rgba(16,24,60,.06)",
            }}>{m.body}</div>
          ))}
        </div>
        <div className="row" style={{ flexWrap: "wrap", marginBottom: 12 }}>
          {chips.map((c) => (
            <form key={c} action={send}><input type="hidden" name="body" value={c} />
              <button className="chip" style={{ border: 0 }} type="submit">{c}</button>
            </form>
          ))}
        </div>
        <form action={send} className="row">
          <input name="body" placeholder="اسأل غامبول عن أي شيء..."
            style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid #e5e7eb" }} />
          <button type="submit" style={{ border: 0, background: "#16265c", borderRadius: 12, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={18} color="#fff" />
          </button>
        </form>
      </main>
      <BottomNav active="/chat" />
    </>
  );
}
