import type { XTCurve } from "@/lib/types";
import { bandPath, linePath, logScale, pow2Ticks } from "@/lib/svg";

const W = 1000;
const H = 460;
const PAD = { l: 70, r: 160, t: 36, b: 60 };

// y range for the log-y regret axis. Floor at 1e-3 (any regret < 0.001 is
// "essentially zero"); ceiling 1 = no-search baseline (full regret).
const REGRET_FLOOR = 1e-3;
const REGRET_CEIL = 1;

// Stable per-curve color scheme. Indigo = 35B family, rose = 4B family.
function styleFor(model: string, F: string): {
  stroke: string;
  band: string;
  label: string;
  dashed: boolean;
} | null {
  if (model === "Qwen3.6-35B-A3B" && F === "F0")
    return {
      stroke: "#4f46e5",
      band: "rgba(79,70,229,0.14)",
      label: "35B · F0",
      dashed: false,
    };
  if (model === "Qwen3.6-35B-A3B" && F === "F2")
    return {
      stroke: "#818cf8",
      band: "rgba(129,140,248,0.18)",
      label: "35B · F2",
      dashed: true,
    };
  if (model === "Qwen3.5-4B" && F === "F0")
    return {
      stroke: "#e11d48",
      band: "rgba(225,29,72,0.14)",
      label: "4B · F0",
      dashed: false,
    };
  if (model === "Qwen3.5-4B" && F === "F2")
    return {
      stroke: "#fb7185",
      band: "rgba(251,113,133,0.20)",
      label: "4B · F2",
      dashed: true,
    };
  return null;
}

const HERO_MODELS = new Set(["Qwen3.6-35B-A3B", "Qwen3.5-4B"]);

// regret = 1 - mean_norm, clamped to [REGRET_FLOOR, REGRET_CEIL] so log-y
// doesn't blow up when a saturated model reaches mean_norm ≈ 1.
function regretClamped(mn: number): number {
  const r = 1 - mn;
  if (r <= REGRET_FLOOR) return REGRET_FLOOR;
  if (r >= REGRET_CEIL) return REGRET_CEIL;
  return r;
}

export function HeroChart({ curves }: { curves: XTCurve[] }) {
  const picked = curves
    .filter((c) => HERO_MODELS.has(c.model) && c.H === "H3")
    .filter((c) => c.Ks.length >= 2);

  // Unified K-range. Always force [1, 128] minimum so the four-curve story
  // remains readable even when a curve is short.
  let kMin = Infinity;
  let kMax = -Infinity;
  for (const c of picked) {
    kMin = Math.min(kMin, c.Ks[0]);
    kMax = Math.max(kMax, c.Ks[c.Ks.length - 1]);
  }
  kMin = Math.min(kMin, 1);
  kMax = Math.max(kMax, 128);

  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  // log-y over [floor, 1], inverted so 1 (worst regret) is at the top of
  // the plot. The "tangent shape" the user asked for IS this: each curve,
  // approximately a power law, becomes a straight line on log-log.
  const sy = logScale([REGRET_CEIL, REGRET_FLOOR], [PAD.t, H - PAD.b]);

  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [1, 0.3, 0.1, 0.03, 0.01, 0.003, 0.001];

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          Regret vs trials — 35B vs 4B
        </h2>
        <span className="text-xs text-zinc-400 tabular-nums">
          log–log · y = 1 − mean_norm · x = K (trials)
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        Cross-task normalized regret over 8 deterministic probes. Lower is
        better. Each curve is approximately straight in log–log because
        regret falls roughly as a power law in K. No fit overlaid — the
        slope you see in the data IS the &quot;tangent&quot;.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Regret vs trials, log-log, 35B vs 4B"
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
              {y < 0.01 ? y.toExponential(0) : y.toString()}
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
          y={H - 16}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
        >
          K (trials, log scale)
        </text>
        <text
          x={18}
          y={(PAD.t + H - PAD.b) / 2}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
          transform={`rotate(-90 18 ${(PAD.t + H - PAD.b) / 2})`}
        >
          regret = 1 − mean_norm (log)
        </text>

        {/* SEM bands first (back), then lines, then markers */}
        {picked.map((c) => {
          const s = styleFor(c.model, c.F);
          if (!s) return null;
          const upper: Array<[number, number]> = [];
          const lower: Array<[number, number]> = [];
          for (let i = 0; i < c.Ks.length; i++) {
            const e = c.sem[i] ?? 0;
            const mn = c.mean_norm[i];
            const k = c.Ks[i];
            // band is symmetric in mean_norm; convert each edge to regret.
            const rHi = regretClamped(mn - (e ?? 0)); // worse perf -> bigger regret
            const rLo = regretClamped(mn + (e ?? 0));
            upper.push([sx(k), sy(rHi)]);
            lower.push([sx(k), sy(rLo)]);
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
          if (!s) return null;
          const pts = c.Ks.map(
            (k, i) =>
              [sx(k), sy(regretClamped(c.mean_norm[i]))] as [number, number],
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
                  r={3.8}
                  fill="white"
                  stroke={s.stroke}
                  strokeWidth={1.8}
                />
              ))}
            </g>
          );
        })}

        {/* legend with raw regret-at-K=1 and K=K_last so the user can
            read off the actual numbers from the chart without hovering. */}
        <g>
          {picked.map((c, i) => {
            const s = styleFor(c.model, c.F);
            if (!s) return null;
            const y0 = PAD.t + 10 + i * 32;
            const lx = W - PAD.r + 14;
            const r1 = 1 - c.mean_norm[0];
            const rL = 1 - c.mean_norm[c.mean_norm.length - 1];
            const reduction = r1 > 0 && rL > 0 ? r1 / rL : null;
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
                <circle
                  cx={lx + 14}
                  cy={y0}
                  r={3.5}
                  fill="white"
                  stroke={s.stroke}
                  strokeWidth={1.6}
                />
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
                  y={y0 + 18}
                  fontSize={10}
                  fill="#71717a"
                  className="tabular-nums"
                >
                  K=1→{c.Ks[c.Ks.length - 1]}:{" "}
                  {reduction
                    ? `${r1.toFixed(3)} → ${rL.toFixed(3)} (${reduction.toFixed(1)}×)`
                    : "—"}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
