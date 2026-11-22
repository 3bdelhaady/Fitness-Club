import { NextRequest, NextResponse } from "next/server";
import { requireApiUser, ok } from "@/lib/api-auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const u = requireApiUser(req);
  if (u instanceof NextResponse) return u;
  return ok({ gyms: await query("SELECT * FROM gyms ORDER BY id") });
}
