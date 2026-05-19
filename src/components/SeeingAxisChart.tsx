import type { XTCurve } from "@/lib/types";
import {
  bandPath,
  linePath,
  linearScale,
  logScale,
  pow2Ticks,
} from "@/lib/svg";

const W = 460;
const H = 240;
const PAD = { l: 42, r: 12, t: 18, b: 32 };

function findCurve(curves: XTCurve[], model: string, F: string) {
  return curves.find((c) => c.model === model && c.F === F && c.H === "H3");
}

function MiniPanel({
  title,
  caption,
  cF0,
  cF2,
  primary,
  secondary,
  gapColor,
  gapLabel,
}: {
  title: string;
  caption: string;
  cF0: XTCurve | undefined;
  cF2: XTCurve | undefined;
  primary: string;
  secondary: string;
  gapColor: string;
  gapLabel: string;
}) {
  if (!cF0 || !cF2) {
    return (
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5">
        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">
          {title}
        </div>
        <div className="text-xs text-zinc-500">no data</div>
      </div>
    );
  }
  const allKs = Array.from(new Set([...cF0.Ks, ...cF2.Ks])).sort(
    (a, b) => a - b,
  );
  const kMin = allKs[0];
  const kMax = allKs[allKs.length - 1];
  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = linearScale([0, 1.05], [H - PAD.b, PAD.t]);
  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [0, 0.5, 1];

  // Shared K's for the gap ribbon.
  const sharedKs = cF2.Ks.filter((k) => cF0.Ks.includes(k));
  const upper: Array<[number, number]> = [];
  const lower: Array<[number, number]> = [];
  for (const k of sharedKs) {
    const y2 = cF2.mean_norm[cF2.Ks.indexOf(k)];
    const y0 = cF0.mean_norm[cF0.Ks.indexOf(k)];
    upper.push([sx(k), sy(Math.max(y0, y2))]);
    lower.push([sx(k), sy(Math.min(y0, y2))]);
  }

  const ptsF0 = cF0.Ks.map(
    (k, i) => [sx(k), sy(cF0.mean_norm[i])] as [number, number],
  );
  const ptsF2 = cF2.Ks.map(
    (k, i) => [sx(k), sy(cF2.mean_norm[i])] as [number, number],
  );

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 flex flex-col">
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-xs uppercase tracking-wider text-zinc-500">{title}</div>
        <div className="text-xs text-zinc-400 tabular-nums">{gapLabel}</div>
      </div>
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
              {y.toFixed(1)}
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

        {/* gap ribbon */}
        <path d={bandPath(upper, lower)} fill={gapColor} stroke="none" />

        {/* F0 (solid) */}
        <path d={linePath(ptsF0)} stroke={primary} strokeWidth={2} fill="none" />
        {ptsF0.map(([x, y], i) => (
          <circle key={`F0-${i}`} cx={x} cy={y} r={2.5} fill="white" stroke={primary} strokeWidth={1.4} />
        ))}
        {/* F2 (dashed) */}
        <path
          d={linePath(ptsF2)}
          stroke={secondary}
          strokeWidth={2}
          strokeDasharray="6 3"
          fill="none"
        />
        {ptsF2.map(([x, y], i) => (
          <circle
            key={`F2-${i}`}
            cx={x}
            cy={y}
            r={2.5}
            fill="white"
            stroke={secondary}
            strokeWidth={1.4}
          />
        ))}

        {/* compact legend */}
        <g transform={`translate(${PAD.l + 6}, ${PAD.t + 6})`}>
          <line x1={0} x2={18} y1={6} y2={6} stroke={primary} strokeWidth={2} />
          <text x={22} y={9} fontSize={10} fill="#27272a">F0</text>
          <line
            x1={50}
            x2={68}
            y1={6}
            y2={6}
            stroke={secondary}
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <text x={72} y={9} fontSize={10} fill="#27272a">F2</text>
        </g>
      </svg>
      <p className="mt-1 text-xs text-zinc-500 leading-snug">{caption}</p>
    </div>
  );
}

export function SeeingAxisChart({ curves }: { curves: XTCurve[] }) {
  const c35F0 = findCurve(curves, "Qwen3.6-35B-A3B", "F0");
  const c35F2 = findCurve(curves, "Qwen3.6-35B-A3B", "F2");
  const c4F0 = findCurve(curves, "Qwen3.5-4B", "F0");
  const c4F2 = findCurve(curves, "Qwen3.5-4B", "F2");

  const gap35 =
    c35F0 && c35F2 && c35F0.Ks.length && c35F2.Ks.length
      ? (() => {
          const k = Math.min(
            c35F0.Ks[c35F0.Ks.length - 1],
            c35F2.Ks[c35F2.Ks.length - 1],
          );
          const i0 = c35F0.Ks.indexOf(k);
          const i2 = c35F2.Ks.indexOf(k);
          if (i0 < 0 || i2 < 0) return null;
          return {
            k,
            gap: c35F2.mean_norm[i2] - c35F0.mean_norm[i0],
          };
        })()
      : null;
  const gap4 =
    c4F0 && c4F2 && c4F0.Ks.length && c4F2.Ks.length
      ? (() => {
          const sharedKs = c4F2.Ks.filter((k) => c4F0.Ks.includes(k));
          if (!sharedKs.length) return null;
          const k = sharedKs[sharedKs.length - 1];
          const i0 = c4F0.Ks.indexOf(k);
          const i2 = c4F2.Ks.indexOf(k);
          return { k, gap: c4F2.mean_norm[i2] - c4F0.mean_norm[i0] };
        })()
      : null;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
          Seeing axis · F0 vs F2
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Small model benefits from rich feedback; large model is already saturated.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MiniPanel
          title="Qwen3.5-4B"
          caption="4B needs F2 — gap is wide and the F2 curve sits above F0 at most K."
          cF0={c4F0}
          cF2={c4F2}
          primary="#e11d48"
          secondary="#fb7185"
          gapColor="rgba(244,63,94,0.18)"
          gapLabel={
            gap4
              ? `F2 − F0 @ K=${gap4.k}: ${gap4.gap >= 0 ? "+" : ""}${gap4.gap.toFixed(2)}`
              : ""
          }
        />
        <MiniPanel
          title="Qwen3.6-35B-A3B"
          caption="35B is already saturated — F0 and F2 curves nearly overlap."
          cF0={c35F0}
          cF2={c35F2}
          primary="#4f46e5"
          secondary="#818cf8"
          gapColor="rgba(113,113,122,0.14)"
          gapLabel={
            gap35
              ? `F2 − F0 @ K=${gap35.k}: ${gap35.gap >= 0 ? "+" : ""}${gap35.gap.toFixed(2)}`
              : ""
          }
        />
      </div>
    </div>
  );
}
