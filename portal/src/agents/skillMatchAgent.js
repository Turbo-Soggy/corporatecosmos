// Optional Gemma-assisted Skill Matching. The deterministic matcher (lib/skillMatch)
// is the default and the fallback; when Ollama is online this asks Gemma to resolve
// fuzzy skill aliases across the two documents. Mirrors the LLM+fallback pattern in
// narrativeAgent.js. The prompt is inlined here (not in prompts.js) so the 3-5 branch
// doesn't touch a file the Roles 1-2 work is editing.

import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';
import { confidenceWeight } from '../lib/radix';
import { canonicalSkillName, matchSkills, uniqueSkills } from '../lib/skillMatch';
import { normalizeSkillMatch } from '../lib/radixProfile';

function contextOf(candidate) {
  const sections = [];
  if (candidate?.education) sections.push(`Education: ${candidate.education}`);
  for (const item of candidate?.experience || []) {
    const line = [item?.role, item?.organization, item?.dates].filter(Boolean).join(' · ');
    if (line) sections.push(`Experience: ${line}`);
  }
  for (const item of candidate?.projects || []) {
    const line = [item?.name, item?.summary].filter(Boolean).join(' — ');
    if (line) sections.push(`Project: ${line}`);
  }
  return sections.join('\n') || 'No additional resume context was extracted.';
}

function excerpt(value, limit) {
  const source = String(value || '').trim();
  if (source.length <= limit) return source || 'Not available.';
  const head = Math.ceil(limit * 0.7);
  return `${source.slice(0, head)}\n[...document excerpt shortened...]\n${source.slice(-(limit - head))}`;
}

function buildSkillMatchPrompt(candidateSkills, jdSkills, candidate, jdSkillList) {
  return `You are a constructive career coach comparing ONE resume against ONE job description.
Return only valid JSON. Do not include markdown or claims not supported by the supplied evidence.
Two skills match if they mean the same thing, even when worded differently.
Only call a skill matched when the resume evidence supports it. Do not penalize a missing skill as a character flaw.
Keep every sentence under 20 words. Return at most five development areas, selecting the most important missing requirements.

Job required skills:
${jdSkills.map((s) => `- ${s.skill_name} [${s.category_code}] evidence: ${s.evidence || 'not provided'}`).join('\n')}

Candidate skills:
${candidateSkills.map((s) => `- ${s.skill_name} [${s.category_code}] evidence: ${s.evidence || 'not provided'}`).join('\n')}

Additional resume context:
${contextOf(candidate)}

Raw resume text (use it to ground the coaching in the candidate's actual evidence):
${excerpt(candidate?.source_text, 6000)}

Raw job description text (use it to explain why each gap matters for this role):
${excerpt(jdSkillList?.source_text, 5000)}

Return this shape:
{
  "matched_skills": ["<exact job skill name>"],
  "missing_skills": ["<exact job skill name>"],
  "strengths": [{ "skill": "<exact job skill name>", "why": "<one constructive sentence grounded in the resume>" }],
  "development_areas": [{ "skill": "<exact job skill name>", "why": "<what this role needs and what resume evidence is missing>", "action": "<one specific, constructive next step tailored to this role>", "proof_plan": "<one concrete project, coursework, or work artifact that could prove it>" }],
  "summary": "<one or two sentences explaining the overall fit and the most useful next step>"
}`;
}

/**
 * Skill match with an optional Gemma alias pass. Always returns a normalized result
 * with a `source` of 'gemma' or 'local'. Never throws — falls back deterministically.
 */
export async function matchSkillsSmart(candidate, jdSkillList, { model } = {}) {
  const deterministic = { ...matchSkills(candidate, jdSkillList), source: 'local' };
  try {
    const ollama = await checkOllamaHealth(model);
    if (!ollama.online) return deterministic;

    const jdSkills = uniqueSkills(jdSkillList);
    const candSkills = uniqueSkills(candidate);
    if (!jdSkills.length) return deterministic;

    const text = await callOllama(buildSkillMatchPrompt(candSkills, jdSkills, candidate, jdSkillList), {
      model: ollama.model,
      temperature: 0.1,
      numPredict: 700,
      timeoutMs: 90000,
    });
    const raw = parseJsonObject(text);
    const matchedNames = new Set((raw.matched_skills || []).map(canonicalSkillName));

    // Reconcile the model's names against the JD list and compute a confidence-weighted
    // score, so an off-list hallucinated skill can't inflate the number.
    const matched_skills = [];
    const missing_skills = [];
    let matchedWeight = 0;
    let totalWeight = 0;
    for (const j of jdSkills) {
      const w = confidenceWeight(j.confidence);
      totalWeight += w;
      if (matchedNames.has(canonicalSkillName(j.skill_name))) {
        matched_skills.push(j.skill_name);
        matchedWeight += w;
      } else {
        missing_skills.push(j.skill_name);
      }
    }
    const match_score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    const normalized = normalizeSkillMatch({
        jd_source_file: (jdSkillList && jdSkillList.source_file) || '',
        match_score,
        matched_skills,
        missing_skills,
        strengths: raw.strengths,
        development_areas: raw.development_areas,
        summary: raw.summary,
      });
    const missingByKey = new Map(missing_skills.map((skill) => [canonicalSkillName(skill), skill]));
    const modelAreas = new Map();
    for (const area of normalized.development_areas) {
      const matchedRequirement = missingByKey.get(canonicalSkillName(area.skill));
      if (!matchedRequirement || modelAreas.has(canonicalSkillName(matchedRequirement))) continue;
      const jdRequirement = jdSkills.find((skill) => skill.skill_name === matchedRequirement);
      modelAreas.set(canonicalSkillName(matchedRequirement), {
        ...area,
        skill: matchedRequirement,
        evidence: area.evidence || jdRequirement?.evidence || '',
      });
    }
    const development_areas = jdSkills
      .filter((skill) => missingByKey.has(canonicalSkillName(skill.skill_name)))
      .sort((a, b) => confidenceWeight(b.confidence) - confidenceWeight(a.confidence))
      .slice(0, 5)
      .map((skill) => modelAreas.get(canonicalSkillName(skill.skill_name))
        || deterministic.development_areas.find((area) => canonicalSkillName(area.skill) === canonicalSkillName(skill.skill_name)))
      .filter(Boolean);

    return {
      ...normalized,
      strengths: normalized.strengths.length ? normalized.strengths : deterministic.strengths,
      development_areas,
      summary: normalized.summary || deterministic.summary,
      source: 'gemma',
    };
  } catch (error) {
    const timedOut = error?.name === 'AbortError';
    return {
      ...deterministic,
      fallback_reason: timedOut
        ? 'Gemma4 did not finish before the time limit, so this is the local evidence check.'
        : 'Gemma4 returned a response the app could not use, so this is the local evidence check.',
    };
  }
}
