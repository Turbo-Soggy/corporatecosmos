import { phaseIndexFor } from '../../lib/phases';

// Context card (bottom-right) that swaps content per scroll phase. Rows render
// as ranked bars so the data reads at a glance, not just as a list. Values are
// the cleaned display strings precomputed in formatCompanyData.
export default function ClusterCard({ progress, layouts }) {
  const idx = phaseIndexFor(progress);
  const { meta, regionCounts } = layouts;

  let title = 'OVERVIEW';
  let rows = []; // { k, v, weight 0..1, tone }

  if (idx === 0) {
    title = 'COSMOS OVERVIEW';
    rows = [
      { k: 'Companies', v: layouts.count, weight: 1 },
      { k: 'Regions', v: regionCounts.length, weight: regionCounts.length / 6 },
      {
        k: 'Categories',
        v: new Set(meta.map((m) => m.category)).size,
        weight: 0.5,
      },
    ];
  } else if (idx === 1) {
    title = 'FINANCIAL LEADERS';
    const ranked = [...meta]
      .filter((m) => Number.isFinite(m.valuation))
      .sort((a, b) => b.valuation - a.valuation)
      .slice(0, 5);
    const max = ranked[0]?.valuation || 1;
    rows = ranked.map((m) => ({
      k: m.name,
      v: m.valuationDisplay,
      weight: m.valuation / max,
      tone: 'accent',
    }));
  } else {
    title = 'REGIONAL DISTRIBUTION';
    const sorted = regionCounts.slice().sort((a, b) => b.count - a.count);
    const max = sorted[0]?.count || 1;
    rows = sorted.map((r) => ({ k: r.region, v: r.count, weight: r.count / max }));
  }

  return (
    <div className="pointer-events-auto absolute bottom-6 right-6 w-72">
      <div className="glass p-5">
        <div className="label-mono text-accent/80">{title}</div>
        <ul className="mt-4 space-y-3">
          {rows.map((r, i) => (
            <li
              key={`${title}-${r.k}`}
              className="animate-rowIn"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="truncate text-ink-muted">{r.k}</span>
                <span className="tnum font-mono text-ink">{r.v}</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${
                    r.tone === 'accent' ? 'bg-accent' : 'bg-data-violet'
                  }`}
                  style={{ width: `${Math.max(6, Math.round((r.weight ?? 0) * 100))}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
