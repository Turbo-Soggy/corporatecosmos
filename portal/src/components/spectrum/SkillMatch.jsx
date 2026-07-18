import { useEffect, useMemo, useRef, useState } from 'react';
import { RADIX_CATEGORIES } from '../../lib/radix';
import { categoryLevels } from '../../lib/radixProfile';
import { extractSkills } from '../../agents/skillExtractionAgent';
import { matchSkillsSmart } from '../../agents/skillMatchAgent';
import { extractResumeText } from '../../lib/resumeParse';
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

export default function SkillMatch({ profile, jd, setJd }) {
  const jdRef = useRef(null);
  const resumeRef = useRef(null);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [resume, setResume] = useState(null);

  const candLevels = useMemo(() => categoryLevels(profile), [profile]);
  const demand = useMemo(() => jdDemandLevels(jd), [jd]);
  const candidate = resume || profile;

  // Recompute the match whenever the JD or the candidate changes.
  useEffect(() => {
    if (!jd) { setResult(null); return; }
    let cancelled = false;
    setBusy('Matching…');
    matchSkillsSmart(candidate.skills, jd).then((r) => {
      if (!cancelled) { setResult(r); setBusy(''); }
    });
    return () => { cancelled = true; };
  }, [candidate, jd]);

  const onJd = async (file) => {
    if (!file) return;
    setBusy('Reading JD…');
    try {
      const text = await extractResumeText(file);
      setBusy('Extracting JD skills with Gemma…');
      setJd(await extractSkills({ text, sourceType: 'jd', sourceFile: file.name }));
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
      setResume(await extractSkills({ text, sourceType: 'resume', sourceFile: file.name }));
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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm text-ink-muted">
          {jd ? <>JD: <span className="text-ink">{jd.source_file || 'uploaded posting'}</span></> : 'Upload a job posting to match against.'}
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => jdRef.current?.click()} className="rounded-lg border border-amber-300/25 px-3 py-1.5 text-sm text-amber-200 transition hover:bg-amber-300/10">
            {jd ? 'Change JD' : 'Upload JD'}
          </button>
          <button onClick={() => resumeRef.current?.click()} className="rounded-lg border border-accent/25 px-3 py-1.5 text-sm text-accent transition hover:bg-accent/10">
            {resume ? 'Change resume' : 'Upload resume'}
          </button>
        </div>
        <input ref={jdRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onJd(e.target.files?.[0])} />
        <input ref={resumeRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onResume(e.target.files?.[0])} />
      </div>

      <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-ink-muted">
        Comparing <span className="text-ink">{resume?.source_file || 'saved profile'}</span> against <span className="text-ink">{jd?.source_file || 'no JD uploaded'}</span>. The score is weighted JD-skill coverage; it is a coaching signal, not a hiring decision.
      </div>

      {busy && <div className="label-mono animate-pulse text-accent/80">{busy}</div>}

      {jd && result && (
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
              <h3 id="match-development-title" className="label-mono mb-2 text-amber-200/90">Development areas ({result.development_areas.length})</h3>
              <div className="space-y-2">
                {result.development_areas.map((item, i) => (
                  <div key={`${item.skill}-${i}`} className="rounded-md border border-amber-300/15 bg-amber-300/[0.04] px-3 py-2">
                    <div className="text-sm font-medium text-ink">{item.skill}</div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{item.action || 'Add truthful evidence of this requirement through a project, course, or measurable work example.'}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
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
