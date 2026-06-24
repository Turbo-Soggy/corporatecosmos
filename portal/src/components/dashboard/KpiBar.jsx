// Top-of-dashboard summary strip. Pure layout — DashboardView derives the values
// (median over mixed-currency magnitudes, % profitable, etc.) and passes them in.
export default function KpiBar({ items }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((it) => (
        <div key={it.label} className="glass p-4">
          <div className="label-mono text-ink-faint">{it.label}</div>
          <div className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink tnum">
            {it.value}
          </div>
          {it.hint && <div className="mt-1 text-xs text-ink-muted">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}
