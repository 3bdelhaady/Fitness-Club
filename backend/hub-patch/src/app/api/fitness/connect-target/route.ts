import { NextResponse } from "next/server";

// Returns the allowlisted Fitness app origin. The connect page redirects only
// here, never to a caller-supplied URL.
export async function GET() {
  const origin = process.env.FITNESS_APP_ORIGIN ?? "";
  if (!origin) return NextResponse.json({ error: "not configured" }, { status: 503 });
  return NextResponse.json({ origin });
}
