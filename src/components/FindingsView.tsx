"use client";

import { useState } from "react";
import Link from "next/link";
import type { XTCurve, HeadlineEntry } from "@/lib/types";
import {
  bandPath,
  linePath,
  linearScale,
  logScale,
  pow2Ticks,
  sampleFit,
} from "@/lib/svg";
import { findingsCopy, type Lang } from "@/lib/findings";

// --- shared chart layout ------------------------------------------------
const W = 520;
const H = 280;
const PAD = { l: 50, r: 14, t: 18, b: 36 };

function findCurve(curves: XTCurve[], model: string, F: string) {
  return curves.find((c) => c.model === model && c.F === F && c.H === "H3");
}

function fmtPct(x: number, digits = 1) {
  return `${(x * 100).toFixed(digits)}%`;
}

// --- Section 1: power-law table + fit chart ----------------------------
function PowerLawSection({
  curves,
  copy,
}: {
  curves: XTCurve[];
  copy: ReturnType<() => (typeof findingsCopy)[Lang]>;
}) {
  // Sort: largest model first, then F2 before F0 (visual: best on top)
  const order = ["Qwen3.6-35B-A3B", "Qwen3.6-27B", "Qwen3.5-4B"];
  const rows = curves
    .filter((c) => c.fit && c.fit.alpha !== null && c.H === "H3")
    .slice()
    .sort((a, b) => {
      const ai = order.indexOf(a.model);
      const bi = order.indexOf(b.model);
      if (ai !== bi) return ai - bi;
      return a.F.localeCompare(b.F);
    });

  // Find color per model
  const color: Record<string, string> = {
    "Qwen3.6-35B-A3B": "#4f46e5",
    "Qwen3.6-27B": "#0ea5e9",
    "Qwen3.5-4B": "#e11d48",
  };

  // Plot all fits as continuous curves over a common K range, regret-space.
  const allKs = rows.flatMap((c) => c.Ks);
  const kMin = Math.max(1, Math.min(...allKs));
  const kMax = Math.max(...allKs);
  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = logScale([1, 1e-3], [H - PAD.b, PAD.t]); // regret log-y
  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [1, 0.1, 0.01, 0.001];

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">
          {copy.finding1Title}
        </h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
          {copy.finding1Lead}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2">
          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
            {copy.finding1TableTitle}
          </div>
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-200">
                <th className="text-left font-normal py-1.5">
                  {copy.tableCols.model}
                </th>
                <th className="text-left font-normal py-1.5">
                  {copy.tableCols.feedback}
                </th>
                <th className="text-right font-normal py-1.5">
                  {copy.tableCols.alpha}
                </th>
                <th className="text-right font-normal py-1.5">
                  {copy.tableCols.r2}
                </th>
                <th className="text-right font-normal py-1.5">
                  {copy.tableCols.kRange}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const alpha = r.fit!.alpha!;
                const r2 = r.fit!.r2!;
                const isStar = rows.length > 0 && alpha === Math.max(...rows.map((x) => x.fit!.alpha!));
                return (
                  <tr key={`${r.model}-${r.F}`} className="border-b border-zinc-100">
                    <td className="py-1.5 text-zinc-700">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                        style={{ background: color[r.model] ?? "#a1a1aa" }}
                      />
                      {r.model.replace("Qwen3.6-", "").replace("Qwen3.5-", "")}
                    </td>
                    <td className="py-1.5">{r.F}</td>
                    <td className="py-1.5 text-right">
                      <span className={isStar ? "text-indigo-700 font-medium" : ""}>
                        {alpha.toFixed(3)}
                        {isStar ? " ★" : ""}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-zinc-500">{r2.toFixed(2)}</td>
                    <td className="py-1.5 text-right text-zinc-500">
                      {r.Ks[0]}–{r.Ks[r.Ks.length - 1]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-3">
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
                  {y < 1 ? y.toExponential(0) : "1"}
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
            <line
              x1={PAD.l}
              x2={PAD.l}
              y1={PAD.t}
              y2={H - PAD.b}
              stroke="#d4d4d8"
            />
            <text
              x={(PAD.l + W - PAD.r) / 2}
              y={H - 6}
              fontSize={11}
              textAnchor="middle"
              fill="#52525b"
            >
              {copy.axisK}
            </text>
            <text
              transform={`translate(14, ${(PAD.t + H - PAD.b) / 2}) rotate(-90)`}
              fontSize={11}
              textAnchor="middle"
              fill="#52525b"
            >
              {copy.axisRelLoss}
            </text>

            {/* Plot data points (regret) + fitted line per row */}
            {rows.map((c) => {
              const col = color[c.model] ?? "#71717a";
              const dashed = c.F === "F0";
              // empirical points
              const empPts = c.Ks.map((k, i) => {
                const reg = Math.max(1 - c.mean_norm[i], 1e-3);
                return [sx(k), sy(reg)] as [number, number];
              });
              // fit line in regret space: regret(K) = (1 - B_inf) + A*K^-alpha; B_inf≈1 ⇒ regret ≈ A*K^-alpha
              const fitted: Array<[number, number]> = [];
              if (c.fit && c.fit.alpha !== null) {
                const samples = sampleFit(
                  {
                    alpha: c.fit.alpha,
                    B_inf: c.fit.B_inf ?? 1,
                    A: c.fit.A ?? 0,
                  },
                  c.Ks[0],
                  c.Ks[c.Ks.length - 1],
                  60,
                );
                for (const [k, b] of samples) {
                  const reg = Math.max(1 - b, 1e-3);
                  fitted.push([sx(k), sy(reg)]);
                }
              }
              return (
                <g key={`fit-${c.model}-${c.F}`}>
                  <path
                    d={linePath(fitted)}
                    stroke={col}
                    strokeWidth={1.5}
                    fill="none"
                    strokeDasharray={dashed ? "5 3" : undefined}
                    opacity={0.85}
                  />
                  {empPts.map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={2.6}
                      fill="white"
                      stroke={col}
                      strokeWidth={1.4}
                    />
                  ))}
                </g>
              );
            })}

            {/* legend */}
            <g transform={`translate(${PAD.l + 8}, ${PAD.t + 6})`}>
              {rows.map((r, i) => {
                const col = color[r.model] ?? "#71717a";
                return (
                  <g key={`leg-${i}`} transform={`translate(0, ${i * 12})`}>
                    <line
                      x1={0}
                      x2={18}
                      y1={6}
                      y2={6}
                      stroke={col}
                      strokeWidth={2}
                      strokeDasharray={r.F === "F0" ? "5 3" : undefined}
                    />
                    <text x={22} y={9} fontSize={9.5} fill="#27272a">
                      {r.model.replace("Qwen3.6-", "").replace("Qwen3.5-", "")} ·{" "}
                      {r.F} · α={r.fit!.alpha!.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      <p className="text-sm text-zinc-600 leading-relaxed">{copy.finding1Reading}</p>
    </section>
  );
}

// --- Section 2: F2 vs F0 delta-alpha bars -------------------------------
function FeedbackDeltaSection({
  curves,
  copy,
}: {
  curves: XTCurve[];
  copy: ReturnType<() => (typeof findingsCopy)[Lang]>;
}) {
  const models = ["Qwen3.5-4B", "Qwen3.6-27B", "Qwen3.6-35B-A3B"];
  const labels = ["4B", "27B", "35B-A3B"];
  const colorBar = ["#e11d48", "#0ea5e9", "#4f46e5"];
  const data = models.map((m) => {
    const f0 = findCurve(curves, m, "F0");
    const f2 = findCurve(curves, m, "F2");
    if (!f0 || !f2 || !f0.fit || !f2.fit) return { m, a0: null, a2: null, delta: null, rel: null };
    const a0 = f0.fit.alpha!;
    const a2 = f2.fit.alpha!;
    return { m, a0, a2, delta: a2 - a0, rel: (a2 - a0) / a0 };
  });
  const maxDelta = Math.max(0.001, ...data.map((d) => Math.abs(d.delta ?? 0)));

  // Chart dims
  const w = 520;
  const h = 240;
  const pad = { l: 70, r: 30, t: 18, b: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const barH = innerH / models.length - 12;
  const sxBar = (v: number) => pad.l + (Math.abs(v) / maxDelta) * innerW;

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">
          {copy.finding2Title}
        </h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
          {copy.finding2Lead}
        </p>
      </header>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        {data.map((d, i) => {
          const y = pad.t + i * (innerH / models.length) + 6;
          const lenX = sxBar(d.delta ?? 0);
          return (
            <g key={d.m}>
              <text
                x={pad.l - 8}
                y={y + barH / 2 + 4}
                fontSize={12}
                textAnchor="end"
                fill="#27272a"
                className="tabular-nums"
              >
                {labels[i]}
              </text>
              <rect
                x={pad.l}
                y={y}
                width={Math.max(0, lenX - pad.l)}
                height={barH}
                fill={colorBar[i]}
                opacity={0.85}
                rx={3}
              />
              <text
                x={lenX + 6}
                y={y + barH / 2 + 4}
                fontSize={11}
                fill="#27272a"
                className="tabular-nums"
              >
                Δα = {d.delta !== null ? (d.delta >= 0 ? "+" : "") + d.delta.toFixed(3) : "—"}
                {d.rel !== null ? `  (${d.rel >= 0 ? "+" : ""}${(d.rel * 100).toFixed(0)}%)` : ""}
              </text>
              <text
                x={pad.l}
                y={y + barH + 12}
                fontSize={10}
                fill="#71717a"
                className="tabular-nums"
              >
                α(F0)={d.a0?.toFixed(2) ?? "—"} → α(F2)={d.a2?.toFixed(2) ?? "—"}
              </text>
            </g>
          );
        })}
        <line
          x1={pad.l}
          x2={pad.l}
          y1={pad.t - 4}
          y2={h - pad.b}
          stroke="#d4d4d8"
        />
        <text
          x={pad.l + innerW / 2}
          y={h - 8}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
        >
          {copy.notes.f2HelpsWeak}
        </text>
      </svg>

      <p className="text-sm text-zinc-600 leading-relaxed">{copy.finding2Reading}</p>
    </section>
  );
}

// --- Section 3: 35B saturation curves -----------------------------------
function SaturationSection({
  curves,
  copy,
}: {
  curves: XTCurve[];
  copy: ReturnType<() => (typeof findingsCopy)[Lang]>;
}) {
  const c35F0 = findCurve(curves, "Qwen3.6-35B-A3B", "F0");
  const c35F2 = findCurve(curves, "Qwen3.6-35B-A3B", "F2");
  const c4F0 = findCurve(curves, "Qwen3.5-4B", "F0");
  const cs = [c35F0, c35F2, c4F0].filter(Boolean) as XTCurve[];
  if (cs.length === 0) {
    return (
      <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-base font-medium text-zinc-900">
          {copy.finding3Title}
        </h2>
        <p className="text-sm text-zinc-600">no data</p>
      </section>
    );
  }
  const allKs = cs.flatMap((c) => c.Ks);
  const kMin = Math.max(1, Math.min(...allKs));
  const kMax = Math.max(...allKs);
  const sx = logScale([kMin, kMax], [PAD.l, W - PAD.r]);
  const sy = linearScale([0.5, 1.02], [H - PAD.b, PAD.t]);
  const xTicks = pow2Ticks(kMin, kMax);
  const yTicks = [0.5, 0.7, 0.85, 0.95, 1.0];

  const styles: Record<string, { color: string; dash?: string; label: string }> = {
    "Qwen3.6-35B-A3B|F0": { color: "#4f46e5", dash: "5 3", label: "35B-A3B · F0" },
    "Qwen3.6-35B-A3B|F2": { color: "#4f46e5", label: "35B-A3B · F2" },
    "Qwen3.5-4B|F0": { color: "#e11d48", dash: "5 3", label: "4B · F0" },
  };

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">
          {copy.finding3Title}
        </h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
          {copy.finding3Lead}
        </p>
      </header>

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
        <line
          x1={PAD.l}
          x2={PAD.l}
          y1={PAD.t}
          y2={H - PAD.b}
          stroke="#d4d4d8"
        />
        {/* horizontal line at 1.0 = current best */}
        <line
          x1={PAD.l}
          x2={W - PAD.r}
          y1={sy(1)}
          y2={sy(1)}
          stroke="#a1a1aa"
          strokeDasharray="2 3"
          strokeWidth={1}
        />
        <text
          x={W - PAD.r - 4}
          y={sy(1) - 4}
          fontSize={9}
          fill="#a1a1aa"
          textAnchor="end"
        >
          1.00 = current harness best
        </text>
        {/* Plot each curve */}
        {cs.map((c) => {
          const k = `${c.model}|${c.F}`;
          const sty = styles[k];
          if (!sty) return null;
          const pts = c.Ks.map(
            (kk, i) => [sx(kk), sy(c.mean_norm[i])] as [number, number],
          );
          return (
            <g key={k}>
              <path
                d={linePath(pts)}
                stroke={sty.color}
                strokeWidth={2}
                strokeDasharray={sty.dash}
                fill="none"
              />
              {pts.map(([x, y], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={2.6}
                  fill="white"
                  stroke={sty.color}
                  strokeWidth={1.4}
                />
              ))}
            </g>
          );
        })}
        <g transform={`translate(${PAD.l + 8}, ${H - PAD.b - 60})`}>
          {cs.map((c, i) => {
            const k = `${c.model}|${c.F}`;
            const sty = styles[k];
            if (!sty) return null;
            return (
              <g key={k} transform={`translate(0, ${i * 12})`}>
                <line
                  x1={0}
                  x2={18}
                  y1={6}
                  y2={6}
                  stroke={sty.color}
                  strokeWidth={2}
                  strokeDasharray={sty.dash}
                />
                <text x={22} y={9} fontSize={10} fill="#27272a">
                  {sty.label}
                </text>
              </g>
            );
          })}
        </g>
        <text
          x={(PAD.l + W - PAD.r) / 2}
          y={H - 6}
          fontSize={11}
          textAnchor="middle"
          fill="#52525b"
        >
          {copy.axisK}
        </text>
      </svg>

      <p className="text-xs text-zinc-500 leading-snug">{copy.notes.saturation}</p>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.finding3Reading}</p>
    </section>
  );
}

// --- Section 4: per-task best score table --------------------------------
function SmallModelReversalSection({
  headline,
  copy,
}: {
  headline: HeadlineEntry[];
  copy: ReturnType<() => (typeof findingsCopy)[Lang]>;
}) {
  // group by task, pick best per task
  const byTask: Record<string, HeadlineEntry> = {};
  for (const r of headline) {
    const cur = byTask[r.task];
    if (!cur || r.best > cur.best) byTask[r.task] = r;
  }
  // ordering: roughly by problem size — tasks parsed by trailing number
  function size(t: string): number {
    const m = t.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  const taskFamilyOrder = [
    "rastrigin",
    "maxcut",
    "tsp",
    "circle",
    "binpack",
    "schedmkspan",
    "gatemin",
    "mls",
    "fe",
  ];
  function family(t: string): string {
    for (const fam of taskFamilyOrder) {
      if (t.startsWith(fam)) return fam;
    }
    return "z";
  }
  const tasks = Object.keys(byTask).sort((a, b) => {
    const fa = taskFamilyOrder.indexOf(family(a));
    const fb = taskFamilyOrder.indexOf(family(b));
    if (fa !== fb) return fa - fb;
    return size(a) - size(b);
  });

  const modelColor: Record<string, string> = {
    "Qwen3.6-35B-A3B": "#4f46e5",
    "Qwen3.6-27B": "#0ea5e9",
    "Qwen3.5-4B": "#e11d48",
  };

  return (
    <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4">
      <header>
        <h2 className="text-base font-medium text-zinc-900">
          {copy.finding4Title}
        </h2>
        <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
          {copy.finding4Lead}
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-200">
              <th className="text-left font-normal py-1.5">
                {copy.finding4TableHead.task}
              </th>
              <th className="text-left font-normal py-1.5">
                {copy.finding4TableHead.bestModel}
              </th>
              <th className="text-left font-normal py-1.5">
                {copy.finding4TableHead.setting}
              </th>
              <th className="text-right font-normal py-1.5">
                {copy.finding4TableHead.bestValue}
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const r = byTask[t];
              const col = modelColor[r.model] ?? "#71717a";
              return (
                <tr key={t} className="border-b border-zinc-100">
                  <td className="py-1.5 text-zinc-700">{t}</td>
                  <td className="py-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-2 align-middle"
                      style={{ background: col }}
                    />
                    {r.model.replace("Qwen3.6-", "").replace("Qwen3.5-", "")}
                  </td>
                  <td className="py-1.5 text-zinc-500">
                    K={r.K} · {r.F}
                  </td>
                  <td className="py-1.5 text-right">
                    {Math.abs(r.best) >= 100
                      ? r.best.toFixed(0)
                      : r.best.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-500 leading-snug">{copy.notes.smallModelWins}</p>
      <p className="text-sm text-zinc-600 leading-relaxed">{copy.finding4Reading}</p>
    </section>
  );
}

// --- main exported view --------------------------------------------------
export function FindingsView({
  curves,
  headline,
  generatedAtIso,
  gitSha,
}: {
  curves: XTCurve[];
  headline: HeadlineEntry[];
  generatedAtIso: string;
  gitSha: string;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const copy = findingsCopy[lang];

  return (
    <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3">
          <Link
            href="./"
            className="text-xs text-zinc-500 hover:text-zinc-800"
          >
            {copy.backToDashboard}
          </Link>
          <span className="text-base font-medium tracking-tight text-zinc-900">
            SESL
          </span>
          <span className="text-xs text-zinc-500">{copy.pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] tabular-nums text-zinc-400 font-mono">
            <span>{copy.asOf}</span>
            <span>{generatedAtIso}</span>
            <span>·</span>
            <span>git {gitSha}</span>
          </div>
          <div className="inline-flex border border-zinc-200 rounded-md overflow-hidden text-xs">
            <button
              onClick={() => setLang("en")}
              className={`px-2 py-1 ${lang === "en" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
              aria-pressed={lang === "en"}
            >
              {copy.langButtonEN}
            </button>
            <button
              onClick={() => setLang("zh")}
              className={`px-2 py-1 ${lang === "zh" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
              aria-pressed={lang === "zh"}
            >
              {copy.langButtonZH}
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-medium text-zinc-900 tracking-tight">
          {copy.pageTitle}
        </h1>
        <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
          {copy.pageSubtitle}
        </p>
        <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{copy.lead}</p>
      </div>

      <PowerLawSection curves={curves} copy={copy} />
      <FeedbackDeltaSection curves={curves} copy={copy} />
      <SaturationSection curves={curves} copy={copy} />
      <SmallModelReversalSection headline={headline} copy={copy} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
            {copy.limitsTitle}
          </h3>
          <ul className="space-y-2 text-sm text-zinc-700 leading-relaxed">
            {copy.limits.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-zinc-400 select-none">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm uppercase tracking-wider text-zinc-500 mb-3">
            {copy.whatsNextTitle}
          </h3>
          <ul className="space-y-2 text-sm text-zinc-700 leading-relaxed">
            {copy.whatsNext.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-zinc-400 select-none">•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="text-center text-[10px] text-zinc-400 font-mono pt-2 pb-8">
        numbers regenerated from runs/*.jsonl by scripts/build_site_data.py · git {gitSha}
      </footer>
    </main>
  );
}
