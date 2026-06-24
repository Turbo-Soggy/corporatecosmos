import { useMemo, useState } from 'react';

// All 118 companies, sortable. Click a row to jump back to the 3D scene and fly
// the camera to that node. Numeric blanks always sink to the bottom regardless
// of sort direction so they never crowd out real leaders.
const COLUMNS = [
  { key: 'name', label: 'Company', numeric: false, align: 'left' },
  { key: 'sector', label: 'Sector', numeric: false, align: 'left' },
  { key: 'region', label: 'Region', numeric: false, align: 'left' },
  { key: 'valuation', label: 'Valuation', numeric: true, align: 'right' },
  { key: 'growth', label: 'YoY', numeric: true, align: 'right' },
  { key: 'employees', label: 'Staff', numeric: true, align: 'right' },
  { key: 'profit', label: 'Profitability', numeric: false, align: 'left' },
];

const PROFIT_CLASS = { profit: 'text-pos', loss: 'text-neg', unknown: 'text-ink-muted' };

export default function CompanyLeaderboard({ data, onSelectCompany }) {
  const [sortKey, setSortKey] = useState('valuation');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortKey);
    const rows = [...data];
    rows.sort((a, b) => {
      if (col.numeric) {
        const av = a[sortKey];
        const bv = b[sortKey];
        const an = Number.isFinite(av);
        const bn = Number.isFinite(bv);
        if (!an && !bn) return 0;
        if (!an) return 1; // blanks last, always
        if (!bn) return -1;
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const av = String(a[sortKey] ?? '').toLowerCase();
      const bv = String(b[sortKey] ?? '').toLowerCase();
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return rows;
  }, [data, sortKey, sortDir]);

  const onHeader = (key) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(COLUMNS.find((c) => c.key === key).numeric ? 'desc' : 'asc');
    }
  };

  return (
    <div className="glass overflow-hidden p-0">
      <div className="flex items-center justify-between px-6 pt-5">
        <div className="label-mono text-accent/80">COMPANY LEADERBOARD</div>
        <div className="label-mono text-ink-faint">{data.length} COMPANIES</div>
      </div>
      <div className="cosmos-scroll mt-3 max-h-[70vh] overflow-y-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl">
            <tr className="border-b border-white/10">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => onHeader(c.key)}
                  className={`label-mono cursor-pointer select-none whitespace-nowrap px-4 py-3 font-medium transition hover:text-ink ${
                    c.align === 'right' ? 'text-right' : 'text-left'
                  } ${sortKey === c.key ? 'text-accent' : 'text-ink-faint'}`}
                >
                  {c.label}
                  {sortKey === c.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.companyIndex}
                onClick={() => onSelectCompany(row.companyIndex)}
                className="cursor-pointer border-b border-white/[0.04] transition hover:bg-white/[0.04]"
              >
                <td className="max-w-[18rem] truncate px-4 py-2.5 font-medium text-ink">{row.name}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2 text-ink-muted">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: row.color }} />
                    <span className="truncate">{row.sector}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-ink-muted">{row.region}</td>
                <td className="tnum whitespace-nowrap px-4 py-2.5 text-right text-ink">{row.valuationDisplay}</td>
                <td className="tnum whitespace-nowrap px-4 py-2.5 text-right text-ink-muted">{row.growthDisplay}</td>
                <td className="tnum whitespace-nowrap px-4 py-2.5 text-right text-ink-muted">{row.employeesDisplay}</td>
                <td className={`max-w-[16rem] truncate px-4 py-2.5 ${PROFIT_CLASS[row.profit]}`}>
                  {row.profitabilityText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
