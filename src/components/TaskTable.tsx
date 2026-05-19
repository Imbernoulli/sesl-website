import type { HeadlineEntry } from "@/lib/types";

const PROBE_TASKS = ["circle_n37", "circle_n31_obstacle", "rastrigin16"];

export function TaskTable({ headline }: { headline: HeadlineEntry[] }) {
  const rows = headline
    .filter((h) => PROBE_TASKS.includes(h.task))
    .sort((a, b) => a.task.localeCompare(b.task) || a.model.localeCompare(b.model));

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
        Per-probe best
      </div>
      {rows.length === 0 ? (
        <div className="text-[11px] text-zinc-500">no scored probes yet</div>
      ) : (
        <table className="text-[10px] tabular-nums w-full font-mono">
          <thead>
            <tr className="text-zinc-400 text-left">
              <th className="py-0.5 pr-2 font-normal">task</th>
              <th className="py-0.5 pr-2 font-normal">model</th>
              <th className="py-0.5 pr-2 font-normal">K</th>
              <th className="py-0.5 pr-2 font-normal">F</th>
              <th className="py-0.5 pr-2 font-normal text-right">best</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="text-zinc-600 border-t border-zinc-100">
                <td className="py-0.5 pr-2">{r.task}</td>
                <td className="py-0.5 pr-2">{r.model.replace("Qwen", "")}</td>
                <td className="py-0.5 pr-2">{r.K}</td>
                <td className="py-0.5 pr-2">{r.F}</td>
                <td className="py-0.5 pr-2 text-right">{r.best.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
