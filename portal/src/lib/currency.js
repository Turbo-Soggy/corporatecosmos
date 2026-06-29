const RULES = [
  [/\bAUD\b|A\$/i, 'AUD'],
  [/\bCAD\b|C\$/i, 'CAD'],
  [/\bSGD\b|S\$/i, 'SGD'],
  [/\bGBP\b|£/i, 'GBP'],
  [/\bEUR\b|€/i, 'EUR'],
  [/\bINR\b|₹|\?(?=\s*\d)|(?:^|\s)Rs\.?\s*/i, 'INR'],
  [/\bUSD\b|US\$|^\s*\$/i, 'USD'],
];

const BARE_NUMBER = /^\s*-?[\d,.]+(?:\.\d+)?\s*(?:[KMBT]|thousand|million|billion|trillion|crore|cr|lakh|lac)?\s*$/i;

/** Return the source currency without converting the amount. */
export function explicitCurrencyCode(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (!value || /^(na|n\/a|none|tbd|not applicable)$/i.test(value)) return null;
  for (const [pattern, code] of RULES) if (pattern.test(value)) return code;
  return null;
}

/** Return the source currency, applying the product's bare-number INR default. */
export function currencyCode(raw) {
  if (raw == null) return null;
  const value = String(raw).trim();
  const explicit = explicitCurrencyCode(value);
  if (explicit) return explicit;
  // Existing product policy treats unadorned monetary values as INR.
  return BARE_NUMBER.test(value) ? 'INR' : null;
}

export function formatCurrencyCompact(value, code) {
  if (!Number.isFinite(value) || !code) return '—';
  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/** Normalize values only against peers reported in the same currency. */
export function rankWithinCurrency(values, currencies) {
  const ranks = new Array(values.length).fill(0.5);
  const groups = new Map();

  values.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    const key = currencies[index] || 'UNSPECIFIED';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ index, value });
  });

  for (const entries of groups.values()) {
    entries.sort((a, b) => a.value - b.value);
    if (entries.length === 1) {
      ranks[entries[0].index] = 0.5;
      continue;
    }
    entries.forEach((entry, rank) => {
      ranks[entry.index] = rank / (entries.length - 1);
    });
  }

  return ranks;
}
