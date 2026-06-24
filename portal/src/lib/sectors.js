// Single source of truth for company sector -> color. `category` in company_json
// is 76-value free text (no `industry` field), so we derive a normalized sector
// bucket from it via ordered keyword rules. Both the 3D nodes and the HUD import
// this map so emissive node color and legend/labels stay in sync.

export const SECTOR_COLORS = {
  'FinTech & Banking': '#22d3ee', // cyan
  'IT Services & Consulting': '#6366f1', // indigo
  'SaaS, Cloud & Security': '#a855f7', // violet
  'Healthcare & HealthTech': '#34d399', // emerald
  'Logistics & Mobility': '#f59e0b', // amber
  'Aerospace & Defence': '#38bdf8', // sky
  EdTech: '#fb7185', // rose
  'AI & Research': '#e879f9', // fuchsia
  'Retail & E-commerce': '#2dd4bf', // teal
  'Telecom & Media': '#60a5fa', // blue
  Other: '#94a3b8', // slate (default)
};

export const DEFAULT_SECTOR = 'Other';

// Ordered: first match wins. More specific signals are placed before generic
// tech terms so e.g. "Cloud Security" -> SaaS before the generic IT bucket.
const RULES = [
  [/aerospace|defen[cs]e|\bspace\b|aviation|satellite|air mobility/, 'Aerospace & Defence'],
  [/health|pharma|medical|insurtech|biotech|clinical/, 'Healthcare & HealthTech'],
  [/edtech|e-?learning|education|academic/, 'EdTech'],
  [/telecom|\bmedia\b|broadcast|communications|conglomerate/, 'Telecom & Media'],
  [/logistic|supply chain|delivery|last-?mile|mobility|electric vehicle|\bev\b|two-?wheeler/, 'Logistics & Mobility'],
  [/retail|e-?commerce|grocery|quick commerce|marketplace|travel/, 'Retail & E-commerce'],
  [/fintech|payment|\bbank|lending|wealth|asset management|gold loan|insur/, 'FinTech & Banking'],
  [/\bai\b|artificial intelligence|machine learning|\bresearch\b/, 'AI & Research'],
  [/saas|cloud|cyber|\bsecurity\b|data storage|database|software|infrastructure/, 'SaaS, Cloud & Security'],
  [/it services|consulting|digital transformation|capability center|\bgcc\b|outsourc|analytics|technology|\btech\b/, 'IT Services & Consulting'],
];

/** Map a free-text category to a normalized sector key. */
export function deriveSector(category) {
  if (!category) return DEFAULT_SECTOR;
  const s = String(category).toLowerCase();
  for (const [re, sector] of RULES) if (re.test(s)) return sector;
  return DEFAULT_SECTOR;
}

export function sectorColor(sector) {
  return SECTOR_COLORS[sector] || SECTOR_COLORS[DEFAULT_SECTOR];
}
