import type { XTCurve } from "@/lib/types";
import { linePath, logScale } from "@/lib/svg";

function findCurve(
  curves: XTCurve[],
  model: string,
  F: string,
): XTCurve | undefined {
  return curves.find((c) => c.model === model && c.F === F && c.H === "H3");
}

function regretAt(curve: XTCurve | undefined, K: number): number | null {
  if (!curve) return null;
  const i = curve.Ks.indexOf(K);
  if (i < 0) return null;
  return 1 - curve.mean_norm[i];
}

// Smallest K at which `curve.regret(K) <= targetRegret`. Used to compare
// sample efficiency between models: 35B and 4B reach a given regret at
// different K, and the K-ratio = sample-efficiency advantage.
function firstKAtRegret(
  curve: XTCurve | undefined,
  targetRegret: number,
): number | null {
  if (!curve) return null;
  for (let i = 0; i < curve.Ks.length; i++) {
    const r = 1 - curve.mean_norm[i];
    if (r <= targetRegret) return curve.Ks[i];
  }
  return null;
}

function SparkRegret({
  curve,
  color,
  width = 90,
  height = 32,
}: {
  curve: XTCurve;
  color: string;
  width?: number;
  height?: number;
}) {
  // log-x K, log-y regret. Floors at 1e-3 so saturated runs don't disappear.
  const ks = curve.Ks;
  const rs = curve.mean_norm.map((m) => Math.max(1 - m, 1e-3));
  const sx = logScale([ks[0], ks[ks.length - 1] || 1], [3, width - 3]);
  const sy = logScale([1, 1e-3], [3, height - 3]);
  const pts = ks.map((k, i) => [sx(k), sy(rs[i])] as [number, number]);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-24 h-8">
      <path d={linePath(pts)} stroke={color} strokeWidth={1.6} fill="none" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill={color} />
      ))}
    </svg>
  );
}

export function HeadlineKPIs({ curves }: { curves: XTCurve[] }) {
  const c35F0 = findCurve(curves, "Qwen3.6-35B-A3B", "F0");
  const c35F2 = findCurve(curves, "Qwen3.6-35B-A3B", "F2");
  const c4F0 = findCurve(curves, "Qwen3.5-4B", "F0");
  const c4F2 = findCurve(curves, "Qwen3.5-4B", "F2");

  // ===========================================================
  // Tile A — Sample-efficiency: 35B vs 4B at matched regret.
  //
  // Find the regret reached by 4B-F0 at its largest available K, then
  // find the smallest K at which 35B-F0 already crosses that regret.
  // The ratio K_4B / K_35B = sample-efficiency advantage of 35B.
  // ===========================================================
  let efficiencyRatio: number | null = null;
  let k4ref: number | null = null;
  let k35ref: number | null = null;
  if (c4F0 && c4F0.Ks.length && c35F0) {
    k4ref = c4F0.Ks[c4F0.Ks.length - 1];
    const r4 = 1 - c4F0.mean_norm[c4F0.mean_norm.length - 1];
    k35ref = firstKAtRegret(c35F0, r4);
    if (k35ref && k35ref > 0) {
      efficiencyRatio = k4ref / k35ref;
    }
  }

  // ===========================================================
  // Tile B — Feedback "head-start" on 35B at K=1.
  //
  // 35B + F2 starts at much lower regret than F0 at K=1; this gap
  // shrinks with K. Computed as r(F0, K=1) / r(F2, K=1).
  // ===========================================================
  const r35F0_K1 = regretAt(c35F0, 1);
  const r35F2_K1 = regretAt(c35F2, 1);
  const headstartRatio =
    r35F0_K1 !== null && r35F2_K1 !== null && r35F2_K1 > 0
      ? r35F0_K1 / r35F2_K1
      : null;

  // ===========================================================
  // Tile C — F2 hurts 4B. Compute average regret ratio F2/F0
  // across shared Ks. >1 means F2 is worse.
  // ===========================================================
  let f2vsF0_4B_ratio: number | null = null;
  let n_shared = 0;
  if (c4F0 && c4F2) {
    const sharedKs = c4F0.Ks.filter((k) => c4F2.Ks.includes(k));
    if (sharedKs.length) {
      const ratios: number[] = [];
      for (const k of sharedKs) {
        const r0 = regretAt(c4F0, k);
        const r2 = regretAt(c4F2, k);
        if (r0 !== null && r2 !== null && r0 > 1e-4 && r2 > 1e-4) {
          ratios.push(r2 / r0);
        }
      }
      n_shared = ratios.length;
      if (ratios.length)
        f2vsF0_4B_ratio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tile A — sample efficiency */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          35B vs 4B · sample efficiency
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-5xl font-light tabular-nums text-indigo-700">
            {efficiencyRatio ? `${efficiencyRatio.toFixed(0)}×` : "—"}
          </div>
          {c35F0 ? (
            <div className="pb-1">
              <SparkRegret curve={c35F0} color="#4f46e5" />
            </div>
          ) : null}
        </div>
        <div className="text-xs text-zinc-600 tabular-nums">
          35B at K={k35ref ?? "—"} matches 4B at K={k4ref ?? "—"}
        </div>
        <div className="text-xs text-zinc-500">
          Bigger reasoning model converts each trial into far more regret
          reduction.
        </div>
      </div>

      {/* Tile B — F2 head-start on 35B */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          35B · F2 head-start at K=1
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-5xl font-light tabular-nums text-indigo-700">
            {headstartRatio ? `${headstartRatio.toFixed(1)}×` : "—"}
          </div>
          <div className="pb-2 text-xs text-zinc-500 tabular-nums">
            lower regret
          </div>
        </div>
        <div className="text-xs text-zinc-600 tabular-nums">
          regret(F0)={r35F0_K1?.toFixed(3) ?? "—"} · regret(F2)=
          {r35F2_K1?.toFixed(3) ?? "—"}
        </div>
        <div className="text-xs text-zinc-500">
          Rich feedback gives the large model a head-start; gap closes by
          K=8 as search makes up the deficit.
        </div>
      </div>

      {/* Tile C — F2 hurts 4B */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          4B · F2 vs F0 (worse if &gt; 1)
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div
            className={`text-5xl font-light tabular-nums ${
              f2vsF0_4B_ratio && f2vsF0_4B_ratio > 1.05
                ? "text-rose-700"
                : "text-zinc-700"
            }`}
          >
            {f2vsF0_4B_ratio ? `${f2vsF0_4B_ratio.toFixed(2)}×` : "—"}
          </div>
          {c4F0 ? (
            <div className="pb-1">
              <SparkRegret curve={c4F0} color="#e11d48" />
            </div>
          ) : null}
        </div>
        <div className="text-xs text-zinc-600 tabular-nums">
          mean regret ratio over {n_shared} shared K · &gt; 1 means F2 is
          worse
        </div>
        <div className="text-xs text-zinc-500">
          Counter-intuitive: small model is hurt by verbose F2 feedback —
          attention dilution / output-budget squeeze.
        </div>
      </div>
    </div>
  );
}
