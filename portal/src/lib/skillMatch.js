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

export function canonicalSkillName(name) {
  let n = String(name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  n = ALIASES[n] || n;
  if (n.length > 4 && n.endsWith('ies')) return `${n.slice(0, -3)}y`;
  if (n.length > 4 && n.endsWith('s')) return n.slice(0, -1);
  return n;
}

// Broad categories where an exact tech name rarely matches across documents, so
// demonstrating ANY skill in the category is treated as covering the requirement.
const BROAD_CATEGORIES = new Set(['DSA', 'OS', 'SYSD', 'APTI', 'COMM', 'NETW', 'OOD']);

function skillsOf(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.skills)) return input.skills;
  return [];
}

// Extraction can return surface-form duplicates such as "query" and "queries".
// Keep one requirement, preferring stronger confidence and richer JD evidence.
export function uniqueSkills(input) {
  const byKey = new Map();
  for (const skill of skillsOf(input).map(normalizeSkill).filter(Boolean)) {
    const key = `${skill.category_code}:${canonicalSkillName(skill.skill_name)}`;
    const current = byKey.get(key);
    if (!current || confidenceWeight(skill.confidence) > confidenceWeight(current.confidence)
      || String(skill.evidence || '').length > String(current.evidence || '').length) {
      byKey.set(key, skill);
    }
  }
  return [...byKey.values()];
}

function fallbackDevelopmentArea(requirement) {
  const skill = requirement.skill_name;
  const evidence = String(requirement.evidence || '').trim();
  const context = evidence ? ` The JD connects it to: ${evidence}.` : '';
  return {
    skill,
    evidence,
    why: `${skill} is requested by this JD but is not supported by the uploaded resume evidence.${context}`,
    action: `Create one truthful example that demonstrates ${skill}${evidence ? ' in the context described by the JD' : ''}, then add the method, tools, and outcome to the resume.`,
    proof_plan: 'Use a relevant project, course, certification, or work example and describe what you personally did and what changed as a result.',
  };
}

/**
 * @param candidate  a profile, a skill list, or an array of skills
 * @param jdSkillList JD Analytics output ({ source_file, skills } or an array)
 * @returns normalized Skill Match result
 */
export function matchSkills(candidate, jdSkillList) {
  const candSkills = uniqueSkills(candidate);
  const jdSkills = uniqueSkills(jdSkillList);

  const candByKey = new Set();
  const candCategories = new Set();
  for (const s of candSkills) {
    candByKey.add(`${s.category_code}:${canonicalSkillName(s.skill_name)}`);
    candCategories.add(s.category_code);
  }

  const matched_skills = [];
  const missing_skills = [];
  let matchedWeight = 0;
  let totalWeight = 0;

  for (const j of jdSkills) {
    const w = confidenceWeight(j.confidence);
    totalWeight += w;
    const exact = candByKey.has(`${j.category_code}:${canonicalSkillName(j.skill_name)}`);
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
    strengths: matched_skills.map((skill) => ({
      skill,
      why: 'This resume skill covers a requirement identified in the job description.',
    })),
    development_areas: jdSkills
      .filter((skill) => missing_skills.includes(skill.skill_name))
      .map(fallbackDevelopmentArea),
    summary: matched_skills.length
      ? `The resume covers ${matched_skills.length} of ${jdSkills.length} weighted requirements. Review the development areas before applying.`
      : 'No overlapping RADIX skills were found. Add more resume evidence or review the job description requirements.',
  });
}
