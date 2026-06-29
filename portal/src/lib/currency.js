// Currency normalization → USD. The source data mixes USD, INR (₹ / Rs / INR /
// "rupee" / crore / lakh, sometimes with ₹ mojibaked to "?"), AUD, GBP (£) and
// EUR, in free-text like "$64.1B", "AUD 29.3 billion", "Rs 16,333 Cr",
// "200000000000 rupee", "£10–12 billion", "$300-350M (FY22)".
//
// Policy (confirmed with product): convert EVERY currency value to USD using
// fixed FX rates so magnitudes are comparable and formatting is uniform. We
// preserve real economic value (a true FX conversion, not a symbol swap), then
// render one standardized compact form: $1.2K / $4.5M / $19.3B / $1.8T.
//
// Rates are deliberately simple, documented constants — not live FX.
const USD_PER = {
  USD: 1,
  INR: 0.012, // ₹83 ≈ $1
  AUD: 0.66,
  GBP: 1.27,
  EUR: 1.08,
};

// Ordered currency detection. AUD/EUR/GBP are checked before USD because "A$"
// and "US$" both contain "$"; INR signals (incl. crore/lakh and the "?"
// mojibake) come last. An amount with no signal is treated as already-USD so a
// plain number is never wrongly multiplied by an FX rate.
function detectCurrency(s) {
  if (/a\$|\baud\b|australian/.test(s)) return 'AUD';
  if (/€|\beuro?s?\b|\beur\b/.test(s)) return 'EUR';
  if (/£|\bgbp\b|pound|sterling/.test(s)) return 'GBP';
  if (/\$|\busd\b|us\$|dollar/.test(s)) return 'USD';
  if (/₹|\brs\b|rs\.|\binr\b|rupee|crore|\bcr\b|lakh|\blac\b|\?\s*[\d,]/.test(s)) return 'INR';
  return 'USD';
}

// Word-scale magnitudes (checked before single-letter suffixes so "29.3 billion"
// and "16,333 cr" resolve correctly). Bare "b/m/k/t" suffixes handled separately.
const WORD_SCALE = [
  [/trillion/, 1e12],
  [/billion|\bbn\b/, 1e9],
  [/crore|\bcr\b/, 1e7],
  [/million|\bmn\b/, 1e6],
  [/lakh|\blac\b/, 1e5],
  [/thousand/, 1e3],
];
const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

const isNonValue = (s) => /^(na|n\/a|none|tbd|not applicable)\b/.test(s);

/**
 * Parse any currency string into an absolute USD Number. Returns NaN for
 * qualitative / missing values ("NA", "Parent-funded", "Publicly Traded").
 * A numeric input is assumed to already be USD.
 */
export function usdValue(raw) {
  if (raw == null) return NaN;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN;

  let s = String(raw).toLowerCase().trim();
  if (!s || isNonValue(s)) return NaN;
  s = s.replace(/,/g, '').replace(/\?(?=\s*\d)/g, '₹'); // strip grouping; de-mojibake ₹

  const currency = detectCurrency(s);

  let scale = null;
  for (const [re, m] of WORD_SCALE) if (re.test(s)) { scale = m; break; }

  // Range ("300-350m", "10–12 billion") → average; otherwise a single value.
  let amount;
  const range = s.match(/(-?\d+(?:\.\d+)?)\s*[-–—]\s*(-?\d+(?:\.\d+)?)\s*([kmbt])?/);
  if (range) {
    const mult = scale ?? (range[3] ? SUFFIX[range[3]] : 1);
    amount = ((parseFloat(range[1]) + parseFloat(range[2])) / 2) * mult;
  } else {
    const single = s.match(/(-?\d+(?:\.\d+)?)\s*([kmbt])?/);
    if (!single) return NaN;
    const mult = scale ?? (single[2] ? SUFFIX[single[2]] : 1);
    amount = parseFloat(single[1]) * mult;
  }

  if (!Number.isFinite(amount)) return NaN;
  return amount * (USD_PER[currency] ?? 1);
}

// 1 decimal place, dropping a trailing ".0".
function trim(n) {
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/** Standardized compact USD: $0 / $45 / $1.2K / $4.5M / $19.3B / $1.8T. */
export function formatUsd(n) {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs === 0) return '$0';
  if (abs >= 1e12) return `${sign}$${trim(abs / 1e12)}T`;
  if (abs >= 1e9) return `${sign}$${trim(abs / 1e9)}B`;
  if (abs >= 1e6) return `${sign}$${trim(abs / 1e6)}M`;
  if (abs >= 1e3) return `${sign}$${trim(abs / 1e3)}K`;
  return `${sign}$${trim(abs)}`;
}

/** Convenience: raw currency string → standardized USD display string. */
export function formatMoney(raw) {
  return formatUsd(usdValue(raw));
}
