import type { Trajectory, EnvelopePoint } from "@/lib/types";
import { bandPath, linePath, logScale, pow2Ticks } from "@/lib/svg";

const W = 1000;
const H = 520;
const PAD = { l: 70, r: 180, t: 36, b: 60 };

// Y-axis is REL_LOSS = (hi_task − best_at_K) / (hi_task − best_at_K1).
// Each run starts at 1.0 at K=K_first_valid and decays. Codex review
// 2026-05-19: the (hi − lo) scale cancels in the ratio so only the
// theoretical optimum hi_task matters (which is well-defined per task).
// Floor 1e-4 so converged tails stay visible; ceil 1.5 (slack above 1
// in case of mild noise at K=1).
const REGRET_FLOOR = 1e-4;
const REGRET_CEIL = 1.5;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Color by (model, F). Indigo for 35B, rose for 4B, F0 solid F2 dashed.
function colorFor(model: string, F: string): {
  stroke: string;
  faint: string;
  dashed: boolean;
  label: string;
} {
  if (model === "Qwen3.6-35B-A3B")
    return {
      stroke: "#4f46e5",
      faint: "rgba(79,70,229,0.16)",
      dashed: F === "F2",
      label: `35B-${F}`,
    };
  if (model === "Qwen3.5-4B")
    return {
      stroke: "#e11d48",
      faint: "rgba(225,29,72,0.16)",
      dashed: F === "F2",
      label: `4B-${F}`,
    };
  if (model === "Qwen3.6-27B")
    return {
      stroke: "#0891b2",
      faint: "rgba(8,145,178,0.14)",
      dashed: F === "F2",
      label: `27B-${F}`,
    };
  return {
    stroke: "#71717a",
    faint: "rgba(113,113,122,0.14)",
    dashed: false,
    label: model,
  };
}

