import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  const rows = await query(
    "SELECT id, title, body, read, at FROM notifications WHERE user_id = $1 ORDER BY id DESC LIMIT 50",
    [u.hub_user_id],
  );
  return ok({ notifications: rows });
}

export async function POST(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  await query("UPDATE notifications SET read = true WHERE user_id = $1", [u.hub_user_id]);
  return ok({ saved: true });
}
