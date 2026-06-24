// High-performance text -> number parsing for the Supabase string metrics.
// Values are heterogeneous: "$64.1B", "AUD 29.3 billion", "₹100 Cr" (sometimes
// with the ₹ corrupted to "?"), "740,000 employees", "<3%", "0.03",
// "$300-350M", "200+". These helpers turn them into raw comparable numbers for
// spatial layout. Call them in formatCompanyData (once), never inside useFrame.

const SUFFIX = { k: 1e3, m: 1e6, b: 1e9, t: 1e12 };

// Word-scale magnitudes, including Indian crore/lakh, checked before the
// single-letter suffix so "₹100 crore" resolves correctly.
const WORD_SCALE = [
  [/trillion/, 1e12],
  [/billion/, 1e9],
  [/\bcrore\b|\bcr\b/, 1e7],
  [/million/, 1e6],
  [/\blakh\b|\blac\b/, 1e5],
  [/thousand/, 1e3],
];

function wordScale(s) {
  for (const [re, m] of WORD_SCALE) if (re.test(s)) return m;
  return null;
}

/**
 * Parse a single formatted metric string into a Number.
 * Returns NaN when no number can be extracted ("NA", "Not Applicable").
 */
export function parseFormattedMetric(input) {
  if (input == null) return NaN;
  if (typeof input === 'number') return input;

  let s = String(input).toLowerCase().trim();
  if (!s) return NaN;

  // Strip thousands separators; de-mojibake a leading "?" used as ₹.
  s = s.replace(/,/g, '').replace(/\?(?=\s*\d)/g, '₹');

  const word = wordScale(s);

  // Range: "300-350m" / "12-20%" -> average; suffix applies to both.
  const range = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*([kmbt])?/);
  if (range) {
    const a = parseFloat(range[1]);
    const b = parseFloat(range[2]);
    const mult = word ?? (range[3] ? SUFFIX[range[3]] : 1);
    return ((a + b) / 2) * mult;
  }

  const single = s.match(/(-?\d+(?:\.\d+)?)\s*([kmbt])?/);
  if (!single) return NaN;

  const value = parseFloat(single[1]);
  const mult = word ?? (single[2] ? SUFFIX[single[2]] : 1);
  return value * mult;
}

/** parseFormattedMetric with a fallback chain — first finite value wins. */
export function firstFinite(...inputs) {
  for (const v of inputs) {
    const n = parseFormattedMetric(v);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

/** Min-max normalize an array of numbers into [0,1]; NaNs map to 0.5. */
export function normalize(values) {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return values.map(() => 0.5);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1;
  return values.map((v) => (Number.isFinite(v) ? (v - min) / span : 0.5));
}
