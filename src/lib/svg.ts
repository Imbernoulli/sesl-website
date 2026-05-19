// Tiny shared SVG helpers for the chart-first dashboard. Inline SVG only —
// no chart libs. Domains are caller-provided; range is screen space (pixels
// within the chart's plot area).

export type Scale = (v: number) => number;

export function linearScale(
  domain: [number, number],
  range: [number, number],
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const dd = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / dd) * (r1 - r0);
}

export function logScale(
  domain: [number, number],
  range: [number, number],
): Scale {
  // log base 2 — K-axis is dyadic in our experiments.
  const l0 = Math.log2(Math.max(domain[0], 1e-9));
  const l1 = Math.log2(Math.max(domain[1], 1e-9));
  const lin = linearScale([l0, l1], range);
  return (v: number) => lin(Math.log2(Math.max(v, 1e-9)));
}

export function niceLinearTicks(
  domain: [number, number],
  count = 5,
): number[] {
  const [a, b] = domain;
  const step = (b - a) / (count - 1);
  return Array.from({ length: count }, (_, i) => a + i * step);
}

// Powers of two between min and max (inclusive), useful for K-axis labels.
export function pow2Ticks(min: number, max: number): number[] {
  const lo = Math.ceil(Math.log2(Math.max(min, 1)));
  const hi = Math.floor(Math.log2(Math.max(max, 1)));
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(2 ** i);
  return out;
}

export function linePath(points: Array<[number, number]>): string {
  if (!points.length) return "";
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

// Build a filled band from an upper and lower polyline (same x sequence).
export function bandPath(
  upper: Array<[number, number]>,
  lower: Array<[number, number]>,
): string {
  if (!upper.length || upper.length !== lower.length) return "";
  const up = upper
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const down = lower
    .slice()
    .reverse()
    .map(([x, y]) => `L${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  return `${up} ${down} Z`;
}

// Evaluate the fitted power law B(K) = B_inf - A * K^-alpha at sampled K
// points across the curve's K-range, returning [K, y] pairs.
export function sampleFit(
  fit: { alpha: number; B_inf: number; A: number },
  kMin: number,
  kMax: number,
  n = 60,
): Array<[number, number]> {
  const l0 = Math.log2(Math.max(kMin, 1));
  const l1 = Math.log2(Math.max(kMax, 1));
  const out: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const lx = l0 + (i / (n - 1)) * (l1 - l0);
    const k = 2 ** lx;
    const y = fit.B_inf - fit.A * Math.pow(k, -fit.alpha);
    out.push([k, Math.max(0, Math.min(1.05, y))]);
  }
  return out;
}
