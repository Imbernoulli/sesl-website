import type { XTCurve } from "@/lib/types";
import {
  bandPath,
  linePath,
  linearScale,
  logScale,
  pow2Ticks,
  sampleFit,
} from "@/lib/svg";

const W = 1000;
const H = 440;
const PAD = { l: 60, r: 140, t: 36, b: 56 };

// Stable per-curve color/label scheme. Indigo = 35B family, rose = 4B family.
function styleFor(model: string, F: string): {
  stroke: string;
  band: string;
  fit: string;
  label: string;
  dashed: boolean;
} | null {
  if (model === "Qwen3.6-35B-A3B" && F === "F0")
    return {
      stroke: "#4f46e5", // indigo-600
      band: "rgba(79,70,229,0.14)",
      fit: "#4f46e5",
      label: "35B - F0",
      dashed: false,
    };
  if (model === "Qwen3.6-35B-A3B" && F === "F2")
    return {
      stroke: "#818cf8", // indigo-400
      band: "rgba(129,140,248,0.18)",
      fit: "#818cf8",
      label: "35B - F2",
      dashed: true,
    };
  if (model === "Qwen3.5-4B" && F === "F0")
    return {
      stroke: "#e11d48", // rose-600
      band: "rgba(225,29,72,0.14)",
      fit: "#e11d48",
      label: "4B  - F0",
      dashed: false,
    };
  if (model === "Qwen3.5-4B" && F === "F2")
    return {
      stroke: "#fb7185", // rose-400
      band: "rgba(251,113,133,0.20)",
      fit: "#fb7185",
      label: "4B  - F2",
      dashed: true,
    };
  return null;
}

const HERO_MODELS = new Set(["Qwen3.6-35B-A3B", "Qwen3.5-4B"]);

