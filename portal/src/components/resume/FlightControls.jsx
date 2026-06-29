import { useMemo } from 'react';
import { sectorColor } from '../../lib/sectors';

// Bottom-center "mission bar" shown during the launch sequence. Reads the current
// stop from the tour state and the matched company's details from the résumé
// ranking. Prev/Next scrub the tour; Exit hands control back to free exploration.
export default function FlightControls({ tour, resume }) {
  const byIndex = useMemo(() => {
    const m = new Map();
    if (resume) for (const r of resume.ranked) m.set(r.index, r);
    return m;
  }, [resume]);

  if (!tour.active || tour.currentIndex == null) return null;

  const current = byIndex.get(tour.currentIndex);
  const hue = current ? sectorColor(current.sector) : '#5eead4';

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 -translate-x-1/2">
      <div className="glass flex items-center gap-4 px-4 py-2.5">
        <div className="label-mono whitespace-nowrap text-accent/80">
          Launch {String(tour.pos + 1).padStart(2, '0')} / {String(tour.total).padStart(2, '0')}
        </div>

        <div className="h-8 w-px bg-white/10" />

        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: hue, boxShadow: `0 0 8px ${hue}` }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-ink">{current?.name ?? '—'}</span>
              {current && <span className="tnum shrink-0 font-mono text-xs" style={{ color: hue }}>{current.alignment}%</span>}
            </div>
            {current && (
              <p className="max-w-[16rem] truncate text-xs text-ink-muted">{current.reasons[0]}</p>
            )}
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-1">
          <button
            onClick={tour.prev}
            disabled={tour.pos <= 0}
            aria-label="Previous stop"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <button
            onClick={tour.next}
            disabled={tour.atEnd}
            aria-label="Next stop"
            className="grid h-8 w-8 place-items-center rounded-full text-ink-muted outline-none transition hover:bg-white/10 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </button>
          <button
            onClick={tour.exit}
            className="label-mono ml-1 rounded-full border border-white/10 px-3 py-1.5 !tracking-normal text-ink-muted outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
