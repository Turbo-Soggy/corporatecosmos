import { useMemo, useState } from 'react';
import { RADIX_CATEGORIES } from '../../lib/radix';
import { runTalentCheck } from '../../lib/talentCheck';
import { companiesWithBar } from '../../lib/companyBar';
import SpectrumRadar from './SpectrumRadar';

const LABEL = Object.fromEntries(RADIX_CATEGORIES.map((c) => [c.code, c.label]));
const COLOR = Object.fromEntries(RADIX_CATEGORIES.map((c) => [c.code, c.color]));

function cosmosCompanyName(companies, selected) {
  const c = selected != null ? companies?.[selected] : null;
  return c ? c.short_name || c.name : null;
}

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
    <svg viewBox="0 0 110 110" width="120" height="120" aria-label={`Readiness ${score}%`}>
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

export default function ReadinessScan({ profile, companies, selected }) {
  const bars = useMemo(() => companiesWithBar(), []);
  const cosmosName = cosmosCompanyName(companies, selected);
  const [override, setOverride] = useState('');
  const company = override || cosmosName || bars[0];

  const result = useMemo(() => runTalentCheck(profile, company), [profile, company]);

  const series = useMemo(() => {
    if (!result) return [];
    const cand = {};
    const req = {};
    for (const g of result.skillset_gap) {
      cand[g.category_code] = g.candidate_level;
      req[g.category_code] = g.required_level;
    }
    return [
      { key: 'required', levels: req, color: '#FBBF24', fillOpacity: 0.08 },
      { key: 'candidate', levels: cand, color: '#5EEAD4', fillOpacity: 0.18 },
    ];
  }, [result]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-ink-muted">
          Company:{' '}
          <select value={company} onChange={(e) => setOverride(e.target.value)} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-sm text-ink outline-none">
            {[...new Set([cosmosName, ...bars].filter(Boolean))].map((name) => (
              <option key={name} value={name} className="bg-surface">{name}</option>
            ))}
          </select>
        </div>
        {cosmosName && !override && <span className="label-mono text-accent/70">from selected node</span>}
      </div>

      {!result ? (
        <p className="text-sm text-ink-muted">
          No expected skillset bar for “{company}”. Pick Google, Microsoft, or OFSS (or select one of those nodes in the cosmos).
        </p>
      ) : (
        <>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-around">
            <SpectrumRadar series={series} size={230} />
            <div className="flex flex-col items-center">
              <Dial score={result.readiness_score} />
              <div className="mt-1 flex items-center gap-3 text-xs text-ink-faint">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> you</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: '#FBBF24' }} /> {company} bar</span>
              </div>
            </div>
          </div>

          <div>
            <div className="label-mono mb-2 flex items-center justify-between text-ink-faint">
              <span>Per-skillset gap</span>
              <span>{result.skillset_gap.filter((g) => g.gap).length} below bar</span>
            </div>
            <ul className="space-y-1.5">
              {result.skillset_gap.map((g, i) => (
                <li key={g.category_code} className="animate-rowIn" style={{ animationDelay: `${i * 25}ms` }}>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-8 shrink-0 font-mono" style={{ color: COLOR[g.category_code] }}>{g.category_code}</span>
                    <span className="w-40 shrink-0 truncate text-ink-muted">{LABEL[g.category_code]}</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      {/* required marker */}
                      <div className="absolute top-0 h-full w-0.5 bg-amber-300/80" style={{ left: `${g.required_level * 10}%` }} />
                      {/* candidate fill */}
                      <div className="h-full rounded-full" style={{ width: `${g.candidate_level * 10}%`, background: g.gap ? '#FB7185' : '#5EEAD4' }} />
                    </div>
                    <span className="w-10 shrink-0 text-right font-mono tabular-nums text-ink-faint">{g.candidate_level}/{g.required_level}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
