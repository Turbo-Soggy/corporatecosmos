import { INTENTS } from './missionTypes';
import { companyName } from './missionActions';

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
