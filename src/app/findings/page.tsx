import type { Metadata } from "next";
import { loadState } from "@/lib/loadState";
import { FindingsView } from "@/components/FindingsView";

export const metadata: Metadata = {
  title: "SESL — Initial Findings · 初步结果",
  description:
    "Four results that current SESL grid runs already support: power-law scaling, feedback helps weak models more, 35B heuristic-lock, and small-model reversal on simple tasks.",
};

export default async function FindingsPage() {
  const state = await loadState();
  return (
    <FindingsView
      curves={state.xt_curves ?? []}
      headline={state.tasks_headline ?? []}
      generatedAtIso={state.generated_at_iso}
      gitSha={state.git_sha}
    />
  );
}
