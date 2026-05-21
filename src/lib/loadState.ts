import fs from "node:fs/promises";
import path from "node:path";
import type { ScalingLaws, SiteState } from "./types";

// Static export: read public/data/state.json at build time and inline.
export async function loadState(): Promise<SiteState> {
  const p = path.join(process.cwd(), "public", "data", "state.json");
  const raw = await fs.readFile(p, "utf-8");
  return JSON.parse(raw) as SiteState;
}

// Scaling-law tables (Chinchilla mirror); separate file so the main
// dashboard doesn't load this much data on every visit.
export async function loadScalingLaws(): Promise<ScalingLaws | null> {
  const p = path.join(process.cwd(), "public", "data", "scaling_laws.json");
  try {
    const raw = await fs.readFile(p, "utf-8");
    return JSON.parse(raw) as ScalingLaws;
  } catch {
    return null;
  }
}
