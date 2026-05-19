import type { CoverageCell } from "@/lib/types";

// Compact mini-heatmap. No text inside cells — only color intensity by OK%.
export function CoverageMatrix({ coverage }: { coverage: CoverageCell[] }) {
  const models = Array.from(new Set(coverage.map((c) => c.model))).sort();
  const Fs = Array.from(new Set(coverage.map((c) => c.F))).sort();
  const Ks = Array.from(new Set(coverage.map((c) => c.K))).sort((a, b) => a - b);
  const lookup = new Map<string, CoverageCell>();
  for (const c of coverage) lookup.set(`${c.model}|${c.F}|${c.K}`, c);

  function color(c: CoverageCell | undefined): string {
    if (!c) return "#fafafa";
    const t = c.OK + c.ALLINV + c.PART;
    if (!t) return "#fafafa";
    const frac = c.OK / t;
    // White -> indigo ramp.
    const a = 0.08 + frac * 0.62;
    return `rgba(79,70,229,${a.toFixed(2)})`;
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">
          Coverage (K × F)
        </div>
        <div className="text-[10px] text-zinc-400">indigo = OK fraction</div>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] tabular-nums border-separate border-spacing-[2px]">
          <thead>
            <tr>
              <th className="pr-2 text-zinc-500 font-normal">model · F</th>
              {Ks.map((k) => (
                <th
                  key={k}
                  className="px-1 text-center text-zinc-500 font-normal"
                >
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.flatMap((m) =>
              Fs.map((f) => (
                <tr key={`${m}-${f}`}>
                  <td className="pr-2 text-zinc-600 whitespace-nowrap">
                    {m.replace("Qwen", "")} · {f}
                  </td>
                  {Ks.map((k) => {
                    const c = lookup.get(`${m}|${f}|${k}`);
                    return (
                      <td
                        key={k}
                        title={
                          c
                            ? `OK ${c.OK} · ALLINV ${c.ALLINV} · PART ${c.PART}`
                            : "no data"
                        }
                        style={{ background: color(c) }}
                        className="w-6 h-4 rounded"
                      />
                    );
                  })}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
