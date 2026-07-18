// Skill Matching: how well a candidate's skills cover ONE specific JD's extracted
// skill list. Deterministic core (no network) — the default path and the fallback for
// the optional Gemma agent. The gap list (missing_skills) is the point, per the brief.
//
// Matching has real fuzziness (the same skill is worded differently across documents),
// so we combine: (1) same category_code + alias-normalized name equality, and (2) for
// broad conceptual categories, "candidate has ANY skill in that category" counts.
// match_score is confidence-weighted by the JD side, so missing a "high" requirement
// costs more than missing a "low" one.

import { confidenceWeight, normalizeSkill } from './radix';
import { normalizeSkillMatch } from './radixProfile';

// Surface-form aliases collapsed to a canonical token before comparison.
const ALIASES = {
  js: 'javascript', ts: 'typescript', 'node.js': 'node', nodejs: 'node',
  golang: 'go', k8s: 'kubernetes', 'c sharp': 'c#', 'c-sharp': 'c#',
  postgres: 'postgresql', 'tcp/ip': 'tcp', 'ci/cd': 'ci', gcp: 'google cloud',
  ml: 'machine learning', 'gen ai': 'generative ai', genai: 'generative ai',
};

function canon(name) {
  const n = String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  return ALIASES[n] || n;
}

// Broad categories where an exact tech name rarely matches across documents, so
// demonstrating ANY skill in the category is treated as covering the requirement.
const BROAD_CATEGORIES = new Set(['DSA', 'OS', 'SYSD', 'APTI', 'COMM', 'NETW', 'OOD']);

function skillsOf(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.skills)) return input.skills;
  return [];
}

/**
 * @param candidate  a profile, a skill list, or an array of skills
 * @param jdSkillList JD Analytics output ({ source_file, skills } or an array)
 * @returns normalized Skill Match result
 */
export function matchSkills(candidate, jdSkillList) {
  const candSkills = skillsOf(candidate).map(normalizeSkill).filter(Boolean);
  const jdSkills = skillsOf(jdSkillList).map(normalizeSkill).filter(Boolean);

  const candByKey = new Set();
  const candCategories = new Set();
  for (const s of candSkills) {
    candByKey.add(`${s.category_code}:${canon(s.skill_name)}`);
    candCategories.add(s.category_code);
  }

  const matched_skills = [];
  const missing_skills = [];
  let matchedWeight = 0;
  let totalWeight = 0;

  for (const j of jdSkills) {
    const w = confidenceWeight(j.confidence);
    totalWeight += w;
    const exact = candByKey.has(`${j.category_code}:${canon(j.skill_name)}`);
    const broad = BROAD_CATEGORIES.has(j.category_code) && candCategories.has(j.category_code);
    if (exact || broad) {
      matched_skills.push(j.skill_name);
      matchedWeight += w;
    } else {
      missing_skills.push(j.skill_name);
    }
  }

  const match_score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

  return normalizeSkillMatch({
    jd_source_file: (jdSkillList && jdSkillList.source_file) || '',
    match_score,
    matched_skills,
    missing_skills,
  });
}
