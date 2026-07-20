import { useMemo } from 'react';
import { RADIX_CATEGORIES } from '../../lib/radix';
import { runJdReadiness } from '../../lib/talentCheck';
import SpectrumRadar from './SpectrumRadar';

const LABEL = Object.fromEntries(RADIX_CATEGORIES.map((c) => [c.code, c.label]));
const COLOR = Object.fromEntries(RADIX_CATEGORIES.map((c) => [c.code, c.color]));

function scoreColor(score) {
  if (score >= 70) return '#5EEAD4';
  if (score >= 40) return '#FBBF24';
  return '#FB7185';
}

function Dial({ score }) {
  const R = 42;
  const circ = 2 * Math.PI * R;
  const color = scoreColor(score);
  return (
    <svg viewBox="0 0 110 110" width="120" height="120" aria-label={`Resume readiness ${score}%`}>
      <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(148,163,184,0.15)" strokeWidth="8" />
      <circle
        cx="55" cy="55" r={R} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        transform="rotate(-90 55 55)"
      />
      <text x="55" y="52" textAnchor="middle" fill="#E6EDF7" fontSize="26" fontFamily='"Space Grotesk", sans-serif' fontWeight="600">{score}</text>
      <text x="55" y="70" textAnchor="middle" fill="#64748B" fontSize="9" fontFamily='"JetBrains Mono", monospace' letterSpacing="2">READY</text>
    </svg>
  );
}

export default function ReadinessScan({ profile, resume, jd }) {
  const candidate = resume || profile;
  const result = useMemo(() => runJdReadiness(candidate, jd), [candidate, jd]);

  const series = useMemo(() => {
    if (!result) return [];
    const candidateLevels = {};
    const requiredLevels = {};
    for (const gap of result.skillset_gap) {
      candidateLevels[gap.category_code] = gap.candidate_level;
      requiredLevels[gap.category_code] = gap.required_level;
    }
    return [
      { key: 'required', levels: requiredLevels, color: '#FBBF24', fillOpacity: 0.08 },
      { key: 'candidate', levels: candidateLevels, color: '#5EEAD4', fillOpacity: 0.18 },
    ];
  }, [result]);

  if (!jd || !resume) {
    return (
      <div className="space-y-4">
        <div>
          <div className="label-mono text-accent/80">RESUME READINESS</div>
          <h3 className="mt-1 text-lg font-semibold text-ink">Ready for the uploaded job?</h3>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">This tab uses the same JD and resume from the fit analysis. Upload both there first, then return here for the per-skillset readiness view.</p>
        </div>
        <div className="rounded-lg border border-dashed border-white/15 px-4 py-8 text-center">
          <div className="text-sm font-medium text-ink">Waiting for shared inputs</div>
          <p className="mt-1 text-xs text-ink-muted">{jd ? 'Upload a resume in JD + Resume Fit.' : resume ? 'Upload a JD in JD + Resume Fit.' : 'Upload a JD and resume in JD + Resume Fit.'}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return <p className="text-sm text-ink-muted">The uploaded JD did not contain readable RADIX requirements yet. Re-upload it from JD + Resume Fit.</p>;
  }

  const belowBar = result.skillset_gap.filter((gap) => gap.gap);
  const requested = result.skillset_gap.filter((gap) => gap.required_level > 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="label-mono text-accent/80">RESUME READINESS</div>
        <h3 className="mt-1 truncate text-lg font-semibold text-ink">Fit for {result.role || jd.source_file || 'uploaded job'}</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">Scores are calculated from the uploaded JD requirements and the uploaded resume evidence. No company preset is used.</p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.02] px-3 py-2 text-xs">
        <span className="min-w-0 truncate text-ink-muted">JD: <span className="text-ink">{jd.source_file || 'uploaded posting'}</span></span>
        <span className="shrink-0 font-mono text-ink-faint">{result.requirement_count} requirements</span>
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-around">
        <SpectrumRadar series={series} size={230} />
        <div className="flex flex-col items-center">
          <Dial score={result.readiness_score} />
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> resume</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-300" /> JD need</span>
          </div>
        </div>
      </div>

      <div>
        <div className="label-mono mb-2 flex items-center justify-between text-ink-faint">
          <span>Per-skillset readiness</span>
          <span>{belowBar.length} below JD need</span>
        </div>
        <ul className="space-y-1.5">
          {result.skillset_gap.map((gap, i) => (
            <li key={gap.category_code} className={`animate-rowIn ${gap.required_level === 0 ? 'opacity-45' : ''}`} style={{ animationDelay: `${i * 25}ms` }}>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 font-mono" style={{ color: COLOR[gap.category_code] }}>{gap.category_code}</span>
                <span className="w-40 shrink-0 truncate text-ink-muted">{LABEL[gap.category_code]}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  {gap.required_level > 0 && <div className="absolute top-0 h-full w-0.5 bg-amber-300/80" style={{ left: `${gap.required_level * 10}%` }} />}
                  <div className="h-full rounded-full" style={{ width: `${gap.candidate_level * 10}%`, background: gap.gap ? '#FB7185' : '#5EEAD4' }} />
                </div>
                <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink-faint">{gap.required_level ? `${gap.candidate_level}/${gap.required_level}` : '—'}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <section className="rounded-lg border border-amber-300/15 bg-amber-300/[0.04] px-3 py-3">
        <div className="label-mono text-amber-200/90">READ THIS FIRST</div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
          {belowBar.length === 0
            ? `The resume meets the derived JD need across all ${requested.length} requested skillsets.`
            : `${belowBar.length} of ${requested.length} requested skillsets are below the JD need. Open JD + Resume Fit for the exact missing requirements and suggested next steps.`}
        </p>
      </section>

      <section>
        <div className="label-mono mb-2 text-neg/90">Missing JD requirements ({result.missing_skills.length})</div>
        <div className="flex flex-wrap gap-1.5">
          {result.missing_skills.length === 0 && <span className="text-xs text-ink-faint">No extracted requirements are currently uncovered.</span>}
          {result.missing_skills.map((skill, i) => <span key={`${skill}-${i}`} className="rounded-full border border-neg/25 bg-neg/10 px-2.5 py-0.5 text-xs text-neg">{skill}</span>)}
        </div>
      </section>
    </div>
  );
}
