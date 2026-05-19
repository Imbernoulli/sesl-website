import fs from "node:fs/promises";
import path from "node:path";
import type { SiteState } from "./types";

// Static export: read public/data/state.json at build time and inline.
export async function loadState(): Promise<SiteState> {
  const p = path.join(process.cwd(), "public", "data", "state.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as SiteState;
}
