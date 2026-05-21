"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { ScalingLaws, TrainingCurve } from "@/lib/types";
import { linePath, linearScale, logScale, pow2Ticks } from "@/lib/svg";
import { findingsCopy, type Lang } from "@/lib/findings";

// ---------------------------------------------------------------------
// Shared scale + colour helpers. We pick a yellow → dark-blue ramp for
// proposer size (Chinchilla uses similar in Fig 2) so the eye can
// follow N across panels.
const N_COLOR: Record<number, string> = {
  3: "#fde047",   // 35B-A3B (active 3B) — yellow
  4: "#fb923c",   // 4B dense — orange
  27: "#1e3a8a",  // 27B — dark blue
};
function nColor(n: number) {
  // map any N to nearest known bucket; fallback to grey
  let best: number | null = null;
  let bestD = Infinity;
  for (const k of Object.keys(N_COLOR).map(Number)) {
    if (Math.abs(k - n) < bestD) {
      bestD = Math.abs(k - n);
      best = k;
    }
  }
  return best !== null ? N_COLOR[best] : "#a1a1aa";
}

function fmt(v: number | null | undefined, digits = 3) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

// ---------------------------------------------------------------------
// Figure 1 — N_opt(C) and K_opt(C) power laws (Chinchilla Fig 1).
function Figure1({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const bins = sl.iso_compute?.bins ?? [];
  const fitN = sl.iso_compute?.fit_N_opt_C;
  const fitK = sl.iso_compute?.fit_K_opt_C;

  if (bins.length < 2) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">{copy.fig1Title}</h2>
        <p className="text-sm text-zinc-500">insufficient compute coverage</p>
      </section>
    );
  }

  const W = 460, H = 240;
  const PAD = { l: 52, r: 14, t: 26, b: 36 };

  // Common C range
  const Cs = bins.map((b) => b.C_center).filter((c) => c > 0);
  const cMin = Math.min(...Cs);
  const cMax = Math.max(...Cs);

  function panel(
    ax: string,
    values: number[],
    fit: typeof fitN,
    label: string,
    color: string,
    isInt = false,
  ) {
    const sx = logScale([cMin, cMax], [PAD.l, W - PAD.r]);
    const vMin = Math.max(0.5, Math.min(...values) * 0.7);
    const vMax = Math.max(...values) * 1.5;
    const sy = logScale([vMax, vMin], [PAD.t, H - PAD.b]);
    const xTicks = [cMin, cMax, Math.sqrt(cMin * cMax)];
    const yTicks = isInt
      ? [...new Set(values.map((v) => Math.round(v)))].sort((a, b) => a - b)
      : [vMin, Math.sqrt(vMin * vMax), vMax];
    const pts: Array<[number, number]> = Cs.map((c, i) => [sx(c), sy(values[i])]);
    let fitLine = "";
    if (fit) {
      const samp: Array<[number, number]> = [];
      for (let i = 0; i < 30; i++) {
        const lx = Math.log(cMin) + (i / 29) * (Math.log(cMax) - Math.log(cMin));
        const x = Math.exp(lx);
        // log y = log_c + (-alpha)*log x;  but our fit was fit_loglog of x→y
        // where slope = -alpha, so y = exp(inter) * x^(-alpha)
        const y = Math.exp(fit.log_c) * Math.pow(x, -fit.alpha);
        if (y > 0) samp.push([sx(x), sy(y)]);
      }
      fitLine = linePath(samp);
    }
    return (
      <div className="bg-zinc-50 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs uppercase tracking-wider text-zinc-500">{ax}</div>
          <div className="text-[10px] text-zinc-500 tabular-nums">
            α = {fit ? (-fit.alpha).toFixed(3) : "—"} · R² = {fit ? fit.r2.toFixed(2) : "—"}
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {yTicks.map((y, i) => (
            <g key={`y${i}`}>
              <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} stroke="#f4f4f5" />
              <text x={PAD.l - 6} y={sy(y) + 3} fontSize={10} textAnchor="end" fill="#71717a" className="tabular-nums">
                {isInt ? y.toFixed(0) : y < 1 ? y.toFixed(2) : y.toFixed(1)}
              </text>
            </g>
          ))}
          {xTicks.map((x, i) => (
            <g key={`x${i}`}>
              <line x1={sx(x)} x2={sx(x)} y1={PAD.t} y2={H - PAD.b} stroke="#fafafa" />
              <text x={sx(x)} y={H - PAD.b + 14} fontSize={9} textAnchor="middle" fill="#71717a" className="tabular-nums">
                10^{Math.log10(x).toFixed(1)}
              </text>
            </g>
          ))}
          <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#d4d4d8" />
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" />
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#52525b">
            {copy.fig1AxC}
          </text>
          <text transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} fontSize={11} textAnchor="middle" fill="#52525b">
            {label}
          </text>
          {fitLine && <path d={fitLine} stroke={color} strokeWidth={1.6} fill="none" strokeDasharray="6 3" opacity={0.7} />}
          {pts.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={3.6} fill={color} stroke="white" strokeWidth={1.2} />
          ))}
        </svg>
      </div>
    );
  }

  const Ns = bins.map((b) => b.N_opt_B ?? 0);
  const Ks = bins.map((b) => b.K_opt ?? 0);

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">{copy.fig1Title}</h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.fig1Caption}</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {panel("N_opt(C)", Ns, fitN, copy.fig1AxN, "#4f46e5", false)}
        {panel("K_opt(C)", Ks, fitK, copy.fig1AxK, "#e11d48", true)}
      </div>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.fig1Reading}</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Figure 2 — training-curve envelope (Chinchilla Fig 2 left).
