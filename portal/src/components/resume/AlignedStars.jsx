import { useMemo } from 'react';
import { sectorColor } from '../../lib/sectors';

// Results drawer (left side, mirroring the right-side CompanyPanel). Shows the
// parsed "profile signature", a launch-sequence CTA, and the ranked compatible
// companies with an alignment bar + reasons. Clicking a row flies to that star.
export default function AlignedStars({
  resume,
  selected,
  onSelect,
  onStartTour,
  onReplace,
  onClear,
}) {
  const open = Boolean(resume);
  const { profile, compatible } = useMemo(() => {
    if (!resume) return { profile: null, compatible: [] };
    return { profile: resume.profile, compatible: resume.ranked.filter((r) => r.compatible) };
  }, [resume]);

  return (
    <div
      aria-hidden={!open}
      className={`pointer-events-auto absolute left-0 top-0 h-full w-full max-w-sm transform transition-transform duration-500 ease-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="cosmos-scroll glass-strong relative h-full overflow-y-auto border-r">
        <div className="pointer-events-none sticky top-0 -mb-[100vh] h-full w-full bg-gradient-to-r from-canvas/55 via-canvas/25 to-transparent" />
        {resume && (
          <div className="relative p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="label-mono text-accent/80">Your Constellation</div>
                <h2 className="mt-1.5 font-display text-2xl font-semibold leading-tight text-ink">
                  Aligned Stars
                </h2>
                {resume.fileName && (
                  <p className="mt-1 truncate text-sm text-ink-muted">{resume.fileName}</p>
                )}
              </div>
              <button
                onClick={onClear}
                aria-label="Clear résumé match"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Profile signature */}
            <section className="mt-6">
              <h3 className="label-mono">Profile Signature</h3>
              {profile?.topSectors?.length ? (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {profile.topSectors.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-ink"
                    >
                      <span className="h-2 w-2 rounded-full" style={{ background: sectorColor(s) }} />
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-ink-muted">No strong sector signal detected.</p>
              )}
              {profile?.detectedSkills?.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                  {profile.detectedSkills.slice(0, 12).join(' · ')}
                </p>
              )}
              {profile?.weak && (
                <p className="mt-3 text-xs leading-relaxed text-neg/90">
                  Weak signal — matches below are best-effort. A more detailed résumé sharpens them.
                </p>
              )}
            </section>

            {/* Launch sequence CTA */}
            {compatible.length > 0 && (
              <button
                onClick={onStartTour}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-medium text-accent outline-none transition hover:bg-accent/20 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" opacity="0" /><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.7L5 21.4 7.3 14 1 9.4h7.6z" /></svg>
                Begin launch sequence
              </button>
            )}

            {/* Ranked matches */}
            <section className="mt-7">
              <div className="flex items-baseline justify-between">
                <h3 className="label-mono">Compatible Companies</h3>
                <span className="label-mono text-ink-faint">{compatible.length}</span>
              </div>

              {compatible.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">No strong matches found.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {compatible.map((r, i) => {
                    const hue = sectorColor(r.sector);
                    const isActive = selected === r.index;
                    return (
                      <li key={r.index} className="animate-rowIn" style={{ animationDelay: `${i * 35}ms` }}>
                        <button
                          onClick={() => onSelect(r.index)}
                          className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                            isActive ? 'border-accent/50 bg-accent/[0.07]' : 'border-white/8 bg-white/[0.02] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-7 w-7 shrink-0 place-items-center font-mono text-[11px] text-ink-faint">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hue, boxShadow: `0 0 8px ${hue}` }} />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.name}</span>
                            <span className="tnum shrink-0 font-mono text-sm" style={{ color: hue }}>{r.alignment}%</span>
                          </div>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                            <div className="h-full rounded-full" style={{ width: `${Math.max(6, r.alignment)}%`, background: hue }} />
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-ink-muted">{r.reasons.join(' · ')}</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <button
              onClick={onReplace}
              className="label-mono mt-7 flex items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-3.5 py-2 !tracking-normal text-ink-muted outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
              Scan a different résumé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
