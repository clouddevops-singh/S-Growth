import { NextResponse } from "next/server";
import { makeSession, passwordMatches, sessionCookie, sessionMaxAge } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!expectedEmail || !process.env.ADMIN_PASSWORD_HASH || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Login is not configured yet." }, { status: 503 });
  }
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return NextResponse.json({ error: "Request origin was rejected." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (email !== expectedEmail || !passwordMatches(password)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }
  const response = NextResponse.json({ email: expectedEmail });
  response.cookies.set(sessionCookie, makeSession(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: sessionMaxAge,
  });
  return response;
}
