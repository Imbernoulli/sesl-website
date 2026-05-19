import type { GridStatus, RunCounts, ServerStatus } from "@/lib/types";

function statusBadge(s: string): string {
  if (s === "ok" || s === "running") return "badge ok";
  if (s === "live-only" || s === "unknown") return "badge";
  if (s === "retired" || s === "stopped") return "badge warn";
  return "badge bad";
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
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-3">Live system status</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)] mb-2">
            vLLM servers
          </div>
          <ul className="space-y-2">
            {servers.map((s) => (
              <li
                key={s.port}
                className="flex items-center justify-between text-sm mono"
              >
                <span>
                  :{s.port} <span className="text-[color:var(--muted-foreground)]">{s.model}</span>
                </span>
                <span className={statusBadge(s.status)}>
                  {s.status}
                  {s.detail ? ` (${s.detail})` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-[color:var(--muted-foreground)] mb-2">
            Grids
          </div>
          <ul className="space-y-2">
            {grids.map((g) => (
              <li key={g.name} className="text-sm">
                <div className="flex items-center justify-between mono">
                  <span>
                    grid_{g.name}
                    {g.pid ? (
                      <span className="text-[color:var(--muted-foreground)]"> · pid {g.pid}</span>
                    ) : null}
                    <span className="text-[color:var(--muted-foreground)]">
                      {" "}· {g.log_lines} lines
                    </span>
                  </span>
                  <span className={statusBadge(g.status)}>{g.status}</span>
                </div>
                {g.latest_log_tail.length > 0 ? (
                  <pre className="mt-1 text-[11px] mono bg-[color:var(--muted)] rounded p-2 overflow-x-auto leading-snug">
                    {g.latest_log_tail.slice(-3).join("\n")}
                  </pre>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
        {[
          ["total", counts.total],
          ["completed", counts.completed],
          ["scored", counts.scored],
          ["OK", counts.ok],
          ["ALLINV", counts.allinv],
          ["PART", counts.part],
        ].map(([label, v]) => (
          <div key={label as string} className="bg-[color:var(--muted)] rounded p-3">
            <div className="text-[10px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              {label}
            </div>
            <div className="mono text-lg">{v as number}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