function Figure2({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const curves = sl.training_curves?.curves ?? [];
  // Limit total runs we render so the SVG stays light. Keep a balanced
  // mix across N and F so the colour gradient is preserved.
  const sample: TrainingCurve[] = useMemo(() => {
    const byClass: Record<string, TrainingCurve[]> = {};
    for (const c of curves) {
      const key = `${c.Nact_B}|${c.F}`;
      (byClass[key] ??= []).push(c);
    }
    const per = Math.max(8, Math.floor(160 / Math.max(1, Object.keys(byClass).length)));
    const out: TrainingCurve[] = [];
    for (const k of Object.keys(byClass)) {
      const xs = byClass[k];
      const step = Math.max(1, Math.floor(xs.length / per));
      for (let i = 0; i < xs.length; i += step) out.push(xs[i]);
    }
    return out;
  }, [curves]);

  if (!sample.length) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">{copy.fig2Title}</h2>
        <p className="text-sm text-zinc-500">no curves</p>
      </section>
    );
  }

  const W = 720, H = 340;
  const PAD = { l: 64, r: 16, t: 22, b: 38 };

  let cMin = Infinity;
  let cMax = -Infinity;
  let rMin = 1e-6;
  let rMax = 1.2;
  for (const c of sample) {
    for (const v of c.C) { if (v < cMin) cMin = v; if (v > cMax) cMax = v; }
    for (const r of c.rel_loss) { if (r < rMin && r > 0) rMin = r; if (r > rMax) rMax = r; }
  }
  if (!Number.isFinite(cMin) || !Number.isFinite(cMax)) {
    cMin = 1; cMax = 1e9;
  }
  rMin = Math.max(1e-6, rMin);
  const sx = logScale([cMin, cMax], [PAD.l, W - PAD.r]);
  const sy = logScale([rMax, rMin], [PAD.t, H - PAD.b]);

  const yTicks = [1, 0.1, 0.01, 0.001, 1e-4, 1e-5, 1e-6].filter((y) => y >= rMin * 0.5 && y <= rMax);
  const decade = (x: number) => Math.pow(10, Math.round(Math.log10(x)));
  const xTicks: number[] = [];
  for (let p = Math.floor(Math.log10(cMin)); p <= Math.ceil(Math.log10(cMax)); p++) xTicks.push(Math.pow(10, p));

  // Compute envelope: across all curves, for each x-bin take min y.
  const ENV_BINS = 50;
  const envelope: Array<[number, number]> = [];
  if (cMax > cMin) {
    const lc0 = Math.log(cMin);
    const lc1 = Math.log(cMax);
    const buckets: Array<number | null> = Array(ENV_BINS).fill(null);
    for (const c of sample) {
      for (let i = 0; i < c.C.length; i++) {
        const lc = Math.log(c.C[i]);
        const j = Math.max(0, Math.min(ENV_BINS - 1, Math.floor(((lc - lc0) / (lc1 - lc0)) * ENV_BINS)));
        const v = c.rel_loss[i];
        if (v > 0 && (buckets[j] === null || v < (buckets[j] as number))) buckets[j] = v;
      }
    }
    for (let j = 0; j < ENV_BINS; j++) {
      if (buckets[j] === null) continue;
      const lc = lc0 + ((j + 0.5) / ENV_BINS) * (lc1 - lc0);
      envelope.push([Math.exp(lc), buckets[j] as number]);
    }
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">{copy.fig2Title}</h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.fig2Caption}</p>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-zinc-50 rounded-lg">
        {yTicks.map((y) => (
          <g key={`y${y}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} stroke="#f4f4f5" />
            <text x={PAD.l - 6} y={sy(y) + 3} fontSize={9} textAnchor="end" fill="#71717a" className="tabular-nums">
              {y < 0.001 ? y.toExponential(0) : y.toString()}
            </text>
          </g>
        ))}
        {xTicks.map((x) => (
          <g key={`x${x}`}>
            <line x1={sx(x)} x2={sx(x)} y1={PAD.t} y2={H - PAD.b} stroke="#fafafa" />
            <text x={sx(x)} y={H - PAD.b + 14} fontSize={9} textAnchor="middle" fill="#71717a" className="tabular-nums">
              10^{Math.log10(x).toFixed(0)}
            </text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#d4d4d8" />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" />
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig2AxC}
        </text>
        <text transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig2AxLoss}
        </text>
        {/* per-run curves */}
        {sample.map((c, idx) => {
          const pts: Array<[number, number]> = [];
          for (let i = 0; i < c.C.length; i++) {
            const r = c.rel_loss[i];
            if (r > 0) pts.push([sx(c.C[i]), sy(r)]);
          }
          if (pts.length < 2) return null;
          return (
            <path
              key={`run-${idx}`}
              d={linePath(pts)}
              stroke={nColor(c.Nact_B)}
              strokeWidth={0.7}
              fill="none"
              opacity={0.35}
            />
          );
        })}
        {/* envelope */}
        {envelope.length > 1 && (
          <path
            d={linePath(envelope.map(([x, y]) => [sx(x), sy(y)]))}
            stroke="#0f172a"
            strokeWidth={2.5}
            fill="none"
          />
        )}
        {/* legend */}
        <g transform={`translate(${W - PAD.r - 110}, ${PAD.t + 4})`}>
          {[3, 4, 27].map((n, i) => (
            <g key={n} transform={`translate(0, ${i * 13})`}>
              <line x1={0} x2={18} y1={6} y2={6} stroke={N_COLOR[n]} strokeWidth={2} />
              <text x={22} y={9} fontSize={10} fill="#27272a">N={n} B</text>
            </g>
          ))}
          <g transform={`translate(0, ${3 * 13})`}>
            <line x1={0} x2={18} y1={6} y2={6} stroke="#0f172a" strokeWidth={2.5} />
            <text x={22} y={9} fontSize={10} fill="#27272a">envelope</text>
          </g>
        </g>
      </svg>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.fig2Reading}</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Figure 3 — IsoCompute U-shapes (Chinchilla Fig 3 left). One line per
// compute bin; markers at N values; line passes through the average
// rel_loss at each N.
function Figure3({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const bins = sl.iso_compute?.bins ?? [];
  if (bins.length === 0) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">{copy.fig3Title}</h2>
        <p className="text-sm text-zinc-500">no bins</p>
      </section>
    );
  }
  const W = 640, H = 320;
  const PAD = { l: 60, r: 30, t: 20, b: 38 };
  const Ns: number[] = [];
  const Rs: number[] = [];
  for (const b of bins) for (const p of b.pts) { Ns.push(p.N_B); Rs.push(p.rel_loss_geo); }
  const nMin = Math.min(...Ns);
  const nMax = Math.max(...Ns);
  const rMin = Math.max(1e-6, Math.min(...Rs.filter((r) => r > 0)));
  const rMax = Math.max(...Rs) * 1.4;
  const sx = logScale([nMin * 0.6, nMax * 1.3], [PAD.l, W - PAD.r]);
  const sy = logScale([rMax, rMin], [PAD.t, H - PAD.b]);

  // Colour each bin (compute level) on yellow→dark ramp.
  function binColor(i: number) {
    const t = bins.length > 1 ? i / (bins.length - 1) : 0.5;
    // yellow (#fde047) → dark (#1e3a8a)
    const lerp = (a: number, b: number) => Math.round(a + t * (b - a));
    return `rgb(${lerp(253, 30)}, ${lerp(224, 58)}, ${lerp(71, 138)})`;
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">{copy.fig3Title}</h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.fig3Caption}</p>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-zinc-50 rounded-lg">
        {[1, 0.1, 0.01, 0.001, 1e-4, 1e-5, 1e-6].filter((y) => y >= rMin * 0.5 && y <= rMax).map((y) => (
          <g key={`y${y}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} stroke="#f4f4f5" />
            <text x={PAD.l - 6} y={sy(y) + 3} fontSize={10} textAnchor="end" fill="#71717a" className="tabular-nums">
              {y < 0.001 ? y.toExponential(0) : y.toString()}
            </text>
          </g>
        ))}
        {[3, 4, 27].map((n) => (
          <g key={`x${n}`}>
            <line x1={sx(n)} x2={sx(n)} y1={PAD.t} y2={H - PAD.b} stroke="#fafafa" />
            <text x={sx(n)} y={H - PAD.b + 14} fontSize={10} textAnchor="middle" fill="#71717a" className="tabular-nums">
              {n}
            </text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#d4d4d8" />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" />
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig3AxN}
        </text>
        <text transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig3AxLoss}
        </text>
        {bins.map((b, i) => {
          const pts: Array<[number, number]> = b.pts
            .filter((p) => p.rel_loss_geo > 0)
            .sort((a, c) => a.N_B - c.N_B)
            .map((p) => [sx(p.N_B), sy(p.rel_loss_geo)] as [number, number]);
          if (pts.length === 0) return null;
          const col = binColor(i);
          // Mark N_opt
          const optPt = b.pts.reduce(
            (best, p) => (p.rel_loss_geo > 0 && (best === null || p.rel_loss_geo < best.rel_loss_geo) ? p : best),
            null as null | { N_B: number; rel_loss_geo: number },
          );
          return (
            <g key={i}>
              <path d={linePath(pts)} stroke={col} strokeWidth={2} fill="none" opacity={0.95} />
              {pts.map(([x, y], j) => (
                <circle key={j} cx={x} cy={y} r={3} fill={col} stroke="white" strokeWidth={1} />
              ))}
              {optPt && (
                <circle
                  cx={sx(optPt.N_B)}
                  cy={sy(optPt.rel_loss_geo)}
                  r={6}
                  fill="none"
                  stroke={col}
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}
        {/* Legend on the right */}
        <g transform={`translate(${W - PAD.r + 4}, ${PAD.t})`}>
          {bins.map((b, i) => (
            <g key={i} transform={`translate(0, ${i * 12})`}>
              <line x1={-26} x2={-10} y1={6} y2={6} stroke={binColor(i)} strokeWidth={2} />
              <text x={-8} y={9} fontSize={9} fill="#27272a" className="tabular-nums">
                10^{b.log10_C.toFixed(1)}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.fig3Reading}</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Figure 4 — Parametric L(N, K) contour (Chinchilla Fig 4 left).
// Two side-by-side panels, one per F level. We draw the heatmap as a
// dense grid of rects + iso-loss contour lines at fixed levels.
function Figure4({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const contour = sl.parametric_contour ?? {};
  const Fs = Object.keys(contour).filter((f) => contour[f].grid_log_rel_loss?.length);
  if (Fs.length === 0) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">{copy.fig4Title}</h2>
        <p className="text-sm text-zinc-500">no parametric fits</p>
      </section>
    );
  }
  const W = 360, H = 280;
  const PAD = { l: 50, r: 18, t: 26, b: 36 };

  function panel(F: string) {
    const cell = contour[F];
    const Ns = cell.Ns_B;
    const Ks = cell.Ks;
    const grid = cell.grid_log_rel_loss;
    const flat = grid.flat();
    const vMin = Math.max(1e-4, Math.min(...flat));
    const vMax = Math.min(2, Math.max(...flat));
    const sx = logScale([Ns[0], Ns[Ns.length - 1]], [PAD.l, W - PAD.r]);
    const sy = logScale([Ks[Ks.length - 1], Ks[0]], [PAD.t, H - PAD.b]);
    const cellW = (W - PAD.r - PAD.l) / (Ns.length - 1);
    const cellH = (H - PAD.b - PAD.t) / (Ks.length - 1);

    function colorFor(v: number) {
      // viridis-ish: dark blue → cyan → yellow on log scale
      const t = (Math.log(v) - Math.log(vMin)) / (Math.log(vMax) - Math.log(vMin));
      const tt = Math.max(0, Math.min(1, t));
      const r = Math.round(68 + tt * (253 - 68));
      const g = Math.round(1 + tt * (231 - 1));
      const b = Math.round(84 + tt * (37 - 84));
      return `rgb(${r}, ${g}, ${b})`;
    }
    const levels = [0.5, 0.2, 0.1, 0.05, 0.02, 0.01].filter((l) => l > vMin && l < vMax);

    // Build contour lines by walking the grid and emitting line segments
    // wherever the level crosses an edge. Marching squares (lite).
    function contourPaths(level: number): string[] {
      const out: string[] = [];
      for (let yi = 0; yi < Ks.length - 1; yi++) {
        for (let xi = 0; xi < Ns.length - 1; xi++) {
          const a = grid[yi][xi];
          const b = grid[yi][xi + 1];
          const c = grid[yi + 1][xi + 1];
          const d = grid[yi + 1][xi];
          const idx =
            (a > level ? 1 : 0) +
            (b > level ? 2 : 0) +
            (c > level ? 4 : 0) +
            (d > level ? 8 : 0);
          const xL = sx(Ns[xi]);
          const xR = sx(Ns[xi + 1]);
          const yT = sy(Ks[yi]);
          const yB = sy(Ks[yi + 1]);
          const interp = (v1: number, v2: number, p1: number, p2: number) =>
            p1 + ((level - v1) / (v2 - v1)) * (p2 - p1);
          let p1: [number, number] | null = null;
          let p2: [number, number] | null = null;
          // table for marching squares (only 4 unique cases since symmetric)
          if (idx === 1 || idx === 14) {
            p1 = [interp(a, d, yT, yB), 0];   // unused dummy
          }
          // Simpler: emit a line between any two edges that cross the level.
          const edges: Array<[number, number]> = [];
          if ((a > level) !== (b > level)) edges.push([interp(a, b, xL, xR), yT]);
          if ((b > level) !== (c > level)) edges.push([xR, interp(b, c, yT, yB)]);
          if ((c > level) !== (d > level)) edges.push([interp(d, c, xL, xR), yB]);
          if ((d > level) !== (a > level)) edges.push([xL, interp(a, d, yT, yB)]);
          if (edges.length >= 2) {
            p1 = edges[0]; p2 = edges[1];
            out.push(`M${p1[0].toFixed(2)},${p1[1].toFixed(2)}L${p2[0].toFixed(2)},${p2[1].toFixed(2)}`);
            if (edges.length === 4) {
              out.push(`M${edges[2][0].toFixed(2)},${edges[2][1].toFixed(2)}L${edges[3][0].toFixed(2)},${edges[3][1].toFixed(2)}`);
            }
          }
        }
      }
      return out;
    }

    return (
      <div key={F} className="bg-zinc-50 rounded-lg p-3">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-xs uppercase tracking-wider text-zinc-500">{copy.fLabel}={F}</div>
          <div className="text-[10px] text-zinc-500 tabular-nums">
            α_N = {cell.alpha_N} · α_K = {cell.alpha_K} · {cell.n_fits_used} tasks
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* heatmap */}
          {grid.map((row, yi) =>
            row.map((v, xi) => (
              <rect
                key={`c${yi}-${xi}`}
                x={sx(Ns[xi])}
                y={sy(Ks[yi])}
                width={cellW + 0.5}
                height={cellH + 0.5}
                fill={colorFor(v)}
                opacity={0.85}
              />
            )),
          )}
          {/* contour lines */}
          {levels.map((lv, i) => (
            <g key={lv}>
              {contourPaths(lv).map((d, j) => (
                <path key={j} d={d} stroke="white" strokeWidth={0.7} fill="none" opacity={0.7} />
              ))}
              <text
                x={W - PAD.r - 4 - i * 38}
                y={PAD.t - 6}
                fontSize={8.5}
                fill="#27272a"
                textAnchor="end"
                className="tabular-nums"
              >
                {lv}
              </text>
            </g>
          ))}
          {/* axes */}
          <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#27272a" />
          <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#27272a" />
          {/* x ticks - powers of 2 over N */}
          {[2, 4, 8, 16, 32, 64].filter((x) => x >= Ns[0] && x <= Ns[Ns.length - 1]).map((x) => (
            <g key={x}>
              <line x1={sx(x)} x2={sx(x)} y1={H - PAD.b} y2={H - PAD.b + 3} stroke="#27272a" />
              <text x={sx(x)} y={H - PAD.b + 13} fontSize={9} textAnchor="middle" fill="#27272a" className="tabular-nums">
                {x}
              </text>
            </g>
          ))}
          {[1, 4, 16, 64, 256, 1024].filter((x) => x >= Ks[0] && x <= Ks[Ks.length - 1]).map((x) => (
            <g key={x}>
              <line x1={PAD.l - 3} x2={PAD.l} y1={sy(x)} y2={sy(x)} stroke="#27272a" />
              <text x={PAD.l - 6} y={sy(x) + 3} fontSize={9} textAnchor="end" fill="#27272a" className="tabular-nums">
                {x}
              </text>
            </g>
          ))}
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#52525b">
            {copy.fig4AxN}
          </text>
          <text transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} fontSize={11} textAnchor="middle" fill="#52525b">
            {copy.fig4AxK}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">{copy.fig4Title}</h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.fig4Caption}</p>
      </header>
      <div className={`grid grid-cols-1 ${Fs.length > 1 ? "lg:grid-cols-2" : ""} gap-4`}>
        {Fs.map((F) => panel(F))}
      </div>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.fig4Reading}</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Figure 5 — predicted vs observed scatter.
function Figure5({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const pts = sl.predicted_vs_actual?.points ?? [];
  if (pts.length === 0) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">{copy.fig5Title}</h2>
        <p className="text-sm text-zinc-500">no points</p>
      </section>
    );
  }
  const obs = pts.map((p) => p.observed);
  const pred = pts.map((p) => p.predicted);
  const mo = obs.reduce((s, v) => s + v, 0) / obs.length;
  const sst = obs.reduce((s, v) => s + (v - mo) ** 2, 0) || 1e-12;
  const sse = obs.reduce((s, v, i) => s + (v - pred[i]) ** 2, 0);
  const r2 = 1 - sse / sst;
  const obsLog = obs.filter((v) => v > 0).map((v) => Math.log(v));
  const predLog = obs.map((v, i) => (v > 0 ? Math.log(Math.max(1e-9, pred[i])) : null)).filter((x): x is number => x !== null);
  const mlo = obsLog.reduce((s, v) => s + v, 0) / Math.max(1, obsLog.length);
  const sstL = obsLog.reduce((s, v) => s + (v - mlo) ** 2, 0) || 1e-12;
  const sseL = obsLog.reduce((s, v, i) => s + (v - predLog[i]) ** 2, 0);
  const r2log = 1 - sseL / sstL;

  const W = 460, H = 340;
  const PAD = { l: 60, r: 16, t: 28, b: 38 };
  const lo = Math.max(1e-6, Math.min(...obs.filter((v) => v > 0), ...pred.filter((v) => v > 0)));
  const hi = Math.min(2, Math.max(...obs, ...pred) * 1.1);
  const sx = logScale([lo, hi], [PAD.l, W - PAD.r]);
  const sy = logScale([hi, lo], [PAD.t, H - PAD.b]);

  const colorFor = (m: string) => {
    if (m.includes("4B")) return "#fb923c";
    if (m.includes("27B")) return "#1e3a8a";
    if (m.includes("35B")) return "#fde047";
    return "#a1a1aa";
  };

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-base font-medium text-zinc-900">{copy.fig5Title}</h2>
          <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.fig5Caption}</p>
        </div>
        <div className="text-xs tabular-nums text-zinc-600">
          linear R² = {r2.toFixed(2)} · log-R² = {r2log.toFixed(2)} · n = {pts.length}
        </div>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-zinc-50 rounded-lg">
        {/* diag */}
        <line x1={sx(lo)} y1={sy(lo)} x2={sx(hi)} y2={sy(hi)} stroke="#0f172a" strokeWidth={1.2} strokeDasharray="5 3" />
        {/* ticks */}
        {[1, 0.1, 0.01, 0.001, 1e-4].filter((y) => y >= lo * 0.5 && y <= hi).map((y) => (
          <g key={y}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(y)} y2={sy(y)} stroke="#f4f4f5" />
            <text x={PAD.l - 6} y={sy(y) + 3} fontSize={9} textAnchor="end" fill="#71717a" className="tabular-nums">
              {y < 0.01 ? y.toExponential(0) : y.toString()}
            </text>
            <line x1={sx(y)} x2={sx(y)} y1={PAD.t} y2={H - PAD.b} stroke="#fafafa" />
            <text x={sx(y)} y={H - PAD.b + 14} fontSize={9} textAnchor="middle" fill="#71717a" className="tabular-nums">
              {y < 0.01 ? y.toExponential(0) : y.toString()}
            </text>
          </g>
        ))}
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="#d4d4d8" />
        <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H - PAD.b} stroke="#d4d4d8" />
        <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig5AxObs}
        </text>
        <text transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`} fontSize={11} textAnchor="middle" fill="#52525b">
          {copy.fig5AxPred}
        </text>
        {pts.map((p, i) => {
          if (p.observed <= 0 || p.predicted <= 0) return null;
          return (
            <circle
              key={i}
              cx={sx(p.observed)}
              cy={sy(Math.max(lo, p.predicted))}
              r={2.5}
              fill={colorFor(p.model)}
              opacity={0.55}
              stroke="white"
              strokeWidth={0.4}
            />
          );
        })}
      </svg>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.fig5Reading}</p>
    </section>
  );
}

// ---------------------------------------------------------------------
// Appendix A — α distribution histogram per class.
function AppendixA({ sl, copy }: { sl: ScalingLaws; copy: ReturnType<() => (typeof findingsCopy)["en"]> }) {
  const u = sl.universality ?? {};
  const keys = Object.keys(u).filter((k) => u[k].n_tasks >= 3);
  if (!keys.length) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-500">{copy.appATitle}</h3>
        <p className="text-sm text-zinc-500">no per-task fits</p>
      </section>
    );
  }
  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-3">
      <header>
        <h3 className="text-sm uppercase tracking-wider text-zinc-500">{copy.appATitle}</h3>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{copy.appACaption}</p>
      </header>
      <table className="w-full text-xs tabular-nums">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-200">
            <th className="text-left font-normal py-1.5">class</th>
            <th className="text-right font-normal py-1.5">n tasks</th>
            <th className="text-right font-normal py-1.5">α median</th>
            <th className="text-right font-normal py-1.5">α mean</th>
            <th className="text-right font-normal py-1.5">α std</th>
            <th className="text-right font-normal py-1.5">α min</th>
            <th className="text-right font-normal py-1.5">α max</th>
            <th className="text-left font-normal py-1.5 pl-3">distribution</th>
          </tr>
        </thead>
        <tbody>
          {keys.sort().map((k) => {
            const v = u[k];
            // mini sparkline of α values
            const W = 160, H = 28;
            const a0 = 0;
            const a1 = Math.max(...v.alphas_sorted) || 1;
            const sx = linearScale([a0, a1], [4, W - 4]);
            return (
              <tr key={k} className="border-b border-zinc-100">
                <td className="py-1.5 text-zinc-700">{k}</td>
                <td className="py-1.5 text-right">{v.n_tasks}</td>
                <td className="py-1.5 text-right">{v.alpha_median}</td>
                <td className="py-1.5 text-right">{v.alpha_mean}</td>
                <td className="py-1.5 text-right text-zinc-500">{v.alpha_std}</td>
                <td className="py-1.5 text-right text-zinc-500">{v.alpha_min}</td>
                <td className="py-1.5 text-right text-zinc-500">{v.alpha_max}</td>
                <td className="py-1.5 pl-3">
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-32 h-7">
                    <line x1={4} x2={W - 4} y1={H / 2} y2={H / 2} stroke="#e4e4e7" />
                    {v.alphas_sorted.map((a, i) => (
                      <circle key={i} cx={sx(a)} cy={H / 2} r={2.4} fill="#4f46e5" opacity={0.7} />
                    ))}
                    <line x1={sx(v.alpha_median)} x2={sx(v.alpha_median)} y1={4} y2={H - 4} stroke="#e11d48" strokeWidth={1.4} />
                  </svg>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-zinc-500">
        red line = median; blue dots = per-task α
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------
export function FindingsView({
  scalingLaws,
  generatedAtIso,
  gitSha,
}: {
  scalingLaws: ScalingLaws | null;
  generatedAtIso: string;
  gitSha: string;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const copy = findingsCopy[lang];

  if (!scalingLaws) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6">
        <h1 className="text-xl font-medium">{copy.pageTitle}</h1>
        <p className="text-sm text-zinc-500 mt-2">
          scaling_laws.json not built yet — run <code>scripts/scaling_laws.py</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <Link href="./" className="text-xs text-zinc-500 hover:text-zinc-800">
            {copy.backToDashboard}
          </Link>
          <span className="text-base font-medium tracking-tight text-zinc-900">SESL</span>
          <span className="text-xs text-zinc-500">{copy.pageTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] tabular-nums text-zinc-400 font-mono">
            <span>{copy.asOf}</span>
            <span>{generatedAtIso}</span>
            <span>·</span>
            <span>git {gitSha}</span>
            <span>·</span>
            <span>{scalingLaws.n_runs_indexed} runs</span>
          </div>
          <div className="inline-flex border border-zinc-200 rounded-md overflow-hidden text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 ${lang === "en" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              {copy.langEN}
            </button>
            <button
              onClick={() => setLang("zh")}
              className={`px-2 py-1 ${lang === "zh" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
            >
              {copy.langZH}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-3">
        <h1 className="text-xl font-medium text-zinc-900 tracking-tight">{copy.pageTitle}</h1>
        <p className="text-sm text-zinc-600 leading-relaxed">{copy.pageSubtitle}</p>
        <h3 className="text-sm uppercase tracking-wider text-zinc-500 pt-1">{copy.setupTitle}</h3>
        <p className="text-sm text-zinc-600 leading-relaxed">{copy.setupBody}</p>
        <h3 className="text-sm uppercase tracking-wider text-zinc-500 pt-1">{copy.axisMapTitle}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-200">
                <th className="text-left font-normal py-1.5">Chinchilla 2203.15556</th>
                <th className="text-left font-normal py-1.5">SESL</th>
                <th className="text-left font-normal py-1.5">note</th>
              </tr>
            </thead>
            <tbody>
              {copy.axisMapRows.map((r, i) => (
                <tr key={i} className="border-b border-zinc-100">
                  <td className="py-1.5 text-zinc-700">{r.chinchilla}</td>
                  <td className="py-1.5 text-zinc-700 font-mono">{r.sesl}</td>
                  <td className="py-1.5 text-zinc-500">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Figure1 sl={scalingLaws} copy={copy} />
      <Figure2 sl={scalingLaws} copy={copy} />
      <Figure3 sl={scalingLaws} copy={copy} />
      <Figure4 sl={scalingLaws} copy={copy} />
      <Figure5 sl={scalingLaws} copy={copy} />
      <AppendixA sl={scalingLaws} copy={copy} />

      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">{copy.caveatsTitle}</h3>
        <ul className="space-y-2 text-sm text-zinc-700 leading-relaxed">
          {copy.caveats.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-zinc-400 select-none">•</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="text-center text-[10px] text-zinc-400 font-mono pt-2 pb-8">
        {fmt(scalingLaws.n_runs_indexed, 0)} indexed runs · {scalingLaws.K_per_task?.length ?? 0} per-task K fits ·{" "}
        {scalingLaws.joint_NK?.fits?.length ?? 0} joint (N,K) fits · scaling_laws.py · git {gitSha}
      </footer>
    </main>
  );
}
