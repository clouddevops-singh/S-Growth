import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { readState, writeState } from "@/lib/store";
import { validState } from "@/lib/model";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET() {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Sign in to access your growth data." }, { status: 401 });
  try { return NextResponse.json(await readState(), { headers: { "Cache-Control": "private, no-store" } }); }
  catch { return NextResponse.json({ error: "Your saved data could not be loaded." }, { status: 503 }); }
}

export async function PUT(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Sign in to save your growth data." }, { status: 401 });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return NextResponse.json({ error: "Request origin was rejected." }, { status: 403 });
  const state: unknown = await request.json().catch(() => null);
  if (!validState(state)) return NextResponse.json({ error: "The supplied data is invalid or too large." }, { status: 400 });
  try { await writeState(state); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Your changes could not be saved. Check the storage configuration and try again." }, { status: 503 }); }
}
