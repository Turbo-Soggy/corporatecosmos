import { useMemo } from 'react';
import { SECTOR_COLORS, sectorColor } from '../../lib/sectors';
import { profitState } from '../../lib/profitability';
import { formatUsd } from '../../lib/currency';
import KpiBar from './KpiBar';
import SectorDonut from './SectorDonut';
import FinancialScatter from './FinancialScatter';
import RegionBar from './RegionBar';
import CompanyLeaderboard from './CompanyLeaderboard';

const SECTOR_ORDER = Object.keys(SECTOR_COLORS);

function median(values) {
  const s = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Full-screen analytics view. All derivations happen here (once, memoized); the
// chart/table children are presentational. Reads the same formatted `companies`
// shape + `layouts` the 3D scene uses, so numbers and colors never drift.
export default function DashboardView({ companies, layouts, onSelectCompany }) {
  const data = useMemo(() => {
    const total = companies.length;

    // --- Sector mix ---
    const sectorData = SECTOR_ORDER.map((sector) => ({
      sector,
      count: companies.filter((c) => c.sector === sector).length,
      color: SECTOR_COLORS[sector],
    })).filter((d) => d.count > 0);

    // --- KPIs ---
    const medianVal = median(companies.map((c) => c.metrics.valuation));
    const medianGrowth = median(companies.map((c) => c.metrics.growth));
    const profitCount = companies.filter((c) => profitState(c.profitability_status) === 'profit').length;

    const kpis = [
      { label: 'Companies', value: String(total) },
      { label: 'Sectors', value: String(sectorData.length) },
      {
        label: 'Median Valuation',
        value: Number.isFinite(medianVal) ? `≈ ${formatUsd(medianVal)}` : '—',
        hint: 'converted to USD',
      },
      {
        label: 'Median YoY Growth',
        value: Number.isFinite(medianGrowth) ? `${Math.round(medianGrowth * 100)}%` : '—',
      },
      {
        label: 'Profitable',
        value: `${Math.round((profitCount / total) * 100)}%`,
        hint: `${profitCount} of ${total}`,
      },
    ];

    // --- Scatter (clamp growth so a dirty -1200% outlier doesn't flatten the axis) ---
    const scatterData = companies
      .map((c, i) => ({
        companyIndex: i,
        name: c.short_name || c.name,
        sector: c.sector,
        color: sectorColor(c.sector),
        valuation: c.metrics.valuation,
        growthPct: Math.max(-100, Math.min(300, c.metrics.growth * 100)),
        employees: Number.isFinite(c.metrics.employees) ? c.metrics.employees : 1,
        valuationDisplay: c.display.valuation,
        growthDisplay: c.display.yoy_growth_rate,
      }))
      .filter((d) => Number.isFinite(d.valuation) && d.valuation > 0 && Number.isFinite(d.growthPct));

    // --- Leaderboard (full 118 rows) ---
    const leaderboardData = companies.map((c, i) => ({
      companyIndex: i,
      name: c.short_name || c.name,
      sector: c.sector,
      color: sectorColor(c.sector),
      region: layouts.meta[i].region,
      valuation: c.metrics.valuation,
      valuationDisplay: c.display.valuation,
      growth: c.metrics.growth,
      growthDisplay: c.display.yoy_growth_rate,
      employees: c.metrics.employees,
      employeesDisplay: c.display.employee_size,
      profit: profitState(c.profitability_status),
      profitabilityText: c.profitability_status || '—',
    }));

    return { total, sectorData, kpis, scatterData, leaderboardData };
  }, [companies, layouts]);

  return (
    <div className="cosmos-scroll fixed inset-0 z-[5] overflow-y-auto bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pb-16 pt-20">
        <header className="mb-6">
          <div className="label-mono text-accent/80">PORTFOLIO DASHBOARD</div>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
            The Corporate Cosmos
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {data.total} companies · live aggregates over the same data that powers the 3D scene.
          </p>
        </header>

        <KpiBar items={data.kpis} />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <FinancialScatter data={data.scatterData} onSelectCompany={onSelectCompany} />
          <SectorDonut data={data.sectorData} total={data.total} />
        </div>

        <div className="mt-4">
          <RegionBar data={layouts.regionCounts} />
        </div>

        <div className="mt-4">
          <CompanyLeaderboard data={data.leaderboardData} onSelectCompany={onSelectCompany} />
        </div>
      </div>
    </div>
  );
}
