import { profitState } from '../lib/profitability';
import { createAgentResult } from './missionTypes';
import { companyName, countryOf } from './missionActions';

function closeness(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0.35;
  const delta = Math.abs(Math.log10(a) - Math.log10(b));
  return Math.max(0, 1 - delta / 3);
}

export function runSimilarityAgent({ companies, sourceIndex }) {
  const source = companies[sourceIndex];
  if (!source) {
    return createAgentResult('similarity', 'No source company is selected for peer matching.', {
      sourceCompanyIndex: null,
      matches: [],
      confidence: 0.4,
    });
  }

  const sourceCountry = countryOf(source);
  const sourceProfit = profitState(source.profitability_status);
  const matches = companies
    .map((company, index) => {
      if (index === sourceIndex) return null;
      const reasons = [];
      const sectorScore = company.sector === source.sector ? 1 : 0;
      if (sectorScore) reasons.push('same sector');
      const geographyScore = countryOf(company) === sourceCountry ? 1 : 0;
      if (geographyScore) reasons.push(`same geography (${sourceCountry})`);
      const currencyScore = company.metricCurrencies?.valuation === source.metricCurrencies?.valuation ? 1 : 0;
      if (currencyScore) reasons.push(`same valuation currency (${company.metricCurrencies?.valuation})`);
      const valuationScore = closeness(company.metrics?.valuation, source.metrics?.valuation);
      const revenueScore = closeness(company.metrics?.revenue, source.metrics?.revenue);
      const employeeScore = closeness(company.metrics?.employees, source.metrics?.employees);
      const profitScore = profitState(company.profitability_status) === sourceProfit ? 1 : 0;
      if (valuationScore > 0.75) reasons.push('similar valuation band');
      if (revenueScore > 0.75) reasons.push('similar revenue band');
      if (employeeScore > 0.75) reasons.push('similar employee scale');

      const score =
        sectorScore * 0.3 +
        valuationScore * 0.25 +
        geographyScore * 0.15 +
        revenueScore * 0.15 +
        employeeScore * 0.1 +
        profitScore * 0.05 +
        currencyScore * 0.04;

      return {
        companyIndex: index,
        name: companyName(company),
        score: Number(Math.min(1, score).toFixed(2)),
        reasons: reasons.slice(0, 3),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return createAgentResult('similarity', `Found ${matches.length} peer bodies near ${companyName(source)}.`, {
    sourceCompanyIndex: sourceIndex,
    matches,
    confidence: matches.length ? 0.84 : 0.5,
  });
}
