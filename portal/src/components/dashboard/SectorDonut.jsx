import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Sector mix donut. Colors come straight from SECTOR_COLORS (passed per-slice on
// the data rows) so a slice matches the emissive hue of those nodes in the 3D scene.
function SliceTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pct = total ? Math.round((d.count / total) * 100) : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm shadow-glass">
      <div className="flex items-center gap-2 text-ink">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
        {d.sector}
      </div>
      <div className="tnum mt-0.5 text-ink-muted">
        {d.count} · {pct}%
      </div>
    </div>
  );
}

export default function SectorDonut({ data, total }) {
  return (
    <div className="glass p-6">
      <div className="label-mono text-accent/80">SECTOR DISTRIBUTION</div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="sector"
              innerRadius="55%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.sector} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<SliceTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((d) => (
          <li key={d.sector} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 text-ink-muted">
              <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: d.color }} />
              <span className="truncate">{d.sector}</span>
            </span>
            <span className="tnum shrink-0 font-mono text-ink-faint">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
