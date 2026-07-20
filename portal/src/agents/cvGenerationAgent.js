import { checkOllamaHealth, callOllama, parseJsonObject } from './ollamaClient';

function list(value) {
  return Array.isArray(value) ? value : [];
}

function text(value) {
  return value == null ? '' : String(value).trim();
}

function mergeProfile(resume, profile) {
  return {
    ...(profile || {}),
    ...(resume || {}),
    name: text(resume?.name) || text(profile?.name),
    email: text(resume?.email) || text(profile?.email),
    education: list(resume?.education).length ? resume.education : profile?.education,
    experience: list(resume?.experience).length ? resume.experience : profile?.internships,
    certifications: list(resume?.certifications).length ? resume.certifications : profile?.certifications,
    hackathons: list(resume?.hackathons).length ? resume.hackathons : profile?.hackathons,
    preferred_roles: list(resume?.preferred_roles).length ? resume.preferred_roles : profile?.preferred_roles,
  };
}

function fallbackCv(resume, profile, jd, match) {
  const candidate = mergeProfile(resume, profile);
  const role = text(jd?.role) || text(candidate?.role) || 'Target role';
  return {
    name: text(candidate?.name),
    email: text(candidate?.email),
    target_company: text(jd?.company),
    target_role: role,
    summary: `Resume tailored for the ${role} position${jd?.company ? ` at ${jd.company}` : ''}, emphasizing the candidate's documented skills and experience that align with the job description.`,
    skills: list(candidate?.skills).map((skill) => ({
      name: text(skill.skill_name),
      evidence: text(skill.evidence),
    })).filter((skill) => skill.name),
    experience: list(candidate?.experience).map((item) => ({
      role: text(item.role),
      organization: text(item.organization),
      dates: text(item.dates),
      bullets: [],
    })),
    projects: list(candidate?.projects).map((item) => ({ name: text(item.name), bullets: [text(item.summary)].filter(Boolean) })),
    education: list(candidate?.education),
    certifications: list(candidate?.certifications).map(text).filter(Boolean),
    hackathons: list(candidate?.hackathons).map(text).filter(Boolean),
    fit_note: match?.summary || '',
    source: 'local',
  };
}

function buildPrompt(resume, profile, jd, match) {
  const candidate = mergeProfile(resume, profile);
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
  name: candidate?.name,
  email: candidate?.email,
  role: candidate?.role,
  education: candidate?.education,
  experience: candidate?.experience,
  projects: candidate?.projects,
  certifications: candidate?.certifications,
  hackathons: candidate?.hackathons,
  skills: candidate?.skills,
}, null, 2)}

Raw resume text (use this to recover details that were not structured above):
${text(resume?.source_text).slice(0, 14000) || 'Not available.'}

Raw job description text:
${text(jd?.source_text).slice(0, 10000) || 'Not available.'}

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

export async function generateTargetedCv({ resume, profile, jd, match, model } = {}) {
  const fallback = fallbackCv(resume, profile, jd, match);
  try {
    const ollama = await checkOllamaHealth(model);
    if (!ollama.online) return fallback;
    const response = await callOllama(buildPrompt(resume, profile, jd, match), {
      model: ollama.model,
      temperature: 0.2,
      numPredict: 1400,
      timeoutMs: 45000,
    });
    return normalizeDraft(parseJsonObject(response), fallback);
  } catch {
    return fallback;
  }
}
