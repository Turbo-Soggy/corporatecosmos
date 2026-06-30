export function companyName(company) {
  return company?.short_name || company?.name || 'Unknown company';
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

export function companySearchText(company) {
  return normalizeText([
    company?.name,
    company?.short_name,
    company?.category,
    company?.sector,
    company?.headquarters_address,
    company?.operating_countries,
  ].filter(Boolean).join(' '));
}

export function findCompanyIndices(companies, names = []) {
  const result = new Set();
  const indexed = companies.map((company, index) => ({
    index,
    name: normalizeText(companyName(company)),
    full: normalizeText(company.name),
    short: normalizeText(company.short_name),
    compactName: compactText(companyName(company)),
    search: companySearchText(company),
  }));

  for (const rawName of names) {
    const name = normalizeText(rawName);
    const compact = compactText(rawName);
    if (!name) continue;
    const exact = indexed.find((item) => item.name === name || item.full === name || item.short === name);
    if (exact) {
      result.add(exact.index);
      continue;
    }
    const partial = indexed.find((item) => {
      if (name.length < 3) return false;
      return item.name.includes(name) || item.full.includes(name) || item.short.includes(name) || item.compactName.includes(compact);
    });
    if (partial) result.add(partial.index);
  }

  return [...result];
}

export function findCompaniesInCommand(companies, command) {
  const q = normalizeText(command);
  const compact = compactText(command);
  const hits = [];
  companies.forEach((company, index) => {
    const names = [company.name, company.short_name].filter(Boolean);
    const matched = names.some((name) => {
      const clean = normalizeText(name);
      if (!clean || clean.length < 3) return false;
      return q.includes(clean) || compact.includes(compactText(name));
    });
    if (matched) hits.push(index);
  });
  return hits;
}

export function countryOf(company) {
  const hay = normalizeText(`${company?.headquarters_address ?? ''} ${company?.operating_countries ?? ''} ${company?.office_locations ?? ''}`);
  if (/india|mumbai|bangalore|bengaluru|delhi|noida|gurgaon|gurugram|hyderabad|pune|chennai|kolkata/.test(hay)) return 'India';
  if (/united states|usa|u s |california|new york|san francisco|seattle|texas|boston|chicago/.test(hay)) return 'United States';
  if (/canada|toronto|vancouver/.test(hay)) return 'Canada';
  if (/united kingdom|london|england|scotland/.test(hay)) return 'United Kingdom';
  if (/ireland|germany|france|netherlands|spain|sweden|switzerland|italy|portugal|belgium|austria/.test(hay)) return 'Europe';
  if (/singapore/.test(hay)) return 'Singapore';
  if (/australia|sydney|melbourne/.test(hay)) return 'Australia';
  if (/japan|tokyo/.test(hay)) return 'Japan';
  if (/china|beijing|shanghai|hong kong/.test(hay)) return 'China';
  return 'Other';
}

export function inferRegionFilter(command) {
  const q = normalizeText(command);
  if (/\bindia\b|\bindian\b/.test(q)) return { country: 'India', region: 'India' };
  if (/\bus\b|\busa\b|united states|american|north america/.test(q)) return { country: 'United States', region: 'North America' };
  if (/europe|european|uk|united kingdom|germany|france|ireland|netherlands|spain/.test(q)) return { country: null, region: 'Europe' };
  if (/apac|asia|singapore|japan|china|australia/.test(q)) return { country: null, region: 'APAC' };
  return { country: null, region: null };
}

export function inferSectorFilter(companies, command) {
  const q = normalizeText(command);
  const sectors = [...new Set(companies.map((company) => company.sector).filter(Boolean))];
  return sectors.find((sector) => q.includes(normalizeText(sector))) || null;
}

export function inferMetric(command) {
  const q = normalizeText(command);
  if (/revenue|sales/.test(q)) return 'revenue';
  if (/employee|headcount|people/.test(q)) return 'employees';
  if (/growth|growing/.test(q)) return 'growth';
  if (/capital|funding|raised/.test(q)) return 'capital';
  if (/valuation|valued|value|market/.test(q)) return 'valuation';
  return null;
}

export function metricDisplay(metric) {
  return {
    valuation: 'valuation',
    revenue: 'revenue',
    employees: 'employee count',
    growth: 'YoY growth',
    capital: 'capital raised',
    nps: 'NPS',
  }[metric] || metric || 'metric';
}

export function formatMetric(company, metric) {
  if (!company) return '-';
  if (metric === 'valuation') return company.display?.valuation || '-';
  if (metric === 'revenue') return company.display?.annual_revenue || '-';
  if (metric === 'capital') return company.display?.total_capital_raised || '-';
  if (metric === 'growth') return company.display?.yoy_growth_rate || '-';
  if (metric === 'employees') return company.display?.employee_size || '-';
  return '-';
}

export function selectedOrFirst(indices, selectedIndex) {
  if (indices.length) return indices[0];
  return typeof selectedIndex === 'number' ? selectedIndex : null;
}

export function uniqueIndices(indices, max) {
  return [...new Set(indices)].filter((index) => Number.isInteger(index) && index >= 0 && index < max);
}
