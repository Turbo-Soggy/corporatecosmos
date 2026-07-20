// Roles 3-5 contract extensions: candidate profile, per-category level model, and
// Talent Check / Skill Match validators. Kept in a sibling module so the Roles 1-2
// contract in radix.js stays untouched. All shapes follow the RADIX Shared Data
// Contract (RADIX_Talent_Match_Hackathon.pdf p.6).

import {
  RADIX_CATEGORIES,
  CATEGORY_CODES,
  RADIX_LEXICON,
  confidenceWeight,
  normalizeSkill,
} from './radix';

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const int = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
};

function text(value) {
  if (value == null) return '';
  if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) return '';
  return String(value).trim();
}

// Free-text list -> array of trimmed non-empty strings.
function stringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map(text).filter(Boolean);
}

// Dedupe normalized skills by (category, name), keeping the highest confidence —
// mirrors normalizeSkillList's policy in radix.js.
function dedupeSkills(rawSkills) {
  const byKey = new Map();
  for (const candidate of Array.isArray(rawSkills) ? rawSkills : []) {
    const skill = normalizeSkill(candidate);
    if (!skill) continue;
    const key = `${skill.category_code}:${skill.skill_name.toLowerCase()}`;
    const current = byKey.get(key);
    if (!current || confidenceWeight(skill.confidence) > confidenceWeight(current.confidence)) {
      byKey.set(key, skill);
    }
  }
  return [...byKey.values()];
}

/** Validate/normalize a candidate profile into the shared contract shape. */
export function normalizeProfile(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    name: text(r.name),
    email: text(r.email),
    education: text(r.education),
    skills: dedupeSkills(r.skills),
    hackathons: stringList(r.hackathons),
    internships: stringList(r.internships),
    certifications: stringList(r.certifications),
    preferred_roles: stringList(r.preferred_roles),
    cv_file: text(r.cv_file),
  };
}

export function emptyProfile() {
  return {
    name: '',
    email: '',
    education: '',
    skills: [],
    hackathons: [],
    internships: [],
    certifications: [],
    preferred_roles: [],
    cv_file: '',
  };
}

// Count, per category, how many of its lexicon terms appear in `haystack`.
function lexiconHits(haystack) {
  const hay = ` ${String(haystack || '').toLowerCase()} `;
  const hits = {};
  for (const [code, terms] of Object.entries(RADIX_LEXICON)) {
    let count = 0;
    for (const term of terms) if (hay.includes(term)) count += 1;
    hits[code] = count;
  }
  return hits;
}

// ---------------------------------------------------------------------------
// DESIGN DECISION #1 — skills + confidence + profile signals -> level 0..10.
// Evidence per category = Σ confidenceWeight(skills) + half the capped lexicon
// bonus from certs/hackathons/internships/roles/education. A diminishing-returns
// curve maps evidence onto the 1..10 company-bar scale so more evidence approaches
// mastery without a single skill ever reading as "expert":
//   level = round( 10 * (1 - e^(-GAIN * evidence)) )
// e.g. 1 high skill -> ~4, 2 high -> ~7, 3 high -> ~8, 1 low -> ~2.
// Tune LEVEL_GAIN / BONUS_CAP here only.
// ---------------------------------------------------------------------------
const LEVEL_GAIN = 0.55;
const BONUS_CAP = 3;

export function categoryLevels(profile) {
  const p = profile && typeof profile === 'object' ? profile : {};
  const skills = Array.isArray(p.skills) ? p.skills : [];

  const skillWeight = {};
  for (const s of skills) {
    const code = CATEGORY_CODES.has(s?.category_code) ? s.category_code : 'OTHER';
    skillWeight[code] = (skillWeight[code] || 0) + confidenceWeight(s?.confidence);
  }

  // "Beyond the résumé" signals contribute a capped bonus per category.
  const bonusText = [
    ...stringList(p.certifications),
    ...stringList(p.hackathons),
    ...stringList(p.internships),
    ...stringList(p.preferred_roles),
    text(p.education),
  ].join(' ');
  const bonus = lexiconHits(bonusText);

  const levels = {};
  for (const { code } of RADIX_CATEGORIES) {
    const evidence = (skillWeight[code] || 0) + 0.5 * Math.min(BONUS_CAP, bonus[code] || 0);
    levels[code] = clamp(Math.round(10 * (1 - Math.exp(-LEVEL_GAIN * evidence))), 0, 10);
  }
  return levels;
}

/** Validate/normalize a Talent Check result. */
export function normalizeTalentCheck(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const gap = (Array.isArray(r.skillset_gap) ? r.skillset_gap : []).map((g) => {
    const code = typeof g?.category_code === 'string' ? g.category_code.trim().toUpperCase() : '';
    return {
      category_code: CATEGORY_CODES.has(code) ? code : 'OTHER',
      required_level: clamp(int(g?.required_level), 0, 10),
      candidate_level: clamp(int(g?.candidate_level), 0, 10),
      gap: Boolean(g?.gap),
    };
  });
  return {
    company: text(r.company),
    skillset_gap: gap,
    readiness_score: clamp(int(r.readiness_score), 0, 100),
  };
}

/** Validate/normalize a Skill Match result. */
export function normalizeSkillMatch(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const names = (value) =>
    (Array.isArray(value) ? value : [])
      .map((x) => text(typeof x === 'string' ? x : x?.skill_name))
      .filter(Boolean);
  return {
    jd_source_file: text(r.jd_source_file),
    match_score: clamp(int(r.match_score), 0, 100),
    matched_skills: names(r.matched_skills),
    missing_skills: names(r.missing_skills),
    strengths: Array.isArray(r.strengths)
      ? r.strengths.map((item) => ({
          skill: text(item?.skill || item?.skill_name),
          evidence: text(item?.evidence),
          why: text(item?.why),
        })).filter((item) => item.skill)
      : [],
    development_areas: Array.isArray(r.development_areas)
      ? r.development_areas.map((item) => ({
          skill: text(item?.skill || item?.skill_name),
          evidence: text(item?.evidence),
          action: text(item?.action),
        })).filter((item) => item.skill)
      : [],
    summary: text(r.summary),
  };
}

// Map a Résumé Parsing result (extractSkills output, source_type 'resume') into a
// candidate profile draft the Profile Builder can pre-fill and the user then edits.
// The contract's profile.education is a single string, so the résumé's structured
// education array is flattened; experience becomes internship hints.
export function toProfileDraft(resumeResult) {
  const r = resumeResult && typeof resumeResult === 'object' ? resumeResult : {};

  const education = Array.isArray(r.education)
    ? r.education
        .map((e) => [e.qualification, e.institution, e.dates].map(text).filter(Boolean).join(' · '))
        .filter(Boolean)
        .join('; ')
    : text(r.education);

  const internships = Array.isArray(r.experience)
    ? r.experience
        .map((e) => {
          const who = [e.role, e.organization].map(text).filter(Boolean).join(' @ ');
          const when = text(e.dates);
          return [who, when].filter(Boolean).join(' · ');
        })
        .filter(Boolean)
    : [];

  return normalizeProfile({
    name: text(r.name),
    email: text(r.email),
    education,
    skills: Array.isArray(r.skills) ? r.skills : [],
    internships,
    preferred_roles: text(r.role) ? [text(r.role)] : [],
    certifications: Array.isArray(r.certifications) ? r.certifications : [],
    hackathons: Array.isArray(r.hackathons) ? r.hackathons : [],
    cv_file: text(r.source_file),
  });
}
