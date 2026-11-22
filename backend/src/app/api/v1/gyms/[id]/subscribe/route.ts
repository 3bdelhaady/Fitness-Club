import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const { plan_id } = await req.json().catch(() => ({}));
  const plan = await queryOne("SELECT 1 FROM gym_plans WHERE id = $1 AND gym_id = $2", [Number(plan_id), Number(id)]);
  if (!plan) return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  await query("UPDATE profiles SET gym_id = $2 WHERE user_id = $1", [u.hub_user_id, Number(id)]);
  await query("INSERT INTO subscriptions (user_id, gym_id, plan_id) VALUES ($1, $2, $3)", [u.hub_user_id, Number(id), Number(plan_id)]);
  return ok({ status: "requested" });
}
