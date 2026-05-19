import type { XTCurve } from "@/lib/types";
import {
  linePath,
  linearScale,
  logScale,
  pow2Ticks,
} from "@/lib/svg";

const W = 1000;
const H = 280;
const PAD = { l: 60, r: 160, t: 28, b: 44 };

function findCurve(curves: XTCurve[], model: string, F: string) {
  return curves.find((c) => c.model === model && c.F === F && c.H === "H3");
}

export function SizeAxisChart({ curves }: { curves: XTCurve[] }) {
  // 3 traces: 35B-F2 (top), 4B-F2 (mid), 4B-F0 (bottom).
  const c35F2 = findCurve(curves, "Qwen3.6-35B-A3B", "F2");
  const c4F2 = findCurve(curves, "Qwen3.5-4B", "F2");
  const c4F0 = findCurve(curves, "Qwen3.5-4B", "F0");

  const all = [c35F2, c4F2, c4F0].filter((c): c is XTCurve => !!c);
  if (!all.length) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          Size axis · 35B vs 4B
        </div>
        <div className="text-xs text-zinc-500 mt-2">no data</div>
      </div>
    );
  }
  let kMin = Infinity;
  let kMax = -Infinity;
  for (const c of all) {
    kMin = Math.min(kMin, c.Ks[0]);
    kMax = Math.max(kMax, c.Ks[c.Ks.length - 1]);
  }
  kMin = Math.min(kMin, 1);
  kMax = Math.max(kMax, 16);
  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = linearScale([0, 1.05], [H - PAD.b, PAD.t]);
  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const traces: Array<{
    curve: XTCurve;
    color: string;
    label: string;
    dashed: boolean;
  }> = [];
  if (c35F2) traces.push({ curve: c35F2, color: "#4f46e5", label: "35B - F2", dashed: false });
  if (c4F2) traces.push({ curve: c4F2, color: "#fb7185", label: "4B  - F2", dashed: true });
  if (c4F0) traces.push({ curve: c4F0, color: "#e11d48", label: "4B  - F0", dashed: false });

  // Annotation: gap at the largest K shared between 35B-F2 and 4B-F2.
  let annoText: string | null = null;
  if (c35F2 && c4F2) {
    const sharedKs = c4F2.Ks.filter((k) => c35F2.Ks.includes(k));
    if (sharedKs.length) {
      const k = sharedKs[sharedKs.length - 1];
      const big = c35F2.mean_norm[c35F2.Ks.indexOf(k)];
      const small = c4F2.mean_norm[c4F2.Ks.indexOf(k)];
      annoText = `Size gap @ K=${k}: 35B−4B (F2) = ${(big - small).toFixed(2)}`;
    }
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          Size axis · 35B vs 4B
        </h2>
        {annoText ? (
          <span className="text-xs text-zinc-500 tabular-nums">{annoText}</span>
        ) : null}
      </div>
      <p className="text-xs text-zinc-500 mb-2">
        4B cannot approach 35B even on F2 with rich feedback.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
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
              x={PAD.l - 6}
              y={sy(y) + 3}
              fontSize={10}
              textAnchor="end"
              fill="#71717a"
              className="tabular-nums"
            >
              {y.toFixed(2)}
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
              stroke="#fafafa"
            />
            <text
              x={sx(k)}
              y={H - PAD.b + 14}
              fontSize={10}
              textAnchor="middle"
              fill="#71717a"
              className="tabular-nums"
            >
              {k}
            </text>
          </g>
        ))}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={H - PAD.b}
          y2={H - PAD.b}
          stroke="#d4d4d8"
        />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" />

        {traces.map((t) => {
          const pts = t.curve.Ks.map(
            (k, i) => [sx(k), sy(t.curve.mean_norm[i])] as [number, number],
          );
          return (
            <g key={t.label}>
              <path
                d={linePath(pts)}
                stroke={t.color}
                strokeWidth={2.2}
                fill="none"
                strokeDasharray={t.dashed ? "8 4" : undefined}
              />
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="white"
                  stroke={t.color}
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}

        {/* legend */}
        <g>
          {traces.map((t, i) => {
            const y0 = PAD.t + 8 + i * 22;
            const lx = W - PAD.r + 14;
            return (
              <g key={`leg-${t.label}`}>
                <line
                  x1={lx}
                  x2={lx + 26}
                  y1={y0}
                  y2={y0}
                  stroke={t.color}
                  strokeWidth={2.2}
                  strokeDasharray={t.dashed ? "6 3" : undefined}
                />
                <text
                  x={lx + 32}
                  y={y0 + 4}
                  fontSize={11}
                  fill="#27272a"
                  className="tabular-nums"
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
