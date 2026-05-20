import type { Trajectory } from "@/lib/types";
import { linePath, logScale, pow2Ticks } from "@/lib/svg";

// Codex Recommendation C (2026-05-19): per-task small multiples are the
// headline; aggregate is secondary. Each panel = one task; trajectories
// inside it are coloured by (model, F). The envelope per-panel is the
// MIN rel_loss across runs ON THIS TASK ONLY — no cross-task interference
// (the Rastrigin-hits-0 problem that flattened the aggregate envelope).

const REGRET_FLOOR = 1e-6;
const REGRET_CEIL = 1.5;

const PW = 280; // panel width
const PH = 200; // panel height
const PAD = { l: 36, r: 6, t: 22, b: 26 };

function colorFor(model: string, F: string): {
  stroke: string;
  dashed: boolean;
  label: string;
} {
  if (model === "Qwen3.6-35B-A3B")
    return { stroke: "#4f46e5", dashed: F === "F2", label: `35B-${F}` };
  if (model === "Qwen3.5-4B")
    return { stroke: "#e11d48", dashed: F === "F2", label: `4B-${F}` };
  if (model === "Qwen3.6-27B")
    return { stroke: "#0891b2", dashed: F === "F2", label: `27B-${F}` };
  return { stroke: "#71717a", dashed: false, label: model };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function TaskPanel({ task, runs }: { task: string; runs: Trajectory[] }) {
  // K-range for this panel only
  let kMin = Infinity;
  let kMax = -Infinity;
  for (const r of runs) {
    if (!r.Ks.length) continue;
    kMin = Math.min(kMin, r.Ks[0]);
    kMax = Math.max(kMax, r.Ks[r.Ks.length - 1]);
  }
  if (!isFinite(kMin)) {
    kMin = 1;
    kMax = 16;
  }
  kMin = Math.min(kMin, 1);

  const sx = logScale([kMin, kMax], [PAD.l, PW - PAD.r]);
  const sy = logScale([REGRET_CEIL, REGRET_FLOOR], [PAD.t, PH - PAD.b]);

  const xTicks = pow2Ticks(kMin, kMax).filter((_, i, a) =>
    a.length <= 6 ? true : i % Math.ceil(a.length / 6) === 0,
  );
  const yTicks = [1, 0.01, 1e-4, 1e-6];

  // Per-task envelope = min rel_loss across all runs in this panel at each K
  const kSet = new Set<number>();
  for (const r of runs) for (const k of r.Ks) kSet.add(k);
  const kAll = [...kSet].sort((a, b) => a - b);
  const envPts: Array<[number, number]> = [];
  for (const k of kAll) {
    let best: number | null = null;
    for (const r of runs) {
      let v: number | null = null;
      for (let i = 0; i < r.Ks.length; i++) {
        if (r.Ks[i] <= k) v = r.regret[i];
        else break;
      }
      if (v !== null && (best === null || v < best)) best = v;
    }
    if (best !== null) {
      envPts.push([sx(k), sy(clamp(best, REGRET_FLOOR, REGRET_CEIL))]);
    }
  }

  // Group runs by class for legend counts
  const classCount = new Map<string, number>();
  for (const r of runs) {
    const cls = `${r.model}|${r.F}`;
    classCount.set(cls, (classCount.get(cls) ?? 0) + 1);
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-2">
      <div className="flex items-baseline justify-between mb-1 px-1">
        <span className="text-[11px] font-medium text-zinc-700 tabular-nums">
          {task}
        </span>
        <span className="text-[10px] text-zinc-400 tabular-nums">
          n={runs.length}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${PW} ${PH}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Trajectories on ${task}`}
      >
        {/* grid */}
        {yTicks.map((y) => (
          <g key={`gy${y}`}>
            <line
              x1={PAD.l}
              x2={PW - PAD.r}
              y1={sy(y)}
              y2={sy(y)}
              stroke="#f4f4f5"
            />
            <text
              x={PAD.l - 4}
              y={sy(y) + 3}
              fontSize={8}
              textAnchor="end"
              fill="#a1a1aa"
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
              y2={PH - PAD.b}
              stroke="#f4f4f5"
            />
            <text
              x={sx(k)}
              y={PH - PAD.b + 10}
              fontSize={8}
              textAnchor="middle"
              fill="#a1a1aa"
              className="tabular-nums"
            >
              {k}
            </text>
          </g>
        ))}
        {/* axes */}
        <line
          x1={PAD.l}
          x2={PW - PAD.r}
          y1={PH - PAD.b}
          y2={PH - PAD.b}
          stroke="#e4e4e7"
        />
        <line
          x1={PAD.l}
          x2={PAD.l}
          y1={PAD.t}
          y2={PH - PAD.b}
          stroke="#e4e4e7"
        />

        {/* trajectories */}
        {runs.map((r, i) => {
          const c = colorFor(r.model, r.F);
          const pts: Array<[number, number]> = [];
          for (let j = 0; j < r.Ks.length; j++) {
            pts.push([sx(r.Ks[j]), sy(clamp(r.regret[j], REGRET_FLOOR, REGRET_CEIL))]);
          }
          return (
            <path
              key={`tr-${i}`}
              d={linePath(pts)}
              stroke={c.stroke}
              strokeOpacity={0.45}
              strokeWidth={1.1}
              fill="none"
              strokeDasharray={c.dashed ? "3 2" : undefined}
            />
          );
        })}

        {/* per-task envelope on top */}
        {envPts.length > 1 ? (
          <path
            d={linePath(envPts)}
            stroke="#0f172a"
            strokeWidth={2.0}
            fill="none"
          />
        ) : null}
        {envPts.map(([x, y], i) => (
          <circle
            key={`env-${i}`}
            cx={x}
            cy={y}
            r={2.0}
            fill="white"
            stroke="#0f172a"
            strokeWidth={1.2}
          />
        ))}
      </svg>
      {/* mini-legend showing class counts */}
      <div className="flex flex-wrap gap-1 px-1 mt-1">
        {[...classCount.entries()]
          .sort()
          .map(([cls, n]) => {
            const [m, F] = cls.split("|");
            const c = colorFor(m, F);
            return (
              <span
                key={cls}
                className="text-[9px] tabular-nums text-zinc-600 inline-flex items-center gap-1"
              >
                <span
                  className="inline-block w-3 h-px"
                  style={{
                    background: c.stroke,
                    borderTop: c.dashed
                      ? `1px dashed ${c.stroke}`
                      : `1px solid ${c.stroke}`,
                  }}
                />
                {c.label}·{n}
              </span>
            );
          })}
      </div>
    </div>
  );
}

export function SmallMultiples({
  trajectories,
  minRuns = 4,
}: {
  trajectories: Trajectory[];
  minRuns?: number;
}) {
  if (!trajectories?.length) return null;
  // group by task
  const byTask = new Map<string, Trajectory[]>();
  for (const t of trajectories) {
    const arr = byTask.get(t.task);
    if (arr) arr.push(t);
    else byTask.set(t.task, [t]);
  }
  // keep tasks with enough runs for the panel to be informative.
  // SORT BY SIGNAL STRENGTH: panels whose per-task envelope decays a lot
  // (real scaling visible) come first; saturated/constant panels last.
  // The "signal" score = -log10(min_rel_loss) — i.e., how many decades
  // the envelope drops. Codex implicit prompt (2026-05-19): surface the
  // panels where the user can SEE the scaling, not where it's invisible.
  const scoredPanels: Array<{
    task: string;
    runs: Trajectory[];
    signal: number;
  }> = [];
  for (const [task, runs] of byTask) {
    if (runs.length < minRuns) continue;
    // compute per-task envelope min across all runs
    const kSet = new Set<number>();
    for (const r of runs) for (const k of r.Ks) kSet.add(k);
    const ks = [...kSet].sort((a, b) => a - b);
    let envMin = 1;
    for (const k of ks) {
      let best: number | null = null;
      for (const r of runs) {
        let v: number | null = null;
        for (let i = 0; i < r.Ks.length; i++) {
          if (r.Ks[i] <= k) v = r.regret[i];
          else break;
        }
        if (v !== null && (best === null || v < best)) best = v;
      }
      if (best !== null && best < envMin) envMin = best;
    }
    // signal: how many decades the envelope drops from 1.0 to its min.
    // Floor at 1e-5 so a constant-1.0 panel has signal ~0, a panel that
    // reaches the 1e-4 floor has signal ~4.
    const signal = -Math.log10(Math.max(envMin, 1e-5));
    scoredPanels.push({ task, runs, signal });
  }
  // Sort: highest signal first; ties broken by run count.
  scoredPanels.sort(
    (a, b) =>
      b.signal - a.signal || b.runs.length - a.runs.length,
  );
  const panels: Array<[string, Trajectory[]]> = scoredPanels.map((p) => [
    p.task,
    p.runs,
  ]);
  if (!panels.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500 mb-1">
          Per-task trajectories
        </h2>
        <p className="text-xs text-zinc-500">
          Need at least {minRuns} runs per task to draw a panel. Data filling
          in.
        </p>
      </div>
    );
  }
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          Per-task trajectories — small multiples
        </h2>
        <span className="text-xs text-zinc-400 tabular-nums">
          {panels.length} tasks · log–log rel_loss vs K
        </span>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        One panel per task. Each faint line is one run&apos;s trajectory on
        that task; the bold dark line is the per-task envelope (best
        rel_loss reached at each K across all conditions on the SAME task).
        No cross-task interference — a Rastrigin run can&apos;t pull the
        TSP envelope to zero.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {panels.map(([task, runs]) => (
          <TaskPanel key={task} task={task} runs={runs} />
        ))}
      </div>
    </div>
  );
}
