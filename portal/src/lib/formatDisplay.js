// Display-side formatting. Policy (confirmed with product):
//  - Currency: PRESERVE the source currency & scale, just clean it up. Fix the
//    "?"->₹ mojibake, strip trailing prose, normalize scale words. Indian values
//    keep NATIVE crore/lakh. No FX conversion — we never invent numbers.
//  - Ratios (0..1) -> percentage. Already-percent strings pass through.
//  - Bare raw numbers are the only thing we actively format; anything already
//    carrying a currency symbol / scale word / "%" passes through unchanged
//    (never double-formatted).
// Edge cases are handled explicitly in each helper (null, '', NA, 0, negative).

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
const inGroup = new Intl.NumberFormat('en-IN'); // 2,800 grouping
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const isNil = (v) => v == null || String(v).trim() === '';
const isNA = (s) => /^(na|n\/a|none|tbd|not applicable)$/i.test(s);
const isPureNumber = (s) => /^-?\d+(\.\d+)?$/.test(s);
const round1 = (n) => Math.round(n * 10) / 10;

// ₹ in native Indian notation (crore / lakh), used only for BARE numbers where
// we assume INR (the portal's home currency).
function inrNative(n) {
  if (n === 0) return '₹0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${sign}₹${inGroup.format(round1(abs / 1e7))} Cr`;
  if (abs >= 1e5) return `${sign}₹${inGroup.format(round1(abs / 1e5))} L`;
  return `${sign}₹${inGroup.format(abs)}`;
}

// Tidy a value that ALREADY has a currency/scale — shorten western scale words,
// keep crore/lakh native, and drop trailing prose after the money token.
function cleanExistingMoney(s) {
  const token = s.match(
    /^\s*(₹|rs\.?|inr|\$|us\$|usd|aud|a\$|€|eur|£|gbp)?\s*[\d.,]+\s*(?:-\s*[\d.,]+)?\s*(trillion|billion|million|thousand|crore|cr|lakh|lac|bn|mn|[kmbt])?/i
  );
  if (!token) return s.trim(); // qualitative — pass through
  let out = token[0].trim().replace(/\s+/g, ' ');
  out = out
    .replace(/\btrillion\b/i, 'T')
    .replace(/\bbillion\b/i, 'B')
    .replace(/\bmillion\b/i, 'M')
    .replace(/\bthousand\b/i, 'K')
    .replace(/\bcrore\b/i, 'Cr')
    .replace(/\blakh\b|\blac\b/i, 'L');
  // Attach western suffixes ("29.3 B" -> "29.3B"); keep Indian " Cr"/" L" spaced.
  out = out.replace(/(\d)\s+([BMKT])\b/, '$1$2');
  return out;
}

/** Currency display: preserve native currency/scale, clean only. */
export function formatCurrency(raw) {
  if (isNil(raw)) return EMPTY;
  let s = String(raw).trim();
  if (isNA(s)) return EMPTY;
  s = s.replace(/\?(?=\s*\d)/g, '₹'); // de-mojibake leading ₹

  const bare = s.replace(/,/g, '');
  if (isPureNumber(bare)) return inrNative(parseFloat(bare)); // assume ₹
  return cleanExistingMoney(s);
}

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
  if (CURRENCY_FIELDS.has(key)) return formatCurrency(raw);
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