export function TrajectoryChart({
  trajectories,
  envelope,
  envelopeByClass,
}: {
  trajectories: Trajectory[];
  envelope: EnvelopePoint[];
  envelopeByClass?: Record<string, EnvelopePoint[]>;
}) {
  if (!trajectories?.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-2">
          Per-run trajectories
        </h2>
        <p className="text-xs text-zinc-500">
          No trajectories yet. Data fills in as runs complete.
        </p>
      </div>
    );
  }

  // K-range across all trajectories
  let kMin = Infinity;
  let kMax = -Infinity;
  for (const t of trajectories) {
    if (!t.Ks.length) continue;
    kMin = Math.min(kMin, t.Ks[0]);
    kMax = Math.max(kMax, t.Ks[t.Ks.length - 1]);
  }
  kMin = Math.min(kMin, 1);
  kMax = Math.max(kMax, 128);

  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = logScale([REGRET_CEIL, REGRET_FLOOR], [PAD.t, H - PAD.b]);

  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [1, 0.3, 0.1, 0.03, 0.01, 0.003, 0.001, 0.0003, 0.0001];

  // Group runs by (model, F) for the legend.
  const byClass = new Map<
    string,
    { color: ReturnType<typeof colorFor>; runs: Trajectory[] }
  >();
  for (const t of trajectories) {
    const k = `${t.model}|${t.F}`;
    const c = byClass.get(k);
    if (c) c.runs.push(t);
    else byClass.set(k, { color: colorFor(t.model, t.F), runs: [t] });
  }

  // Envelope path (log-log).
  const envPts: Array<[number, number]> = [];
  for (const e of envelope ?? []) {
    const r = clamp(e.min_regret, REGRET_FLOOR, REGRET_CEIL);
    envPts.push([sx(e.K), sy(r)]);
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          Per-run trajectories — many curves, one envelope
        </h2>
        <span className="text-xs text-zinc-400 tabular-nums">
          log–log · y = normalized regret · x = K (trials)
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        Each faint line is one experiment&apos;s best-so-far trajectory over
        its K trials. y = rel_loss = (opt − best_at_K) / (opt −
        best_at_K=1), anchored to each task&apos;s theoretical optimum (TSP
        BHH bound, MaxCut all-edges, Rastrigin 0, Packomania optima for
        circles). Bold colored lines = the per-class lower envelope (one
        per model × F): the best rel_loss any run in that class achieved
        at each K — the actual compute-optimal frontier for that
        condition.
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Per-run trajectories, log-log"
      >
        {/* gridlines */}
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
          rel_loss = (opt − best_K) / (opt − best_1)   (log)
        </text>

        {/* All trajectories, faint, drawn first so envelope sits on top */}
        {trajectories.map((t, i) => {
          if (!t.Ks.length) return null;
          const c = colorFor(t.model, t.F);
          const pts: Array<[number, number]> = [];
          for (let j = 0; j < t.Ks.length; j++) {
            const r = clamp(t.regret[j], REGRET_FLOOR, REGRET_CEIL);
            pts.push([sx(t.Ks[j]), sy(r)]);
          }
          return (
            <path
              key={`tr-${i}`}
              d={linePath(pts)}
              stroke={c.stroke}
              strokeOpacity={0.32}
              strokeWidth={1.1}
              fill="none"
              strokeDasharray={c.dashed ? "3 2" : undefined}
            />
          );
        })}

        {/* Per-class envelopes on top: 4 bold lines, one per
            (model, F). Codex 2026-05-19: global envelope was dominated
            by one lucky saturated-task run. Per-class is the meaningful
            frontier. */}
        {envelopeByClass &&
          Object.entries(envelopeByClass).map(([key, env]) => {
            if (!env || env.length < 2) return null;
            const [model, F] = key.split("|");
            const s = colorFor(model, F);
            const pts: Array<[number, number]> = [];
            for (const e of env) {
              const r = clamp(e.min_regret, REGRET_FLOOR, REGRET_CEIL);
              pts.push([sx(e.K), sy(r)]);
            }
            return (
              <g key={`env-${key}`}>
                <path
                  d={linePath(pts)}
                  stroke={s.stroke}
                  strokeWidth={2.8}
                  fill="none"
                  strokeDasharray={s.dashed ? "8 3" : undefined}
                />
                {pts.map(([x, y], i) => (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={3.4}
                    fill="white"
                    stroke={s.stroke}
                    strokeWidth={1.8}
                  />
                ))}
              </g>
            );
          })}
        {/* Faint global envelope (informational, not headline) */}
        {envPts.length > 1 ? (
          <path
            d={linePath(envPts)}
            stroke="#0f172a"
            strokeOpacity={0.32}
            strokeWidth={1.2}
            strokeDasharray="2 3"
            fill="none"
          />
        ) : null}

        {/* Legend */}
        <g>
          {Array.from(byClass.entries()).map(([key, { color: c, runs }], i) => {
            const y0 = PAD.t + 10 + i * 22;
            const lx = W - PAD.r + 14;
            return (
              <g key={`legend-${key}`}>
                <line
                  x1={lx}
                  x2={lx + 28}
                  y1={y0}
                  y2={y0}
                  stroke={c.stroke}
                  strokeWidth={2.0}
                  strokeOpacity={0.7}
                  strokeDasharray={c.dashed ? "4 2" : undefined}
                />
                <text
                  x={lx + 34}
                  y={y0 + 4}
                  fontSize={11}
                  fill="#27272a"
                  className="tabular-nums"
                >
                  {c.label}
                </text>
                <text
                  x={lx + 34}
                  y={y0 + 16}
                  fontSize={10}
                  fill="#a1a1aa"
                  className="tabular-nums"
                >
                  n={runs.length} runs
                </text>
              </g>
            );
          })}
          {/* envelope legend */}
          <g>
            <line
              x1={W - PAD.r + 14}
              x2={W - PAD.r + 42}
              y1={PAD.t + 10 + byClass.size * 22}
              y2={PAD.t + 10 + byClass.size * 22}
              stroke="#0f172a"
              strokeWidth={2.6}
            />
            <text
              x={W - PAD.r + 48}
              y={PAD.t + 14 + byClass.size * 22}
              fontSize={11}
              fill="#0f172a"
              className="tabular-nums"
            >
              envelope (best so far)
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}
// suppress unused-import warning when bandPath helper isn't reached yet
export const _bandPath = bandPath;
