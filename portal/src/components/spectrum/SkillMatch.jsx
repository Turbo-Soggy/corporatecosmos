import { useEffect, useMemo, useRef, useState } from 'react';
import { RADIX_CATEGORIES } from '../../lib/radix';
import { categoryLevels } from '../../lib/radixProfile';
import { extractSkills } from '../../agents/skillExtractionAgent';
import { matchSkillsSmart } from '../../agents/skillMatchAgent';
import { generateTargetedCv } from '../../agents/cvGenerationAgent';
import { extractResumeText } from '../../lib/resumeParse';
import { downloadTargetedCv } from '../../lib/cvExport';
import SpectrumRadar from './SpectrumRadar';

// Turn a JD's skill list into a rough 0..10 "demand" per category (by count) for the
// overlay radar — the JD side has no levels, only presence.
function jdDemandLevels(jd) {
  const levels = {};
  for (const s of jd?.skills || []) {
    levels[s.category_code] = Math.min(10, (levels[s.category_code] || 0) + 4);
  }
  return levels;
}

export default function SkillMatch({ profile, jd, setJd, resume, setResume }) {
  const jdRef = useRef(null);
  const resumeRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [cvDraft, setCvDraft] = useState(null);
  const [cvBusy, setCvBusy] = useState(false);

  const candidate = resume;
  const candLevels = useMemo(() => categoryLevels(candidate || profile), [candidate, profile]);
  const demand = useMemo(() => jdDemandLevels(jd), [jd]);

  // Recompute the match whenever the JD or the candidate changes.
  useEffect(() => {
    if (!jd || !candidate) { setResult(null); return; }
    let cancelled = false;
    setBusy('Matching…');
    matchSkillsSmart(candidate, jd).then((r) => {
      if (!cancelled) { setResult(r); setBusy(''); }
    });
    return () => { cancelled = true; };
  }, [candidate, jd]);

  useEffect(() => {
    setCvDraft(null);
  }, [candidate, jd]);

  const generateCv = async () => {
    if (!jd || !candidate || !result || cvBusy) return;
    setCvBusy(true);
    const draft = await generateTargetedCv({ resume: candidate, profile, jd, match: result });
    setCvDraft(draft);
    setCvBusy(false);
  };

  const onJd = async (file) => {
    if (!file) return;
    setBusy('Reading JD…');
    try {
      const text = await extractResumeText(file);
      setBusy('Extracting JD skills with Gemma…');
      const extracted = await extractSkills({ text, sourceType: 'jd', sourceFile: file.name });
      setJd({ ...extracted, source_text: text });
      setBusy('');
    } catch (err) {
      setBusy(err?.message || 'Could not read that JD.');
    }
  };

  const onResume = async (file) => {
    if (!file) return;
    setBusy('Reading resume…');
    try {
      const text = await extractResumeText(file);
      setBusy('Extracting resume skills with Gemma…');
      const extracted = await extractSkills({ text, sourceType: 'resume', sourceFile: file.name });
      setResume({ ...extracted, source_text: text });
      setBusy('');
    } catch (err) {
      setBusy(err?.message || 'Could not read that resume.');
    }
  };

  const series = [
    { key: 'jd', levels: demand, color: '#FBBF24', fillOpacity: 0.08 },
    { key: 'me', levels: candLevels, color: '#5EEAD4', fillOpacity: 0.16 },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="label-mono text-accent/80">FIT ANALYSIS</div>
        <h3 className="mt-1 text-lg font-semibold text-ink">How well does this resume fit the job?</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">Upload both documents. Gemma4 compares the job requirements with the resume evidence, then explains strengths, gaps, and practical next steps.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => jdRef.current?.click()} className={`rounded-lg border px-3 py-3 text-left transition hover:bg-amber-300/10 ${jd ? 'border-amber-300/30 bg-amber-300/[0.05]' : 'border-white/10'}`}>
          <span className="label-mono text-amber-200/80">1 · JOB DESCRIPTION</span>
          <span className="mt-1 block truncate text-sm font-medium text-ink">{jd?.source_file || 'Upload JD'}</span>
          <span className="mt-1 block text-xs text-ink-faint">PDF or DOCX</span>
        </button>
        <button type="button" onClick={() => resumeRef.current?.click()} className={`rounded-lg border px-3 py-3 text-left transition hover:bg-accent/10 ${resume ? 'border-accent/30 bg-accent/[0.05]' : 'border-white/10'}`}>
          <span className="label-mono text-accent/80">2 · RESUME</span>
          <span className="mt-1 block truncate text-sm font-medium text-ink">{resume?.source_file || 'Upload resume'}</span>
          <span className="mt-1 block text-xs text-ink-faint">PDF or DOCX</span>
        </button>
        <input ref={jdRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onJd(e.target.files?.[0])} />
        <input ref={resumeRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onResume(e.target.files?.[0])} />
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-ink-muted">
        {jd && resume
          ? <>Comparing <span className="text-ink">{resume.source_file}</span> against <span className="text-ink">{jd.source_file}</span>. The score is weighted requirement coverage, not a hiring decision.</>
          : 'Add both files to generate the fit analysis.'}
      </div>

      {busy && <div className="label-mono animate-pulse text-accent/80">{busy}</div>}

      {!jd || !resume ? (
        <div className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center">
          <div className="text-sm font-medium text-ink">Waiting for both documents</div>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">The report will appear here after the JD and resume have been extracted.</p>
        </div>
      ) : result && (
        <>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-around">
            <SpectrumRadar series={series} size={230} />
            <div className="text-center">
              <div className="font-display text-4xl font-semibold text-ink">{result.match_score}<span className="text-xl text-ink-faint">%</span></div>
              <div className="label-mono mt-1 text-ink-faint">match · {result.source}</div>
              <div className="mt-1 text-xs text-ink-muted">{result.matched_skills.length} matched · {result.missing_skills.length} missing</div>
            </div>
          </div>

          <section className="rounded-lg border border-accent/15 bg-accent/[0.04] px-3 py-3" aria-labelledby="match-summary-title">
            <h3 id="match-summary-title" className="label-mono text-accent/90">What this means</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{result.summary || 'The score reflects overlap between extracted resume skills and extracted JD requirements.'}</p>
            <p className="mt-2 text-[11px] text-ink-faint">{result.source === 'gemma' ? 'Gemma reviewed aliases and produced the coaching notes.' : 'Local matching produced this report because Gemma was unavailable or returned an unusable response.'}</p>
          </section>

          {result.strengths?.length > 0 && (
            <section aria-labelledby="match-strengths-title">
              <h3 id="match-strengths-title" className="label-mono mb-2 text-accent/80">Strengths to lead with ({result.strengths.length})</h3>
              <div className="space-y-2">
                {result.strengths.map((item, i) => (
                  <div key={`${item.skill}-${i}`} className="rounded-md border border-accent/15 bg-accent/[0.04] px-3 py-2">
                    <div className="text-sm font-medium text-ink">{item.skill}</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.why || item.evidence || 'This requirement is supported by the uploaded resume.'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gap list first — the point of the tool, per the brief. */}
          <div>
            <div className="label-mono mb-2 text-neg/90">Missing ({result.missing_skills.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {result.missing_skills.length === 0 && <span className="text-xs text-ink-faint">Nothing missing — full coverage.</span>}
              {result.missing_skills.map((s, i) => (
                <span key={`m-${s}-${i}`} className="rounded-full border border-neg/25 bg-neg/10 px-2.5 py-0.5 text-xs text-neg">{s}</span>
              ))}
            </div>
          </div>
          {result.development_areas?.length > 0 && (
            <section aria-labelledby="match-development-title">
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h3 id="match-development-title" className="label-mono text-amber-200/90">Development areas ({result.development_areas.length})</h3>
                <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink-faint">{result.source === 'gemma' ? 'Gemma4 coaching' : 'Evidence baseline'}</span>
              </div>
              <div className="space-y-2">
                {result.development_areas.map((item, i) => (
                  <div key={`${item.skill}-${i}`} className="rounded-md border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2">
                    <div className="text-sm font-medium text-ink">{item.skill}</div>
                    {item.why && <p className="mt-1 text-xs leading-relaxed text-ink-muted"><span className="font-medium text-ink/80">Why it matters: </span>{item.why}</p>}
                    <p className="mt-2 text-xs leading-relaxed text-ink-muted"><span className="font-medium text-ink/80">Next evidence: </span>{item.action || 'Add truthful evidence of this requirement through a project, course, or measurable work example.'}</p>
                    {item.proof_plan && <p className="mt-1 text-xs leading-relaxed text-ink-muted"><span className="font-medium text-ink/80">Proof idea: </span>{item.proof_plan}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="rounded-lg border border-accent/20 bg-accent/[0.04] px-3 py-3" aria-labelledby="cv-generator-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="cv-generator-title" className="label-mono text-accent/90">Company-specific CV</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">Generate a truthful CV draft tailored to {jd.company || jd.role || 'this job'}. It uses resume evidence and prioritizes supported JD requirements.</p>
              </div>
              <button type="button" onClick={generateCv} disabled={cvBusy} className="shrink-0 rounded-md border border-accent/30 px-2.5 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:cursor-wait disabled:opacity-50">
                {cvBusy ? 'Generating…' : cvDraft ? 'Regenerate' : 'Generate CV'}
              </button>
            </div>
            {cvDraft && (
              <div className="mt-3 rounded-md border border-white/10 bg-canvas/35 px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{cvDraft.name || 'Targeted CV'}</div>
                    <div className="mt-1 truncate text-xs text-ink-muted">{cvDraft.target_role}{cvDraft.target_company ? ` at ${cvDraft.target_company}` : ''}</div>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] uppercase text-ink-faint">{cvDraft.source === 'gemma' ? 'Gemma4 draft' : 'Local draft'}</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">{cvDraft.summary}</p>
                {cvDraft.source === 'local' && <p className="mt-2 text-[11px] text-amber-200/80">Gemma4 was unavailable for this draft, so only locally extracted evidence was used. Reconnect Gemma4 for fuller tailoring.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => downloadTargetedCv(cvDraft, 'doc')} className="rounded-md border border-accent/30 px-2.5 py-1.5 text-xs text-accent transition hover:bg-accent/10">Download Word CV</button>
                  <button type="button" onClick={() => downloadTargetedCv(cvDraft, 'txt')} className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-ink-muted transition hover:text-ink">Download text</button>
                </div>
              </div>
            )}
          </section>
          <div>
            <div className="label-mono mb-2 text-accent/80">Matched ({result.matched_skills.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {result.matched_skills.map((s, i) => (
                <span key={`ok-${s}-${i}`} className="rounded-full border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs text-accent">{s}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
