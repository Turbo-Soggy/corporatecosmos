import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// Valuation (log X, USD) × YoY growth (Y), dot sized by headcount, colored by
// sector. Click a dot to fly the 3D camera to that node.
const GRID = 'rgba(255,255,255,0.06)';
const TICK = { fill: '#64748B', fontSize: 11, fontFamily: '"JetBrains Mono", monospace' };

const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function PointTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-white/10 bg-surface px-3 py-2 text-sm shadow-glass">
      <div className="flex items-center gap-2 font-medium text-ink">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
        {d.name}
      </div>
      <div className="label-mono mt-1 text-ink-faint">{d.sector}</div>
      <div className="tnum mt-1 text-xs text-ink-muted">
        Valuation ≈ <span className="text-ink">{d.valuationDisplay}</span>
      </div>
      <div className="tnum text-xs text-ink-muted">
        YoY growth <span className="text-ink">{d.growthDisplay}</span>
      </div>
    </div>
  );
}

export default function FinancialScatter({ data, onSelectCompany }) {
  const handleClick = (pt) => {
    const idx = pt?.companyIndex ?? pt?.payload?.companyIndex;
    if (idx != null) onSelectCompany(idx);
  };

  return (
    <div className="glass p-6">
      <div className="label-mono text-accent/80">VALUATION × GROWTH</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 16, bottom: 24, left: 8 }}>
            <CartesianGrid stroke={GRID} />
            <XAxis
              type="number"
              dataKey="valuation"
              name="Valuation"
              scale="log"
              domain={['auto', 'auto']}
              tick={TICK}
              tickFormatter={(v) => `$${compact.format(v)}`}
              stroke={GRID}
              label={{ value: 'VALUATION →', position: 'insideBottom', offset: -12, fill: '#64748B', fontSize: 10, letterSpacing: '0.2em' }}
            />
            <YAxis
              type="number"
              dataKey="growthPct"
              name="YoY growth"
              tick={TICK}
              tickFormatter={(v) => `${Math.round(v)}%`}
              stroke={GRID}
              label={{ value: '↑ GROWTH', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10, letterSpacing: '0.2em' }}
            />
            <ZAxis type="number" dataKey="employees" range={[30, 350]} />
            <Tooltip content={<PointTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
            <Scatter data={data} onClick={handleClick} className="cursor-pointer">
              {data.map((d) => (
                <Cell key={d.companyIndex} fill={d.color} fillOpacity={0.78} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center text-xs text-ink-faint">Click a point to fly to it · dot size = headcount</div>
    </div>
  );
}
