export function Phase4Card({ items }: { items: string[] }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold mb-2">Phase 4 — deferred harness upgrades</h2>
      <p className="text-sm text-[color:var(--muted-foreground)] mb-3">
        Deliberately not applied mid-grid (changing harness code mid-run
        invalidates α comparisons). Cut as a dedicated Phase-4 ablation once
        the current scaling-α baseline is locked.
      </p>
      <ol className="text-sm space-y-2 list-decimal pl-5">
        {items.map((s, i) => (
          <li key={i} className="leading-snug">{s}</li>
        ))}
      </ol>
    </section>
  );
}
