import { createAgentResult } from './missionTypes';
import { companyName, countryOf } from './missionActions';

export function runGeographicAgent({ companies, layouts, intent }) {
  const country = intent.filters?.country;
  const region = intent.filters?.region;
  const matches = companies
    .map((company, index) => ({ company, index, country: countryOf(company), region: layouts?.meta?.[index]?.region }))
    .filter((item) => {
      if (country) return item.country === country;
      if (region) return item.region === region || item.country === region;
      return true;
    });

  const counts = new Map();
  companies.forEach((company, index) => {
    const key = layouts?.meta?.[index]?.region || countryOf(company);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  const dominant = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const target = country || region;
  const finding = target
    ? `${matches.length} companies match ${target}; ${matches.slice(0, 3).map((item) => companyName(item.company)).join(', ') || 'no matches'} are in scope.`
    : `${dominant?.[0] || 'Unknown'} is the largest regional pocket with ${dominant?.[1] || 0} companies.`;

  return createAgentResult('geographic', finding, {
    matchedIndices: matches.map((item) => item.index),
    confidence: 0.86,
  });
}
