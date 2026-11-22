import { NextRequest, NextResponse } from "next/server";
import { createLinkState } from "@/lib/link-state";

// Sets the browser state cookie (route handlers may write cookies) and sends
// the user to the Hub connect page.
export async function GET(req: NextRequest) {
  const hubUrl = process.env.HUB_URL ?? "https://student-hub-egypt.vercel.app";
  const state = await createLinkState();
  return NextResponse.redirect(
    new URL(`${hubUrl}/fitness/connect?state=${encodeURIComponent(state)}`, req.url),
  );
}
