import type { XTCurve } from "@/lib/types";
import { linePath, linearScale, logScale } from "@/lib/svg";

function findCurve(
  curves: XTCurve[],
  model: string,
  F: string,
): XTCurve | undefined {
  return curves.find((c) => c.model === model && c.F === F && c.H === "H3");
}

// Smallest K at which mean_norm crosses a target. Returns null if never.
function firstKAt(curve: XTCurve | undefined, target: number): number | null {
  if (!curve) return null;
  for (let i = 0; i < curve.Ks.length; i++) {
    if (curve.mean_norm[i] >= target) return curve.Ks[i];
  }
  return null;
}

function pctAt(curve: XTCurve | undefined, K: number): number | null {
  if (!curve) return null;
  const i = curve.Ks.indexOf(K);
  if (i < 0) return null;
  return curve.mean_norm[i];
}

function Sparkline({
  curve,
  color,
  width = 80,
  height = 28,
}: {
  curve: XTCurve;
  color: string;
  width?: number;
  height?: number;
}) {
  const sx = logScale(
    [curve.Ks[0], curve.Ks[curve.Ks.length - 1]],
    [2, width - 2],
  );
  const sy = linearScale([0, 1], [height - 2, 2]);
  const pts = curve.Ks.map(
    (k, i) => [sx(k), sy(curve.mean_norm[i])] as [number, number],
  );
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-7">
      <path d={linePath(pts)} stroke={color} strokeWidth={1.4} fill="none" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.4} fill={color} />
      ))}
    </svg>
  );
}

export function HeadlineKPIs({ curves }: { curves: XTCurve[] }) {
  const c35F0 = findCurve(curves, "Qwen3.6-35B-A3B", "F0");
  const c35F2 = findCurve(curves, "Qwen3.6-35B-A3B", "F2");
  const c4F0 = findCurve(curves, "Qwen3.5-4B", "F0");
  const c4F2 = findCurve(curves, "Qwen3.5-4B", "F2");

  // Tile A: smallest K where 35B-F0 crosses 99% of its asymptote.
  const kCrossF0 = firstKAt(c35F0, 0.99);
  const kCrossF2 = firstKAt(c35F2, 0.99);

  // Tile B: F2 minus F0 on 4B. Prefer the largest positive gap (the
  // "rich-feedback helps" story). Fall back to the largest-magnitude gap
  // if there are no positive points yet (early-K noise on 4B-F2).
  let bestK = 1;
  let bestGap = 0;
  let sawPositive = false;
  if (c4F0 && c4F2) {
    for (const k of c4F2.Ks) {
      const i2 = c4F2.Ks.indexOf(k);
      const i0 = c4F0.Ks.indexOf(k);
      if (i2 < 0 || i0 < 0) continue;
      const gap = c4F2.mean_norm[i2] - c4F0.mean_norm[i0];
      if (gap > 0) {
        if (!sawPositive || gap > bestGap) {
          bestGap = gap;
          bestK = k;
          sawPositive = true;
        }
      } else if (!sawPositive && Math.abs(gap) > Math.abs(bestGap)) {
        bestGap = gap;
        bestK = k;
      }
    }
  }

  // Tile C: 35B F0 power-law exponent.
  const alpha35 = c35F0?.fit?.alpha ?? null;
  const r2_35 = c35F0?.fit?.r2 ?? null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tile A */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          35B saturates K-axis
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-5xl font-light tabular-nums text-indigo-700">
            K={kCrossF0 ?? "—"}
          </div>
          {c35F0 ? (
            <div className="pb-1">
              <Sparkline curve={c35F0} color="#4f46e5" />
            </div>
          ) : null}
        </div>
        <div className="text-xs text-zinc-600 tabular-nums">
          {c35F0
            ? `mean_norm @ K=${kCrossF0 ?? "?"} reaches ${(pctAt(c35F0, kCrossF0 ?? 0) ?? 0).toFixed(3)}`
            : "no curve"}
        </div>
        <div className="text-xs text-zinc-500">
          F0 needs only K={kCrossF0 ?? "—"}, F2 reaches 99% by K={kCrossF2 ?? "—"}.
        </div>
      </div>

      {/* Tile B */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          4B · F2 minus F0
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div
            className={`text-5xl font-light tabular-nums ${
              bestGap >= 0 ? "text-rose-700" : "text-zinc-700"
            }`}
          >
            {bestGap >= 0 ? "+" : ""}
            {bestGap.toFixed(2)}
          </div>
          <div className="pb-2 text-xs text-zinc-500 tabular-nums">
            at K={bestK}
          </div>
        </div>
        <div className="text-xs text-zinc-600">
          {bestGap >= 0
            ? "Rich feedback closes the gap on the small model."
            : "Small model — rich feedback still noisy at low K."}
        </div>
        <div className="text-xs text-zinc-500 tabular-nums">
          4B-F0 ≈ {pctAt(c4F0, bestK)?.toFixed(2) ?? "—"} · 4B-F2 ≈{" "}
          {pctAt(c4F2, bestK)?.toFixed(2) ?? "—"}
        </div>
      </div>

      {/* Tile C */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          Cross-task α · 35B-F0
        </div>
        <div className="flex items-end gap-3 mt-1">
          <div className="text-5xl font-light tabular-nums text-indigo-700">
            {alpha35 !== null ? alpha35.toFixed(2) : "—"}
          </div>
          <div className="pb-2 text-xs text-zinc-500 tabular-nums">
            r² = {r2_35 !== null ? r2_35.toFixed(2) : "—"}
          </div>
        </div>
        <div className="text-xs text-zinc-600">
          Power-law exponent of R(K) = R<sub>∞</sub> − A·K<sup>−α</sup>.
        </div>
        <div className="text-xs text-zinc-500">
          α ≈ 1.0 ≡ each doubling of K halves remaining regret.
        </div>
      </div>
    </div>
  );
}
