import { useMemo, useRef, useState } from 'react';
import { RADIX_CATEGORIES, RADIX_LEXICON } from '../../lib/radix';
import { categoryLevels, normalizeProfile, toProfileDraft } from '../../lib/radixProfile';
import { exportProfile, importProfile } from '../../lib/profileStore';
import { extractSkills } from '../../agents/skillExtractionAgent';
import { extractResumeText } from '../../lib/resumeParse';
import SpectrumRadar from './SpectrumRadar';

const CODE_COLOR = Object.fromEntries(RADIX_CATEGORIES.map((c) => [c.code, c.color]));
const CODES = ['OTHER', ...RADIX_CATEGORIES.map((c) => c.code)];

// Best-guess a RADIX category for a freshly typed skill via the lexicon.
function guessCategory(name) {
  const n = ` ${String(name).toLowerCase()} `;
  for (const [code, terms] of Object.entries(RADIX_LEXICON)) {
    if (terms.some((t) => n.includes(` ${t} `) || n.trim() === t)) return code;
  }
  return 'OTHER';
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label-mono text-ink-faint">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/50';

export default function ProfileBuilder({ profile, setProfile, persistProfile, resumeExtract, setResumeExtract }) {
  const [skillDraft, setSkillDraft] = useState('');
  const [status, setStatus] = useState('');
  const cvRef = useRef(null);
  const importRef = useRef(null);

  const levels = useMemo(() => categoryLevels(profile), [profile]);
  const patch = (changes) => setProfile(normalizeProfile({ ...profile, ...changes }));

  const addSkill = () => {
    const name = skillDraft.trim();
    if (!name) return;
    patch({ skills: [...profile.skills, { skill_name: name, category_code: guessCategory(name), confidence: 'medium' }] });
    setSkillDraft('');
  };
  const removeSkill = (i) => patch({ skills: profile.skills.filter((_, idx) => idx !== i) });
  const setSkillCode = (i, code) =>
    patch({ skills: profile.skills.map((s, idx) => (idx === i ? { ...s, category_code: code } : s)) });

  const tags = (key) => (profile[key] || []).join(', ');
  const setTags = (key, value) => patch({ [key]: value.split(',').map((t) => t.trim()).filter(Boolean) });

  const onCv = async (file) => {
    if (!file) return;
    setStatus('Reading CV…');
    try {
      const text = await extractResumeText(file);
      setStatus('Extracting skills with Gemma…');
      const result = await extractSkills({ text, sourceType: 'resume', sourceFile: file.name });
      setResumeExtract({ ...result, source_text: text });
      const draft = toProfileDraft(result);
      // Merge: keep manual name/email, prefer résumé's richer skills/education.
      setProfile(
        normalizeProfile({
          ...profile,
          name: profile.name || draft.name,
          email: profile.email || draft.email,
          education: draft.education || profile.education,
          skills: [...profile.skills, ...draft.skills],
          internships: [...profile.internships, ...draft.internships],
          preferred_roles: [...profile.preferred_roles, ...draft.preferred_roles],
          certifications: [...profile.certifications, ...draft.certifications],
          hackathons: [...profile.hackathons, ...draft.hackathons],
          cv_file: draft.cv_file || profile.cv_file,
        })
      );
      setStatus(`Pre-filled from ${file.name} (${result.source})`);
    } catch (err) {
      setStatus(err?.message || 'Could not read that CV.');
    }
  };

  const onImport = async (file) => {
    if (!file) return;
    try {
      persistProfile(await importProfile(file));
      setStatus('Profile imported.');
    } catch {
      setStatus('Import failed — not a valid profile JSON.');
    }
  };

  const save = () => {
    persistProfile(profile);
    setStatus('Saved to this browser.');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name"><input className={inputCls} value={profile.name} onChange={(e) => patch({ name: e.target.value })} /></Field>
        <Field label="Email"><input className={inputCls} value={profile.email} onChange={(e) => patch({ email: e.target.value })} /></Field>
      </div>
      <Field label="Education"><textarea rows={2} className={inputCls} value={profile.education} onChange={(e) => patch({ education: e.target.value })} /></Field>

      <div>
        <span className="label-mono text-ink-faint">Skills</span>
        <div className="mt-1 flex gap-2">
          <input
            className={inputCls}
            placeholder="Add a skill and press Enter"
            value={skillDraft}
            onChange={(e) => setSkillDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
          />
          <button onClick={addSkill} className="shrink-0 rounded-lg border border-accent/30 px-3 text-sm text-accent transition hover:bg-accent/10">Add</button>
        </div>
        <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {profile.skills.map((s, i) => (
            <span key={`${s.category_code}-${s.skill_name}-${i}`} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-0.5 pl-2 pr-1 text-xs text-ink">
              <span className="h-2 w-2 rounded-full" style={{ background: CODE_COLOR[s.category_code] || '#94a3b8' }} />
              {s.skill_name}
              <select value={s.category_code} onChange={(e) => setSkillCode(i, e.target.value)} className="bg-transparent text-[10px] text-ink-faint outline-none">
                {CODES.map((c) => <option key={c} value={c} className="bg-surface">{c}</option>)}
              </select>
              <button onClick={() => removeSkill(i)} aria-label="Remove skill" className="grid h-4 w-4 place-items-center rounded-full text-ink-faint hover:text-neg">×</button>
            </span>
          ))}
          {profile.skills.length === 0 && <span className="text-xs text-ink-faint">No skills yet — add manually or upload a CV.</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hackathons"><input className={inputCls} placeholder="comma, separated" value={tags('hackathons')} onChange={(e) => setTags('hackathons', e.target.value)} /></Field>
        <Field label="Internships"><input className={inputCls} placeholder="comma, separated" value={tags('internships')} onChange={(e) => setTags('internships', e.target.value)} /></Field>
        <Field label="Certifications"><input className={inputCls} placeholder="comma, separated" value={tags('certifications')} onChange={(e) => setTags('certifications', e.target.value)} /></Field>
        <Field label="Preferred roles"><input className={inputCls} placeholder="comma, separated" value={tags('preferred_roles')} onChange={(e) => setTags('preferred_roles', e.target.value)} /></Field>
      </div>

      {/* Candidate spectrum preview */}
      <div className="grid place-items-center rounded-xl border border-white/8 bg-white/[0.02] py-2">
        <SpectrumRadar series={[{ key: 'me', levels, color: '#5EEAD4' }]} size={240} />
        <div className="label-mono pb-1 text-ink-faint">Your skill spectrum</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={save} className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition hover:bg-accent/20">Save profile</button>
        <button onClick={() => cvRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-ink-muted transition hover:text-ink">Upload CV</button>
        <button onClick={() => exportProfile(profile)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-ink-muted transition hover:text-ink">Export JSON</button>
        <button onClick={() => importRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-ink-muted transition hover:text-ink">Import JSON</button>
        {status && <span className="text-xs text-ink-faint">{status}</span>}
        <input ref={cvRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onCv(e.target.files?.[0])} />
        <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => onImport(e.target.files?.[0])} />
      </div>
    </div>
  );
}