export function HeroChart({ curves }: { curves: XTCurve[] }) {
  // Keep only the two headline models, both Fs, H3. Sort so 35B draws first
  // (under) and 4B draws over (so the striking rose curves catch the eye).
  const picked = curves
    .filter((c) => HERO_MODELS.has(c.model) && c.H === "H3")
    .filter((c) => c.Ks.length >= 2);

  // Build a unified K-range across all selected curves so axes line up.
  let kMin = Infinity;
  let kMax = -Infinity;
  for (const c of picked) {
    kMin = Math.min(kMin, c.Ks[0]);
    kMax = Math.max(kMax, c.Ks[c.Ks.length - 1]);
  }
  // Always show the full dyadic axis we'd expect during scaling so the
  // saturation story remains obvious even if curves are short.
  kMin = Math.min(kMin, 1);
  kMax = Math.max(kMax, 128);

  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = linearScale([0, 1.05], [H - PAD.b, PAD.t]);

  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          K-axis scaling — 35B vs 4B
        </h2>
        <span className="text-xs text-zinc-400 tabular-nums">
          y = mean normalized score · x = log<sub>2</sub> K
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        Cross-task normalized regret on 8 deterministic probes. SEM band shaded; dashed line = fitted power law B<sub>∞</sub> − A·K<sup>−α</sup>.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Cross-task scaling, 35B vs 4B"
      >
        {/* gridlines (y) */}
        {yTicks.map((y) => (
          <g key={`gy${y}`}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={sy(y)}
              y2={sy(y)}
              stroke="#f4f4f5"
            />
            <text
              x={PAD.l - 8}
              y={sy(y) + 4}
              fontSize={11}
              textAnchor="end"
              fill="#71717a"
              className="tabular-nums"
            >
              {y.toFixed(2)}
            </text>
          </g>
        ))}
        {/* gridlines (x) */}
        {xTicks.map((k) => (
          <g key={`gx${k}`}>
            <line
              x1={sx(k)}
              x2={sx(k)}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="#f4f4f5"
            />
            <text
              x={sx(k)}
              y={H - PAD.b + 16}
              fontSize={11}
              textAnchor="middle"
              fill="#71717a"
              className="tabular-nums"
            >
              {k}
            </text>
          </g>
        ))}
        {/* axes */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={H - PAD.b}
          y2={H - PAD.b}
          stroke="#d4d4d8"
        />
        <line
          x1={PAD.l}
          x2={PAD.l}
          y1={PAD.t}
          y2={H - PAD.b}
          stroke="#d4d4d8"
        />
        {/* axis labels */}
        <text
          x={(PAD.l + W - PAD.r) / 2}
          y={H - 14}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
        >
          K (trials, log scale)
        </text>
        <text
          x={16}
          y={(PAD.t + H - PAD.b) / 2}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
          transform={`rotate(-90 16 ${(PAD.t + H - PAD.b) / 2})`}
        >
          mean normalized score
        </text>

        {/* curves: bands first (back), then fits, then lines, then markers */}
        {picked.map((c) => {
          const s = styleFor(c.model, c.F);
          if (!s) return null;
          const upper: Array<[number, number]> = [];
          const lower: Array<[number, number]> = [];
          for (let i = 0; i < c.Ks.length; i++) {
            const e = c.sem[i] ?? 0;
            const y = c.mean_norm[i];
            const k = c.Ks[i];
            upper.push([sx(k), sy(Math.min(1.05, y + (e ?? 0)))]);
            lower.push([sx(k), sy(Math.max(0, y - (e ?? 0)))]);
          }
          return (
            <path
              key={`band-${c.model}-${c.F}`}
              d={bandPath(upper, lower)}
              fill={s.band}
              stroke="none"
            />
          );
        })}
        {picked.map((c) => {
          const s = styleFor(c.model, c.F);
          if (!s || !c.fit || c.fit.alpha === null || c.fit.B_inf === null || c.fit.A === null) return null;
          const samples = sampleFit(
            {
              alpha: c.fit.alpha as number,
              B_inf: c.fit.B_inf as number,
              A: c.fit.A as number,
            },
            c.Ks[0],
            c.Ks[c.Ks.length - 1],
          );
          const pts = samples.map(([k, y]) => [sx(k), sy(y)] as [number, number]);
          return (
            <path
              key={`fit-${c.model}-${c.F}`}
              d={linePath(pts)}
              stroke={s.fit}
              strokeOpacity={0.55}
              strokeDasharray="4 4"
              strokeWidth={1.4}
              fill="none"
            />
          );
        })}
        {picked.map((c) => {
          const s = styleFor(c.model, c.F);
          if (!s) return null;
          const pts = c.Ks.map(
            (k, i) => [sx(k), sy(c.mean_norm[i])] as [number, number],
          );
          return (
            <g key={`line-${c.model}-${c.F}`}>
              <path
                d={linePath(pts)}
                stroke={s.stroke}
                strokeWidth={2.3}
                fill="none"
                strokeDasharray={s.dashed ? "8 4" : undefined}
              />
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill="white"
                  stroke={s.stroke}
                  strokeWidth={1.6}
                />
              ))}
            </g>
          );
        })}

        {/* legend on the right */}
        <g>
          {picked.map((c, i) => {
            const s = styleFor(c.model, c.F);
            if (!s) return null;
            const y0 = PAD.t + 10 + i * 26;
            const lx = W - PAD.r + 14;
            const fit = c.fit;
            return (
              <g key={`legend-${c.model}-${c.F}`}>
                <line
                  x1={lx}
                  x2={lx + 28}
                  y1={y0}
                  y2={y0}
                  stroke={s.stroke}
                  strokeWidth={2.3}
                  strokeDasharray={s.dashed ? "6 3" : undefined}
                />
                <circle cx={lx + 14} cy={y0} r={3.5} fill="white" stroke={s.stroke} strokeWidth={1.6} />
                <text
                  x={lx + 34}
                  y={y0 + 4}
                  fontSize={11}
                  fill="#27272a"
                  className="tabular-nums"
                >
                  {s.label}
                </text>
                <text
                  x={lx + 34}
                  y={y0 + 16}
                  fontSize={10}
                  fill="#71717a"
                  className="tabular-nums"
                >
                  {fit && fit.alpha !== null
                    ? `α=${fit.alpha.toFixed(2)} r²=${(fit.r2 ?? 0).toFixed(2)}`
                    : "no fit (noisy)"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
