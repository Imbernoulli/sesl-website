export function Phase4Card({ items }: { items: string[] }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
        Phase 4 backlog
      </div>
      <ol className="text-[11px] text-zinc-600 space-y-1 list-decimal pl-4">
        {items.map((s, i) => (
          <li key={i} className="leading-snug">
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
