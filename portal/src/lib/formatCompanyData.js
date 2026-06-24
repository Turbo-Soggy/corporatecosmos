import { deriveSector } from './sectors';
import { parseFormattedMetric } from './parseMetric';
import { formatValue, DISPLAY_FIELDS } from './formatDisplay';

// Called EXACTLY ONCE, right after the Supabase fetch resolves. Produces the
// only company shape the rest of the app consumes. Generic over array length —
// nothing here assumes 118 rows.
//
// Each formatted company carries:
//   ...raw            original full_json fields (text passthrough)
//   sector            derived color/legend bucket
//   metrics           parsed Numbers for the 3D layout (positions, scale)
//   display           cleaned strings for the HUD (no component re-formats)

// Normalize a growth-style ratio to a 0..1-ish number for spatial layout:
// "0.2" -> 0.2, "12-20%" -> 0.16, "20" -> 0.2.
function ratioMetric(raw) {
  const n = parseFormattedMetric(raw);
  if (!Number.isFinite(n)) return NaN;
  return n > 1.5 ? n / 100 : n;
}

export function formatCompanyData(companies) {
  return companies.map((c) => {
    const metrics = {
      valuation: parseFormattedMetric(c.valuation),
      revenue: parseFormattedMetric(c.annual_revenue),
      capital: parseFormattedMetric(c.total_capital_raised),
      growth: ratioMetric(c.yoy_growth_rate),
      offices: parseFormattedMetric(c.office_count),
      employees: parseFormattedMetric(c.employee_size),
    };

    const display = {};
    for (const key of DISPLAY_FIELDS) display[key] = formatValue(key, c[key]);

    return { ...c, sector: deriveSector(c.category), metrics, display };
  });
}
