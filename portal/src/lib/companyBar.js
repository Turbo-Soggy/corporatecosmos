// Loads a company's expected 12-skillset bar for Talent Check. Data is a local
// placeholder snapshot (src/data/talent_check_company_skillsets.json) — swap in the
// facilitator's real RADIX snapshot with no code change. Company names are matched
// against the cosmos node names (Google / Microsoft / OFSS) via an alias map.

import barsData from '../data/talent_check_company_skillsets.json';
import { RADIX_CATEGORIES } from './radix';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const BARS = (barsData && barsData.companies) || {};

// Surface forms that should resolve to a bar key. Matched by substring on the
// lowercased company name so cosmos labels like "Alphabet (Google)" still hit.
const ALIASES = [
  ['google', 'Google'],
  ['alphabet', 'Google'],
  ['microsoft', 'Microsoft'],
  ['ofss', 'OFSS'],
  ['oracle financial', 'OFSS'],
  ['oracle fss', 'OFSS'],
  ['oracle', 'OFSS'],
];

function resolveKey(companyName) {
  const name = String(companyName || '').toLowerCase().trim();
  if (!name) return null;
  if (BARS[companyName]) return companyName; // exact key hit
  for (const [needle, key] of ALIASES) {
    if (name.includes(needle) && BARS[key]) return key;
  }
  return null;
}

/** Company names that have a defined skillset bar. */
export function companiesWithBar() {
  return Object.keys(BARS);
}

/** True if this company (or an alias) has an expected bar. */
export function hasCompanyBar(companyName) {
  return resolveKey(companyName) != null;
}

/**
 * Expected required levels for a company as { [CODE]: 1..10 } across all 12
 * categories (missing codes default to 1), or null if the company has no bar.
 */
export function loadCompanyBar(companyName) {
  const key = resolveKey(companyName);
  if (!key) return null;
  const bar = BARS[key];
  const out = {};
  for (const { code } of RADIX_CATEGORIES) {
    const level = Number(bar?.[code]);
    out[code] = clamp(Number.isFinite(level) ? Math.round(level) : 1, 1, 10);
  }
  return out;
}
