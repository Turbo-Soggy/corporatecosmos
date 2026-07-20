import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';

function list(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return value == null ? '' : String(value).trim();
}

function fallbackCv(resume, jd, match) {
  const role = text(jd?.role) || text(resume?.role) || 'Target role';
  return {
    name: text(resume?.name),
    email: text(resume?.email),
    target_company: text(jd?.company),
    target_role: role,
    summary: `Resume tailored for the ${role} position${jd?.company ? ` at ${jd.company}` : ''}, emphasizing the candidate's documented skills and experience that align with the job description.`,
    skills: list(resume?.skills).map((skill) => ({
      name: text(skill.skill_name),
      evidence: text(skill.evidence),
    })).filter((skill) => skill.name),
    experience: list(resume?.experience).map((item) => ({
      role: text(item.role),
      organization: text(item.organization),
      dates: text(item.dates),
      bullets: [],
    })),
    projects: list(resume?.projects).map((item) => ({ name: text(item.name), bullets: [text(item.summary)].filter(Boolean) })),
    education: list(resume?.education),
    certifications: list(resume?.certifications).map(text).filter(Boolean),
    hackathons: list(resume?.hackathons).map(text).filter(Boolean),
    fit_note: match?.summary || '',
    source: 'local',
  };
}

function buildPrompt(resume, jd, match) {
  return `You are a professional resume editor. Create a company-specific CV draft for one candidate and one job.
Return only valid JSON. Use only facts present in the resume evidence. Never invent employers, dates, degrees, tools, metrics, awards, or achievements.
You may rewrite existing evidence into concise, professional bullet points, but do not add unsupported claims.
Prioritize requirements that the resume actually supports. Do not list missing JD skills as if the candidate has them.

Target company: ${jd?.company || 'Not stated'}
Target role: ${jd?.role || 'Not stated'}
Job requirements:
${list(jd?.skills).map((skill) => `- ${skill.skill_name}: ${skill.evidence || 'requirement identified in JD'}`).join('\n')}

Resume profile:
${JSON.stringify({
  name: resume?.name,
  email: resume?.email,
  role: resume?.role,
  education: resume?.education,
  experience: resume?.experience,
  projects: resume?.projects,
  certifications: resume?.certifications,
  hackathons: resume?.hackathons,
  skills: resume?.skills,
}, null, 2)}

Fit analysis:
${JSON.stringify({ matched_skills: match?.matched_skills, missing_skills: match?.missing_skills, summary: match?.summary }, null, 2)}

Return this JSON shape:
{
  "name": "",
  "email": "",
  "target_company": "",
  "target_role": "",
  "summary": "2-3 sentences grounded in the resume and tailored to the role",
  "skills": [{ "name": "", "evidence": "" }],
  "experience": [{ "role": "", "organization": "", "dates": "", "bullets": ["", ""] }],
  "projects": [{ "name": "", "bullets": ["" ] }],
  "education": [{ "qualification": "", "institution": "", "dates": "" }],
  "certifications": [],
  "hackathons": [],
  "fit_note": "one sentence explaining the strongest truthful alignment"
}`;
}

function normalizeDraft(raw, fallback) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const clean = (value) => text(value);
  const cleanList = (value) => list(value).map(clean).filter(Boolean);
  const cleanItems = (value, fields) => list(value).map((item) => {
    const out = Object.fromEntries(fields.map((field) => [field, clean(item?.[field])]));
    return out;
  }).filter((item) => Object.values(item).some(Boolean));
  return {
    name: clean(r.name) || fallback.name,
    email: clean(r.email) || fallback.email,
    target_company: clean(r.target_company) || fallback.target_company,
    target_role: clean(r.target_role) || fallback.target_role,
    summary: clean(r.summary) || fallback.summary,
    skills: cleanItems(r.skills, ['name', 'evidence']),
    experience: list(r.experience).map((item) => ({
      role: clean(item?.role), organization: clean(item?.organization), dates: clean(item?.dates), bullets: cleanList(item?.bullets),
    })).filter((item) => item.role || item.organization || item.dates || item.bullets.length),
    projects: list(r.projects).map((item) => ({ name: clean(item?.name), bullets: cleanList(item?.bullets) })).filter((item) => item.name || item.bullets.length),
    education: cleanItems(r.education, ['qualification', 'institution', 'dates']),
    certifications: cleanList(r.certifications),
    hackathons: cleanList(r.hackathons),
    fit_note: clean(r.fit_note) || fallback.fit_note,
    source: 'gemma',
  };
}

export async function generateTargetedCv({ resume, jd, match, model } = {}) {
  const fallback = fallbackCv(resume, jd, match);
  try {
    const ollama = await checkOllamaHealth(model);
    if (!ollama.online) return fallback;
    const response = await callOllama(buildPrompt(resume, jd, match), {
      model: ollama.model,
      temperature: 0.2,
      numPredict: 1400,
      timeoutMs: 18000,
    });
    return normalizeDraft(parseJsonObject(response), fallback);
  } catch {
    return fallback;
  }
}
