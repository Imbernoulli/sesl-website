import type { GridStatus, RunCounts, ServerStatus } from "@/lib/types";

function dot(s: string): string {
  if (s === "ok" || s === "running") return "bg-emerald-500";
  if (s === "live-only" || s === "unknown") return "bg-zinc-400";
  if (s === "retired" || s === "stopped") return "bg-amber-500";
  return "bg-rose-500";
}

export function SystemStatus({
  servers,
  grids,
  counts,
}: {
  servers: ServerStatus[];
  grids: GridStatus[];
  counts: RunCounts;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        Operational
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] tabular-nums text-zinc-700">
        {[
          ["total", counts.total],
          ["completed", counts.completed],
          ["scored", counts.scored],
          ["OK", counts.ok],
          ["ALLINV", counts.allinv],
          ["PART", counts.part],
        ].map(([label, v]) => (
          <span key={label as string} className="flex items-center gap-1">
            <span className="text-zinc-400 uppercase tracking-wider text-[10px]">
              {label}
            </span>
            <span>{v as number}</span>
          </span>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
            vLLM servers
          </div>
          <ul className="space-y-0.5">
            {servers.map((s) => (
              <li key={s.port} className="flex items-center gap-2 tabular-nums">
                <span className={`w-1.5 h-1.5 rounded-full ${dot(s.status)}`} />
                <span className="text-zinc-600">:{s.port}</span>
                <span className="text-zinc-400 truncate">{s.model}</span>
                <span className="ml-auto text-zinc-500">{s.status}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
            Grids
          </div>
          <ul className="space-y-0.5">
            {grids.map((g) => (
              <li key={g.name} className="flex items-center gap-2 tabular-nums">
                <span className={`w-1.5 h-1.5 rounded-full ${dot(g.status)}`} />
                <span className="text-zinc-600">{g.name}</span>
                <span className="text-zinc-400">· {g.log_lines}L</span>
                <span className="ml-auto text-zinc-500">{g.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
