import type { EventEntry } from "@/lib/types";

export function CrashLog({ events }: { events: EventEntry[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-2">Recent all-invalid runs</h2>
      <p className="text-sm text-[color:var(--muted-foreground)] mb-3">
        Completed runs whose every trial was invalid — usually traces back to
        a vLLM hiccup (the 8000 deadlock or a TP2 OOM). Picked up by{" "}
        <span className="mono">run.py</span>&apos;s skip_existing override on
        the next grid sweep.
      </p>
      {events.length === 0 ? (
        <p className="text-sm text-[color:var(--muted-foreground)]">
          No ALLINV runs recorded.
        </p>
      ) : (
        <ul className="text-xs mono space-y-1">
          {events.map((e, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-[color:var(--muted-foreground)] shrink-0">{e.ts}</span>
              <span>{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
