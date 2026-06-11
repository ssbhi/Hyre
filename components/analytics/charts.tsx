/** Lightweight, dependency-free CSS charts for the analytics page. */

export function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  return (
    <div className="space-y-2.5">
      {items.map((i) => (
        <div key={i.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate">{i.label}</span>
            <span className="tabular-nums text-muted-foreground">{i.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(i.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; count: number }[] }) {
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s) => {
        const pctTop = Math.round((s.count / top) * 100);
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">{s.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {s.count} · {pctTop}%
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-md bg-muted">
              <div
                className="h-full rounded-md bg-gradient-to-r from-primary to-cyan-400"
                style={{ width: `${Math.max(pctTop, 3)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
