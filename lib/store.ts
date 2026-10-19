import { get, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultState, type GrowthState, validState } from "@/lib/model";

const STATE_PATH = "private/s-growth/state.json";
const localData = path.join(process.cwd(), ".data");

export async function readState(): Promise<GrowthState> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const result = await get(STATE_PATH, { access: "private", useCache: false });
      if (!result || result.statusCode !== 200) return defaultState();
      const state: unknown = await new Response(result.stream).json();
      return validState(state) ? state : defaultState();
    } catch (error) {
      if (error instanceof Error && /not found|does not exist|404/i.test(error.message)) return defaultState();
      throw error;
    }
  }
  try {
    const state: unknown = JSON.parse(await readFile(path.join(localData, "state.json"), "utf8"));
    return validState(state) ? state : defaultState();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return defaultState();
    throw error;
  }
}

export async function writeState(state: GrowthState) {
  if (!validState(state)) throw new Error("The saved data is invalid or too large.");
  const json = JSON.stringify(state);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await put(STATE_PATH, json, {
      access: "private", addRandomSuffix: false, allowOverwrite: true,
      contentType: "application/json; charset=utf-8", cacheControlMaxAge: 0,
    });
    return;
  }
  await mkdir(localData, { recursive: true });
  const temp = path.join(localData, `state-${crypto.randomUUID()}.tmp`);
  await writeFile(temp, json, { mode: 0o600 });
  const { rename } = await import("node:fs/promises");
  await rename(temp, path.join(localData, "state.json"));
}
