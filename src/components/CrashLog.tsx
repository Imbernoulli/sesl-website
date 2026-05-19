import type { EventEntry } from "@/lib/types";

export function CrashLog({ events }: { events: EventEntry[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
        ALLINV runs
      </div>
      {events.length === 0 ? (
        <div className="text-[11px] text-zinc-500">none recorded</div>
      ) : (
        <ul className="text-[10px] font-mono space-y-0.5 max-h-48 overflow-y-auto">
          {events.slice(0, 12).map((e, i) => (
            <li key={i} className="flex gap-2 text-zinc-600">
              <span className="text-zinc-400 shrink-0">{e.ts.slice(11, 19)}</span>
              <span className="truncate">{e.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
