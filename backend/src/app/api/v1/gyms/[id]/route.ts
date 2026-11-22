import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const { id } = await params;
  const gym = await queryOne("SELECT * FROM gyms WHERE id = $1", [Number(id)]);
  if (!gym) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const plans = await query("SELECT * FROM gym_plans WHERE gym_id = $1 ORDER BY price_egp", [Number(id)]);
  return ok({ gym, plans });
}
