import { createAgentResult } from './missionTypes';
import { companyName, formatMetric, metricDisplay, uniqueIndices } from './missionActions';

function currencyFor(company, metric) {
  if (metric === 'revenue') return company.metricCurrencies?.revenue;
  if (metric === 'capital') return company.metricCurrencies?.capital;
  if (metric === 'valuation') return company.metricCurrencies?.valuation;
  return null;
}

function metricValue(company, metric) {
  return company.metrics?.[metric === 'capital' ? 'capital' : metric] ?? NaN;
}

function rankCandidates(companies, indices, metric) {
  const comparable = uniqueIndices(indices, companies.length)
    .map((index) => ({ index, company: companies[index], value: metricValue(companies[index], metric), currency: currencyFor(companies[index], metric) }))
    .filter((item) => Number.isFinite(item.value));
  const groups = new Map();
  comparable.forEach((item) => {
    const key = item.currency || 'non-currency';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()].flatMap(([currency, items]) =>
    items
      .sort((a, b) => b.value - a.value)
      .map((item, rank) => ({
        companyIndex: item.index,
        name: companyName(item.company),
        metric,
        currency: currency === 'non-currency' ? null : currency,
        value: item.value,
        display: formatMetric(item.company, metric),
        rank: rank + 1,
      }))
  );
}

export function runFinancialAgent({ companies, intent, scopeIndices }) {
  const metric = intent.sort?.metric || intent.filters?.metric || 'valuation';
  const indices = scopeIndices.length ? scopeIndices : companies.map((_, index) => index);
  const rankings = rankCandidates(companies, indices, metric);
  const leaders = rankings.filter((item) => item.rank === 1).slice(0, 3);
  const currencies = new Set(rankings.map((item) => item.currency).filter(Boolean));
  const warnings = [];
  if (currencies.size > 1 && ['valuation', 'revenue', 'capital'].includes(metric)) {
    warnings.push('Currency cohorts are ranked separately; no implicit FX mixing was used.');
  }

  let finding = `Ranked ${rankings.length} companies by ${metricDisplay(metric)}.`;
  if (leaders.length) {
    finding = `Leading ${metricDisplay(metric)} cohort: ${leaders.map((leader) => `${leader.name} (${leader.display})`).join(', ')}.`;
  }

  return createAgentResult('financial', finding, {
    rankings,
    warnings,
    confidence: warnings.length ? 0.82 : 0.9,
  });
}

export function findOutliers(companies) {
  const metrics = ['valuation', 'revenue', 'growth', 'employees'];
  return metrics.flatMap((metric) => {
    const ranked = rankCandidates(companies, companies.map((_, index) => index), metric);
    return ranked.filter((item) => item.rank === 1).slice(0, 2);
  });
}
