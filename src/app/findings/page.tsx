import type { Metadata } from "next";
import { loadScalingLaws, loadState } from "@/lib/loadState";
import { FindingsView } from "@/components/FindingsView";

export const metadata: Metadata = {
  title: "SESL — Scaling Laws · Chinchilla mirror",
  description:
    "Five-figure scaling-law analysis on SESL data, mirroring Hoffmann et al. (2022) arXiv:2203.15556: training-curve envelope, IsoCompute U-shapes, parametric L(N,K), predicted-vs-actual.",
};

export default async function FindingsPage() {
  const [state, sl] = await Promise.all([loadState(), loadScalingLaws()]);
  return (
    <FindingsView
      scalingLaws={sl}
      generatedAtIso={state.generated_at_iso}
      gitSha={state.git_sha}
    />
  );
}
