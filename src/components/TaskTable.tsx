import type { HeadlineEntry } from "@/lib/types";

const PROBE_TASKS = ["circle_n37", "circle_n31_obstacle", "rastrigin16"];

export function TaskTable({ headline }: { headline: HeadlineEntry[] }) {
  // Keep only real probes (memory: those three retain spread; the rest
  // saturate). Sort by task, then model.
  const rows = headline
    .filter((h) => PROBE_TASKS.includes(h.task))
    .sort((a, b) => a.task.localeCompare(b.task) || a.model.localeCompare(b.model));

  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-3">Per-task headline</h2>
      <div className="overflow-x-auto">
        <table className="text-sm w-full">
          <thead className="text-xs text-[color:var(--muted-foreground)] uppercase">
            <tr className="text-left">
              <th className="py-1 pr-3">task</th>
              <th className="py-1 pr-3">model</th>
              <th className="py-1 pr-3">K</th>
              <th className="py-1 pr-3">F</th>
              <th className="py-1 pr-3 text-right">best</th>
              <th className="py-1 pr-3 mono text-xs">run_id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-[color:var(--border)]">
                <td className="py-1 pr-3 mono">{r.task}</td>
                <td className="py-1 pr-3 mono">{r.model}</td>
                <td className="py-1 pr-3 mono">{r.K}</td>
                <td className="py-1 pr-3 mono">{r.F}</td>
                <td className="py-1 pr-3 text-right mono">{r.best.toFixed(4)}</td>
                <td className="py-1 pr-3 mono text-[10px] text-[color:var(--muted-foreground)]">
                  {r.best_run}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-2 text-sm text-[color:var(--muted-foreground)]">
                  No completed scored runs on the real probes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
        Real probe set (retain spread under cross-task aggregation):{" "}
        <span className="mono">{PROBE_TASKS.join(", ")}</span>. Other
        optimization tasks (tsp40/60, maxcut60/100, rastrigin8) saturate to a
        one-shot near-optimum and are dropped from the scaling fit.
      </p>
    </section>
  );
}
