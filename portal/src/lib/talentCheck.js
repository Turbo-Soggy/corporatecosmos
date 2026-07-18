// Talent Check: compare a candidate profile against a company's expected 12-skillset
// bar and produce a readiness score + per-skillset gap. Pure comparison logic (no LLM).
//
// DESIGN DECISION #2 — what "ready" means:
//   per category  met = clamp(candidate_level / required_level, 0, 1)
//   readiness     = round( 100 * Σ(required_c * met_c) / Σ required_c )
// Weighting by required_level means a company that demands more of a skill makes that
// skill matter more — so scores differ meaningfully across candidates and companies.

import { RADIX_CATEGORIES } from './radix';
import { categoryLevels, normalizeTalentCheck } from './radixProfile';
import { loadCompanyBar } from './companyBar';

/**
 * @returns normalized Talent Check result, or null when the company has no bar.
 */
export function runTalentCheck(profile, companyName) {
  const bar = loadCompanyBar(companyName);
  if (!bar) return null;

  const candidate = categoryLevels(profile);
  let weighted = 0;
  let weightTotal = 0;

  const skillset_gap = RADIX_CATEGORIES.map(({ code }) => {
    const required_level = bar[code];
    const candidate_level = candidate[code] ?? 0;
    const met = required_level > 0 ? Math.min(candidate_level / required_level, 1) : 1;
    weighted += required_level * met;
    weightTotal += required_level;
    return { category_code: code, required_level, candidate_level, gap: candidate_level < required_level };
  });

  const readiness_score = weightTotal > 0 ? Math.round((weighted / weightTotal) * 100) : 0;

  return normalizeTalentCheck({ company: companyName, skillset_gap, readiness_score });
}
