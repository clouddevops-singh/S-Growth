import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await isAuthenticated();
  return NextResponse.json({ authenticated, email: authenticated ? process.env.ADMIN_EMAIL : null });
}
