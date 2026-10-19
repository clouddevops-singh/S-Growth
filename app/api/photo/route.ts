import { del, get, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { isAuthenticated } from "@/lib/auth";
import { readState, writeState } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 15;
const MAX_BYTES = 4 * 1024 * 1024;
const localData = path.join(process.cwd(), ".data");

function imageType(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

export async function GET() {
  if (!await isAuthenticated()) return new Response("Unauthorized", { status: 401 });
  const state = await readState();
  if (!state.photoKey) return new Response(null, { status: 404 });
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await get(state.photoKey, { access: "private", useCache: false });
    if (!blob || blob.statusCode !== 200) return new Response(null, { status: 404 });
    return new Response(blob.stream, { headers: { "Content-Type": blob.blob.contentType, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  }
  try {
    const bytes = await readFile(path.join(localData, "avatar"));
    const type = imageType(bytes);
    return new Response(bytes, { headers: { "Content-Type": type || "application/octet-stream", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}

export async function POST(request: Request) {
  if (!await isAuthenticated()) return NextResponse.json({ error: "Sign in before uploading a photo." }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("photo");
  if (!(file instanceof File) || file.size < 1 || file.size > MAX_BYTES) return NextResponse.json({ error: "Choose an image smaller than 4 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image." }, { status: 415 });
  const state = await readState();
  const key = `private/s-growth/avatar-${crypto.randomUUID()}`;
  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) await put(key, bytes, { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: type });
    else {
      await mkdir(localData, { recursive: true });
      await writeFile(path.join(localData, "avatar"), bytes, { mode: 0o600 });
    }
    const oldKey = state.photoKey;
    state.photoKey = key;
    await writeState(state);
    if (oldKey && process.env.BLOB_READ_WRITE_TOKEN) await del(oldKey).catch(() => undefined);
    return NextResponse.json({ ok: true, photoKey: key, url: `/api/photo?t=${Date.now()}` });
  } catch {
    return NextResponse.json({ error: "The image could not be saved. Check the storage configuration and try again." }, { status: 503 });
  }
}
