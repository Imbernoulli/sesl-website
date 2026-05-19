import type { CoverageCell } from "@/lib/types";

function cellClass(c: CoverageCell): string {
  const total = c.OK + c.ALLINV + c.PART;
  if (total === 0) return "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]";
  const okFrac = c.OK / total;
  if (okFrac >= 0.75) return "bg-emerald-50 text-emerald-800";
  if (okFrac >= 0.4) return "bg-amber-50 text-amber-800";
  return "bg-red-50 text-red-800";
}

export function CoverageMatrix({ coverage }: { coverage: CoverageCell[] }) {
  // pivot: rows = (model, F), cols = K
  const models = Array.from(new Set(coverage.map((c) => c.model))).sort();
  const Fs = Array.from(new Set(coverage.map((c) => c.F))).sort();
  const Ks = Array.from(new Set(coverage.map((c) => c.K))).sort((a, b) => a - b);
  const lookup = new Map<string, CoverageCell>();
  for (const c of coverage) lookup.set(`${c.model}|${c.F}|${c.K}`, c);

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-3">Coverage matrix (K × Feedback)</h2>
      <div className="overflow-x-auto">
        <table className="text-xs mono w-full">
          <thead>
            <tr className="text-left text-[color:var(--muted-foreground)]">
              <th className="py-1 pr-3">model</th>
              <th className="py-1 pr-3">F</th>
              {Ks.map((k) => (
                <th key={k} className="py-1 px-2 text-center">
                  K={k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.flatMap((m) =>
              Fs.map((f) => (
                <tr key={`${m}-${f}`} className="border-t border-[color:var(--border)]">
                  <td className="py-1 pr-3">{m}</td>
                  <td className="py-1 pr-3">{f}</td>
                  {Ks.map((k) => {
                    const cell = lookup.get(`${m}|${f}|${k}`);
                    if (!cell)
                      return (
                        <td
                          key={k}
                          className="px-2 py-1 text-center text-[color:var(--muted-foreground)]"
                        >
                          ·
                        </td>
                      );
                    return (
                      <td
                        key={k}
                        className={`px-2 py-1 text-center rounded ${cellClass(cell)}`}
                        title={`OK ${cell.OK} · ALLINV ${cell.ALLINV} · PART ${cell.PART}`}
                      >
                        {cell.OK}/{cell.OK + cell.ALLINV + cell.PART}
                      </td>
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
        Each cell is <span className="mono">OK / total</span>. Color encodes the
        OK fraction. Hover for the ALLINV / PART breakdown.
      </p>
    </section>
  );
}
