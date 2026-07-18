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
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);

  const candLevels = useMemo(() => categoryLevels(profile), [profile]);
  const demand = useMemo(() => jdDemandLevels(jd), [jd]);

  // Recompute the match whenever the JD or the candidate changes.
  useEffect(() => {
    if (!jd) { setResult(null); return; }
    let cancelled = false;
    setBusy('Matching…');
    matchSkillsSmart(profile.skills, jd).then((r) => {
      if (!cancelled) { setResult(r); setBusy(''); }
    });
    return () => { cancelled = true; };
  }, [jd, profile]);

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
        <button onClick={() => jdRef.current?.click()} className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm text-ink-muted transition hover:text-ink">
          {jd ? 'Change JD' : 'Upload JD'}
        </button>
        <input ref={jdRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => onJd(e.target.files?.[0])} />
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
