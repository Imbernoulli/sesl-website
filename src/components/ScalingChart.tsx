import type { XTCurve } from "@/lib/types";

const W = 320;
const H = 180;
const PAD = { l: 36, r: 10, t: 14, b: 26 };

function fmt(n: number | null | undefined, d = 3) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(d);
}

function chart(c: XTCurve) {
  if (!c.Ks.length) return null;
  const xs = c.Ks.map((k) => Math.log2(k));
  const ys = c.mean_norm;
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = 0;
  const ymax = 1;
  const sx = (x: number) =>
    PAD.l + ((x - xmin) / (xmax - xmin || 1)) * (W - PAD.l - PAD.r);
  const sy = (y: number) =>
    H - PAD.b - ((y - ymin) / (ymax - ymin)) * (H - PAD.t - PAD.b);

  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"}${sx(x)},${sy(ys[i])}`).join(" ");

  // Optional fitted curve overlay using B(K) = B_inf - A * K^-alpha, drawn at
  // 40 sample points across K log-space. We render in normalized space which
  // is exactly the fit space here (mean_norm in [0,1]).
  let fitPath: string | null = null;
  if (c.fit && c.fit.alpha && c.fit.B_inf !== null && c.fit.A !== null) {
    const a = c.fit.alpha as number;
    const Binf = c.fit.B_inf as number;
    const A = c.fit.A as number;
    const pts: string[] = [];
    for (let i = 0; i < 40; i++) {
      const lx = xmin + (i / 39) * (xmax - xmin);
      const k = Math.pow(2, lx);
      const y = Binf - A * Math.pow(k, -a);
      pts.push(`${i === 0 ? "M" : "L"}${sx(lx)},${sy(Math.max(0, Math.min(1, y)))}`);
    }
    fitPath = pts.join(" ");
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* axes */}
      <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} stroke="#d4d4d4" />
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} stroke="#d4d4d4" />
      {/* y ticks */}
      {[0, 0.25, 0.5, 0.75, 1].map((y) => (
        <g key={y}>
          <line
            x1={PAD.l}
            y1={sy(y)}
            x2={W - PAD.r}
            y2={sy(y)}
            stroke="#f0f0ef"
          />
          <text
            x={PAD.l - 4}
            y={sy(y) + 3}
            fontSize={9}
            textAnchor="end"
            fill="#888"
          >
            {y.toFixed(2)}
          </text>
        </g>
      ))}
      {/* x ticks: at each K */}
      {c.Ks.map((k, i) => (
        <g key={k}>
          <line
            x1={sx(xs[i])}
            y1={H - PAD.b}
            x2={sx(xs[i])}
            y2={H - PAD.b + 3}
            stroke="#888"
          />
          <text
            x={sx(xs[i])}
            y={H - PAD.b + 13}
            fontSize={9}
            textAnchor="middle"
            fill="#666"
          >
            {k}
          </text>
        </g>
      ))}
      {/* SEM error bars */}
      {c.Ks.map((_, i) => {
        const e = c.sem[i] ?? 0;
        if (!e) return null;
        return (
          <line
            key={i}
            x1={sx(xs[i])}
            y1={sy(ys[i] - e)}
            x2={sx(xs[i])}
            y2={sy(ys[i] + e)}
            stroke="#11806a"
            strokeWidth={1.2}
          />
        );
      })}
      {fitPath ? (
        <path d={fitPath} stroke="#c2a36a" strokeDasharray="3 3" fill="none" />
      ) : null}
      <path d={pathD} stroke="#11806a" fill="none" strokeWidth={1.5} />
      {/* points */}
      {c.Ks.map((_, i) => (
        <circle key={i} cx={sx(xs[i])} cy={sy(ys[i])} r={2.5} fill="#11806a" />
      ))}
      <text x={W - PAD.r} y={H - 4} fontSize={9} textAnchor="end" fill="#888">
        K (log2)
      </text>
      <text x={PAD.l + 4} y={PAD.t + 8} fontSize={9} fill="#888">
        mean normalized score
      </text>
    </svg>
  );
}

export function ScalingPanel({ curves, dropped }: {
  curves: XTCurve[];
  dropped: string[];
}) {
  if (!curves.length) {
    return (
      <section className="card p-5">
        <h2 className="text-base font-semibold mb-1">Cross-task scaling</h2>
        <p className="text-sm text-[color:var(--muted-foreground)]">
          No (model, F, H) bucket yet has the ≥3 distinct K points needed to fit
          a scaling law. Keep the grids running — this populates as size4b and
          scaling progress past K=16/32.
        </p>
      </section>
    );
  }
  // Group cards into rows of 2 for visual comparison.
  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-base font-semibold">Cross-task scaling (normalized)</h2>
        <span className="text-xs text-[color:var(--muted-foreground)]">
          variance-reduced via per-task normalize-then-average
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {curves.map((c, i) => (
          <div key={i} className="border border-[color:var(--border)] rounded-md p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="mono text-sm">
                {c.model} · {c.F} · {c.H} · {c.algo}
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)]">
                Ks {c.Ks.join(", ")}
              </div>
            </div>
            {chart(c)}
            <div className="mt-1 text-xs grid grid-cols-3 gap-2 mono">
              <span>α = {fmt(c.fit?.alpha)}</span>
              <span>r² = {fmt(c.fit?.r2)}</span>
              <span>B∞ = {fmt(c.fit?.B_inf, 4)}</span>
            </div>
          </div>
        ))}
      </div>
      {dropped.length > 0 ? (
        <p className="mt-4 text-xs text-[color:var(--muted-foreground)]">
          Saturated probes excluded from the aggregate (zero spread or
          contaminated): <span className="mono">{dropped.join(", ")}</span>
        </p>
      ) : null}
    </section>
  );
}
