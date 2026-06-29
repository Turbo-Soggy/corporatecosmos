import { deriveSector } from './sectors';
import { parseFormattedMetric } from './parseMetric';
import { formatValue, DISPLAY_FIELDS } from './formatDisplay';
import { explicitCurrencyCode, formatCurrencyCompact } from './currency';
import { profitState } from './profitability';

const MONEY_FIELDS = ['valuation', 'annual_revenue', 'total_capital_raised', 'annual_profit'];
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const METRIC_SPECS = {
  valuation: { field: 'valuation', currency: true },
  revenue: { field: 'annual_revenue', currency: true },
  capital: { field: 'total_capital_raised', currency: true },
  growth: { field: 'yoy_growth_rate' },
  offices: { field: 'office_count' },
  employees: { field: 'employee_size' },
  nps: { field: 'net_promoter_score' },
};

const isMissing = (value) =>
  value == null || String(value).trim() === '' || /^(na|n\/a|none|tbd|not applicable|—)$/i.test(String(value).trim());

function ratioMetric(raw) {
  const n = parseFormattedMetric(raw);
  if (!Number.isFinite(n)) return NaN;
  return n > 1.5 ? n / 100 : n;
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return NaN;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function locationCurrency(company) {
  const location = String(company.headquarters_address || '').toLowerCase();
  if (/india|mumbai|bangalore|bengaluru|delhi|noida|gurgaon|hyderabad|pune|chennai/.test(location)) return 'INR';
  if (/australia|sydney|melbourne/.test(location)) return 'AUD';
  if (/canada|toronto|vancouver/.test(location)) return 'CAD';
  if (/singapore/.test(location)) return 'SGD';
  if (/united kingdom|u\.k\.|england|london|scotland/.test(location)) return 'GBP';
  if (/ireland|germany|france|netherlands|spain|italy|portugal|belgium|austria/.test(location)) return 'EUR';
  if (/united states|u\.s\.|usa|california|new york|seattle|texas|boston/.test(location)) return 'USD';
  return 'INR';
}

function inferCompanyCurrency(company) {
  for (const field of MONEY_FIELDS) {
    const explicit = explicitCurrencyCode(company[field]);
    if (explicit) return explicit;
  }
  return locationCurrency(company);
}

function formatKnownMoney(value, currency, raw) {
  if (!Number.isFinite(value) || !currency) return formatValue('valuation', raw);
  const approximate = /\d\s*-\s*\d/.test(String(raw || ''));
  return `${approximate ? '≈ ' : ''}${formatCurrencyCompact(value, currency)}`;
}

function estimatedDisplay(metric, value, currency) {
  if (METRIC_SPECS[metric].currency) return `Est. ${formatCurrencyCompact(value, currency)}`;
  if (metric === 'growth') return `Est. ${Math.round(value * 100)}%`;
  if (metric === 'nps') return `Est. ${Math.round(value)}`;
  return `Est. ${compact.format(Math.round(value))}`;
}

function fallbackEstimate(metric, currency) {
  if (metric === 'growth') return 0.12;
  if (metric === 'offices') return 8;
  if (metric === 'employees') return 2500;
  if (metric === 'nps') return 35;
  const scale = currency === 'INR' ? 10 : 1;
  if (metric === 'valuation') return 2e9 * scale;
  if (metric === 'revenue') return 5e8 * scale;
  if (metric === 'capital') return 2e8 * scale;
  return NaN;
}

function peerEstimate(companies, company, metric, currency) {
  const spec = METRIC_SPECS[metric];
  let peers = companies.filter(
    (peer) =>
      peer !== company &&
      peer.sector === company.sector &&
      Number.isFinite(peer.metrics[metric]) &&
      (!spec.currency || peer.metricCurrencies[metric] === currency)
  );
  if (!peers.length) {
    peers = companies.filter(
      (peer) =>
        peer !== company &&
        Number.isFinite(peer.metrics[metric]) &&
        (!spec.currency || peer.metricCurrencies[metric] === currency)
    );
  }
  const estimate = median(peers.map((peer) => peer.metrics[metric]));
  return Number.isFinite(estimate) ? estimate : fallbackEstimate(metric, currency);
}

export function formatCompanyData(companies) {
  const formatted = companies.map((raw) => {
    const sector = deriveSector(raw.category);
    const companyCurrency = inferCompanyCurrency(raw);
    const metrics = {
      valuation: parseFormattedMetric(raw.valuation),
      revenue: parseFormattedMetric(raw.annual_revenue),
      capital: parseFormattedMetric(raw.total_capital_raised),
      growth: ratioMetric(raw.yoy_growth_rate),
      offices: parseFormattedMetric(raw.office_count),
      employees: parseFormattedMetric(raw.employee_size),
      nps: parseFormattedMetric(raw.net_promoter_score),
    };
    const metricCurrencies = {
      valuation: explicitCurrencyCode(raw.valuation) || companyCurrency,
      revenue: explicitCurrencyCode(raw.annual_revenue) || companyCurrency,
      capital: explicitCurrencyCode(raw.total_capital_raised) || companyCurrency,
    };
    const display = {};
    for (const key of DISPLAY_FIELDS) display[key] = formatValue(key, raw[key]);
    display.valuation = formatKnownMoney(metrics.valuation, metricCurrencies.valuation, raw.valuation);
    display.annual_revenue = formatKnownMoney(metrics.revenue, metricCurrencies.revenue, raw.annual_revenue);
    display.total_capital_raised = formatKnownMoney(metrics.capital, metricCurrencies.capital, raw.total_capital_raised);

    return {
      ...raw,
      sector,
      metrics,
      metricCurrencies,
      display,
      estimated: {},
    };
  });

  for (const company of formatted) {
    for (const [metric, spec] of Object.entries(METRIC_SPECS)) {
      if (Number.isFinite(company.metrics[metric])) continue;
      const currency = spec.currency ? company.metricCurrencies[metric] : null;
      const estimate = peerEstimate(formatted, company, metric, currency);
      if (!Number.isFinite(estimate)) continue;
      company.metrics[metric] = estimate;
      company.estimated[metric] = true;
      company.display[spec.field] = estimatedDisplay(metric, estimate, currency);
    }
  }

  const profitabilityBySector = new Map();
  for (const company of formatted) {
    const state = profitState(company.profitability_status);
    if (state === 'unknown') continue;
    const counts = profitabilityBySector.get(company.sector) || { profit: 0, loss: 0 };
    counts[state] += 1;
    profitabilityBySector.set(company.sector, counts);
  }
  for (const company of formatted) {
    if (!isMissing(company.profitability_status)) continue;
    const counts = profitabilityBySector.get(company.sector) || { profit: 1, loss: 0 };
    company.profitability_status =
      counts.profit >= counts.loss ? 'Estimated profitable' : 'Estimated loss-making';
    company.estimated.profitability_status = true;
  }

  return formatted;
}
