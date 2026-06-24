import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Companies per region — horizontal bars, sorted descending. Data is
// layouts.regionCounts ({ region, count }), already computed in buildLayouts.
const TICK = { fill: '#9FB0C8', fontSize: 12, fontFamily: 'Inter, sans-serif' };

export default function RegionBar({ data }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  return (
    <div className="glass p-6">
      <div className="label-mono text-accent/80">REGIONAL DISTRIBUTION</div>
      <div className="mt-4" style={{ height: Math.max(180, sorted.length * 46) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="region"
              tick={TICK}
              width={96}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18} fill="#5EEAD4">
              {sorted.map((d, i) => (
                <Cell key={d.region} fillOpacity={1 - i * 0.1} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                fill="#9FB0C8"
                fontSize={12}
                fontFamily='"JetBrains Mono", monospace'
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
