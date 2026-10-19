import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "s_growth_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
  return value;
}

export function passwordMatches(password: string) {
  const configured = process.env.ADMIN_PASSWORD_HASH || "";
  const [salt, expectedHex] = configured.split(":");
  if (!salt || !expectedHex || password.length > 256) return false;
  const expected = Buffer.from(expectedHex, "hex");
  if (expected.length !== 64) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, expected);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function validSession(token: string | undefined) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp: number };
    return Number.isFinite(data.exp) && data.exp > Date.now() / 1000;
  } catch { return false; }
}

export async function isAuthenticated() {
  const jar = await cookies();
  return validSession(jar.get(COOKIE)?.value);
}

export const sessionCookie = COOKIE;
export const sessionMaxAge = MAX_AGE;
