import { INTENTS } from './missionTypes';
import { companyName } from './missionActions';
import { assertSourceType, RADIX_CATEGORIES } from '../lib/radix';

const SKILL_EXTRACTION_TEXT_LIMIT = 7000;

export function buildIntentPrompt({ command, companies }) {
  const names = companies.map((company) => companyName(company)).join(', ');
  return `You are the intent parser for a financial cosmos dashboard.

Return only valid JSON. Do not explain. Do not invent company metrics.

Available intents:
${INTENTS.map((intent) => `- ${intent}`).join('\n')}

Available companies:
${names}

User command:
${command}

Return:
{
  "intent": "focus_company",
  "companyNames": [],
  "filters": {
    "country": null,
    "region": null,
    "sector": null,
    "currency": null,
    "metric": null
  },
  "sort": {
    "metric": null,
    "direction": "desc"
  },
  "phase": null,
  "needsClarification": false,
  "clarifyingQuestion": null
}`;
}

export function buildNarrativePrompt({ command, intent, facts }) {
  return `You are Mission Control for a financial cosmos dashboard.

Write a concise mission briefing using only the facts below.
Do not invent numbers. Mention estimated values if present.
Use a cinematic but professional tone.
Return only valid JSON.

User command:
${command}

Intent:
${intent.intent}

Facts:
${JSON.stringify(facts, null, 2)}

Return:
{
  "title": "...",
  "summary": "...",
  "bullets": [],
  "nextQuestions": []
}`;
}

export function buildSkillExtractionPrompt({ text, sourceType }) {
  assertSourceType(sourceType);
  const isResume = sourceType === 'resume';
  const sourceLabel = isResume ? 'resume' : 'job description';
  const sourceText = String(text || '').slice(0, SKILL_EXTRACTION_TEXT_LIMIT);
  const categories = RADIX_CATEGORIES
    .map(({ code, label, blurb }) => `- ${code} (${label}): ${blurb}`)
    .join('\n');
  const sourceInstructions = isResume
    ? 'Also extract the candidate name, email, education, projects, experience, certifications, hackathons, and preferred roles. Tolerate messy layouts and leave a field empty when it is not present.'
    : "Focus on Key Responsibilities and What We're Looking For.";
  const structuredFields = isResume
    ? `,
  "education": [
    { "qualification": "...", "institution": "...", "dates": "..." }
  ],
  "projects": [
    { "name": "...", "summary": "..." }
  ],
  "experience": [
    { "role": "...", "organization": "...", "dates": "..." }
  ],
  "certifications": [],
  "hackathons": [],
  "preferred_roles": []`
    : '';

  return `You are the skill extraction agent for a talent matching dashboard.

Return only valid JSON. Do not explain.

Extract skills and requirements from the ${sourceLabel} below.
Map each requirement or skill to exactly one RADIX code:
${categories}

Use OTHER for named technologies, frameworks, platforms, and tools, with the tool itself as skill_name.
For every skill, quote a short evidence span from the source and rate confidence as high, medium, or low.
Extract the company and role only when the source states them; otherwise use null.
${sourceInstructions}

${isResume ? 'Resume' : 'Job description'} text:
${sourceText}

Return:
{
  "source_type": "${isResume ? 'resume' : 'jd'}",
  "source_file": "",
  "company": null,
  "role": null,
  ${isResume ? '"name": "",\n  "email": "",' : ''}
  "skills": [
    {
      "skill_name": "...",
      "category_code": "COD|DSA|OOD|APTI|COMM|AI|CLOUD|SQL|SWE|SYSD|NETW|OS|OTHER",
      "evidence": "...",
      "confidence": "high|medium|low"
    }
  ]${structuredFields}
}`;
}
