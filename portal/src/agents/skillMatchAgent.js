// Optional Gemma-assisted Skill Matching. The deterministic matcher (lib/skillMatch)
// is the default and the fallback; when Ollama is online this asks Gemma to resolve
// fuzzy skill aliases across the two documents. Mirrors the LLM+fallback pattern in
// narrativeAgent.js. The prompt is inlined here (not in prompts.js) so the 3-5 branch
// doesn't touch a file the Roles 1-2 work is editing.

import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';
import { confidenceWeight } from '../lib/radix';
import { matchSkills } from '../lib/skillMatch';
import { normalizeSkillMatch } from '../lib/radixProfile';

function skillsOf(input) {
  if (Array.isArray(input)) return input;
  if (input && Array.isArray(input.skills)) return input.skills;
  return [];
}

function buildSkillMatchPrompt(candidateSkills, jdSkills) {
  return `You compare a candidate's skills against ONE job's required skills.
Return only valid JSON. Do not explain.
Two skills match if they mean the same thing, even when worded differently.

Job required skills:
${jdSkills.map((s) => `- ${s.skill_name} [${s.category_code}]`).join('\n')}

Candidate skills:
${candidateSkills.map((s) => `- ${s.skill_name} [${s.category_code}]`).join('\n')}

Return only the job's skill names, each in exactly one list:
{ "matched_skills": ["<job skill name>"], "missing_skills": ["<job skill name>"] }`;
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

    const jdSkills = skillsOf(jdSkillList);
    const candSkills = skillsOf(candidate);
    if (!jdSkills.length) return deterministic;

    const text = await callOllama(buildSkillMatchPrompt(candSkills, jdSkills), {
      model: ollama.model,
      temperature: 0.1,
      numPredict: 500,
      timeoutMs: 10000,
    });
    const raw = parseJsonObject(text);
    const matchedNames = new Set((raw.matched_skills || []).map((s) => String(s).toLowerCase().trim()));

    // Reconcile the model's names against the JD list and compute a confidence-weighted
    // score, so an off-list hallucinated skill can't inflate the number.
    const matched_skills = [];
    const missing_skills = [];
    let matchedWeight = 0;
    let totalWeight = 0;
    for (const j of jdSkills) {
      const w = confidenceWeight(j.confidence);
      totalWeight += w;
      if (matchedNames.has(String(j.skill_name).toLowerCase().trim())) {
        matched_skills.push(j.skill_name);
        matchedWeight += w;
      } else {
        missing_skills.push(j.skill_name);
      }
    }
    const match_score = totalWeight > 0 ? Math.round((matchedWeight / totalWeight) * 100) : 0;

    return {
      ...normalizeSkillMatch({
        jd_source_file: (jdSkillList && jdSkillList.source_file) || '',
        match_score,
        matched_skills,
        missing_skills,
      }),
      source: 'gemma',
    };
  } catch {
    return deterministic;
  }
}
