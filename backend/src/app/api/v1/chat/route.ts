import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query } from "@/lib/db";
import { answerNutrition } from "@/lib/nutrition";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const msgs = await query(
    "SELECT role, body, at FROM chat_messages WHERE user_id = $1 ORDER BY id DESC LIMIT 50",
    [u.hub_user_id],
  );
  return ok({ messages: msgs.reverse() });
}

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { body } = await req.json().catch(() => ({}));
  if (typeof body !== "string" || !body.trim()) return NextResponse.json({ error: "empty" }, { status: 400 });
  await query("INSERT INTO chat_messages (user_id, role, body) VALUES ($1, 'user', $2)", [u.hub_user_id, body.trim()]);
  const reply = await answerNutrition(body, u.hub_user_id);
  await query("INSERT INTO chat_messages (user_id, role, body) VALUES ($1, 'bot', $2)", [u.hub_user_id, reply]);
  return ok({ reply });
}
