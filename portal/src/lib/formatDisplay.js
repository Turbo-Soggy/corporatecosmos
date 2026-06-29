// Display-side formatting. Policy (confirmed with product):
//  - Currency: CONVERT every value to USD (real FX, preserving economic value)
//    and render one standardized compact form. All currency logic lives in
//    currency.js; this file just delegates.
//  - Ratios (0..1) -> percentage. Already-percent strings pass through.
//  - Counts: bare numbers -> compact; formatted strings pass through.
// Edge cases are handled explicitly in each helper (null, '', NA, 0, negative).

import { formatMoney } from './currency';

const CURRENCY_FIELDS = new Set([
  'annual_revenue',
  'valuation',
  'annual_profit',
  'total_capital_raised',
  'customer_acquisition_cost',
  'customer_lifetime_value',
  'burn_rate',
  'r_and_d_investment',
  'training_spend',
  'brand_value',
]);

const PERCENT_FIELDS = new Set([
  'yoy_growth_rate',
  'churn_rate',
  'market_share_percentage',
  'employee_turnover',
]);

const COUNT_FIELDS = new Set([
  'employee_size',
  'office_count',
  'social_media_followers',
  'runway_months',
]);

const GENERIC_NUMBER_FIELDS = new Set(['net_promoter_score']);

export const DISPLAY_FIELDS = [...CURRENCY_FIELDS, ...PERCENT_FIELDS, ...COUNT_FIELDS, ...GENERIC_NUMBER_FIELDS];

const EMPTY = '—';
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const isNil = (v) => v == null || String(v).trim() === '';
const isNA = (s) => /^(na|n\/a|none|tbd|not applicable)$/i.test(s);
const isPureNumber = (s) => /^-?\d+(\.\d+)?$/.test(s);
const round1 = (n) => Math.round(n * 10) / 10;

/** Ratio display: 0.2 -> "20%". Already-% strings pass through. */
export function formatPercent(raw) {
  if (isNil(raw)) return EMPTY;
  const s = String(raw).trim();
  if (isNA(s)) return EMPTY;
  if (s.includes('%')) return s; // already a percentage / range

  const bare = s.replace(/,/g, '');
  if (!isPureNumber(bare)) return s; // qualitative — pass through
  const n = parseFloat(bare);
  if (n === 0) return '0%';
  // Treat 0..1 (and -1..0) as a ratio; bare integers >1 are ambiguous, so we
  // leave them untouched rather than guess (e.g. a lone "1").
  if (Math.abs(n) <= 1) return `${round1(n * 100)}%`;
  return s;
}

/** Count display: bare numbers -> compact; formatted strings pass through. */
export function formatCount(raw) {
  if (isNil(raw)) return EMPTY;
  const s = String(raw).trim();
  if (isNA(s)) return EMPTY;
  const bare = s.replace(/,/g, '');
  if (!isPureNumber(bare)) return s;
  return compact.format(parseFloat(bare));
}

/** Dispatch by field name. Non-numeric fields are not handled here. */
export function formatValue(key, raw) {
  if (CURRENCY_FIELDS.has(key)) return formatMoney(raw);
  if (PERCENT_FIELDS.has(key)) return formatPercent(raw);
  if (COUNT_FIELDS.has(key)) return formatCount(raw);
  if (GENERIC_NUMBER_FIELDS.has(key)) return formatCount(raw);
  return isNil(raw) ? EMPTY : String(raw);
}

const SPLIT = /\s*[,;·|]\s*/;
/** Split a comma/semicolon list into trimmed tags (for pill rendering). */
export function toTags(raw, max = 14) {
  if (!raw) return [];
  return String(raw)
    .split(SPLIT)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, max);
}
