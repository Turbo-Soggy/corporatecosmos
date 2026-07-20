// Talent Check: compare a candidate profile against a company's expected 12-skillset
// bar and produce a readiness score + per-skillset gap. Pure comparison logic (no LLM).
//
// DESIGN DECISION #2 — what "ready" means:
//   per category  met = clamp(candidate_level / required_level, 0, 1)
//   readiness     = round( 100 * Σ(required_c * met_c) / Σ required_c )
// Weighting by required_level means a company that demands more of a skill makes that
// skill matter more — so scores differ meaningfully across candidates and companies.

import { confidenceWeight, RADIX_CATEGORIES } from './radix';
import { categoryLevels, normalizeTalentCheck } from './radixProfile';
import { loadCompanyBar } from './companyBar';
import { matchSkills } from './skillMatch';

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

/**
 * Compare the uploaded resume directly against the uploaded JD. The JD has no
 * company bar, so each category's requirement level is derived from the
 * confidence-weighted requirements extracted from that document.
 */
export function runJdReadiness(profile, jd) {
  if (!profile || !jd || !Array.isArray(jd.skills) || !jd.skills.length) return null;

  const candidate = categoryLevels(profile);
  const required = {};
  for (const skill of jd.skills) {
    const code = skill?.category_code;
    if (!code) continue;
    required[code] = (required[code] || 0) + confidenceWeight(skill.confidence);
  }

  let weighted = 0;
  let weightTotal = 0;
  const skillset_gap = RADIX_CATEGORIES.map(({ code }) => {
    const required_level = required[code]
      ? Math.min(10, Math.max(1, Math.round(required[code] * 4)))
      : 0;
    const candidate_level = candidate[code] ?? 0;
    if (required_level > 0) {
      weighted += required_level * Math.min(candidate_level / required_level, 1);
      weightTotal += required_level;
    }
    return {
      category_code: code,
      required_level,
      candidate_level,
      gap: required_level > 0 && candidate_level < required_level,
    };
  });

  const matched = matchSkills(profile, jd);
  return {
    jd_source_file: jd.source_file || '',
    company: jd.company || '',
    role: jd.role || '',
    skillset_gap,
    readiness_score: weightTotal > 0 ? Math.round((weighted / weightTotal) * 100) : 0,
    matched_skills: matched.matched_skills,
    missing_skills: matched.missing_skills,
    requirement_count: jd.skills.length,
  };
}
