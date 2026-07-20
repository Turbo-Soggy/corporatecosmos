import { assertSourceType, RADIX_LEXICON, normalizeSkillList } from '../lib/radix';
import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';
import { buildSkillExtractionPrompt } from './prompts';

function literalPattern(term) {
  return term
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('(?:[\\s\\u00a0]+|[-\\u2010-\\u2015])');
}

function findLiteral(text, term) {
  const startsWithWordCharacter = /^[\p{L}\p{N}]/u.test(term);
  const endsWithWordCharacter = /[\p{L}\p{N}]$/u.test(term);
  const leftBoundary = startsWithWordCharacter ? '(^|[^\\p{L}\\p{N}])' : '()';
  const rightBoundary = endsWithWordCharacter ? '(?=$|[^\\p{L}\\p{N}])' : '';
  const pattern = new RegExp(`${leftBoundary}(${literalPattern(term)})${rightBoundary}`, 'iu');
  const match = pattern.exec(text);
  if (!match) return null;

  const start = match.index + match[1].length;
  return {
    start,
    end: start + match[2].length,
    value: match[2].replace(/\s+/g, ' ').trim(),
  };
}

function evidenceSnippet(text, start, end) {
  const radius = 90;
  let left = Math.max(0, start - radius);
  let right = Math.min(text.length, end + radius);
  const leftBreak = text.slice(left, start).search(/[^.!?;\n]*$/);
  if (leftBreak >= 0) left += leftBreak;
  const rightBreak = text.slice(end, right).search(/[.!?;\n]/);
  if (rightBreak >= 0) right = end + rightBreak + 1;

  const snippet = text.slice(left, right).replace(/\s+/g, ' ').trim();
  return `${left > 0 ? '...' : ''}${snippet}${right < text.length ? '...' : ''}`.slice(0, 160);
}

function localSkills(text) {
  const skills = [];

  for (const [categoryCode, terms] of Object.entries(RADIX_LEXICON)) {
    const matches = terms
      .map((term) => ({ term, match: findLiteral(text, term) }))
      .filter(({ match }) => match)
      .sort((a, b) => a.match.start - b.match.start || b.match.end - b.match.start - (a.match.end - a.match.start));
    const accepted = [];

    for (const candidate of matches) {
      const { match } = candidate;
      const contained = accepted.some((item) => match.start >= item.start && match.end <= item.end);
      if (contained) continue;
      accepted.push(match);
      skills.push({
        skill_name: match.value || candidate.term,
        category_code: categoryCode,
        evidence: evidenceSnippet(text, match.start, match.end),
        confidence: 'low',
      });
    }
  }

  return skills;
}

function localResumeFields(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const email = String(text || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const name = lines.find((line) =>
    line.length >= 2 && line.length <= 70 && !/@/.test(line) && !/^https?:/i.test(line)
      && !/resume|curriculum vitae|education|experience|skills|projects|contact/i.test(line)
  ) || '';
  const education = lines.filter((line) =>
    /\b(university|college|institute|bachelor|master|ph\.?d|b\.?s\.?c?\.?|m\.?s\.?c?\.?|b\.?tech|m\.?tech|degree|diploma)\b/i.test(line)
  ).slice(0, 5).map((line) => ({ qualification: line, institution: '', dates: '' }));
  const certifications = lines.filter((line) => /certif|credential|aws certified|microsoft certified|google certified/i.test(line)).slice(0, 8);
  const hackathons = lines.filter((line) => /hackathon/i.test(line)).slice(0, 8);
  return { name, email, education, certifications, hackathons };
}

export function extractSkillsLocally(text, { sourceType, sourceFile } = {}) {
  assertSourceType(sourceType);
  const raw = {
    source_type: sourceType,
    source_file: sourceFile,
    company: null,
    role: null,
    skills: localSkills(String(text || '')),
  };

  if (sourceType === 'resume') {
    Object.assign(raw, localResumeFields(text));
    raw.projects = [];
    raw.experience = [];
  }

  return {
    ...normalizeSkillList(raw, { sourceType, sourceFile }),
    source: 'local',
  };
}

export async function extractSkills({ text, sourceType, sourceFile, model }) {
  assertSourceType(sourceType);
  try {
    const ollama = await checkOllamaHealth(model);
    if (!ollama.online) return extractSkillsLocally(text, { sourceType, sourceFile });

    const response = await callOllama(buildSkillExtractionPrompt({ text, sourceType }), {
      model: ollama.model,
      temperature: 0.1,
      numPredict: 900,
      timeoutMs: 12000,
    });
    const raw = parseJsonObject(response);
    assertSourceType(raw?.source_type);
    if (raw.source_type !== sourceType) {
      throw new TypeError('Model source_type must match sourceType');
    }
    const normalized = normalizeSkillList(raw, { sourceType, sourceFile });
    if (!normalized.skills.length) throw new Error('Model response contained no valid skills');
    return { ...normalized, source: 'gemma' };
  } catch {
    return extractSkillsLocally(text, { sourceType, sourceFile });
  }
}
