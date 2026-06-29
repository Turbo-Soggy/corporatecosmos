import { useMemo, useRef, useState } from 'react';
import { sectorColor } from '../../lib/sectors';
import ComparisonComposition from '../intro/ComparisonComposition';
import RemotionOverlayPlayer from '../intro/RemotionOverlayPlayer';

function summary(company) {
  return {
    name: company.short_name || company.name,
    sector: company.sector,
    color: sectorColor(company.sector),
    valuation: company.display.valuation,
    growth: company.display.yoy_growth_rate,
    employees: company.display.employee_size,
    profitability: company.profitability_status,
  };
}

export default function CompanyComparison({ companies }) {
  const [leftIndex, setLeftIndex] = useState(0);
  const [rightIndex, setRightIndex] = useState(Math.min(1, companies.length - 1));
  const [playing, setPlaying] = useState(null);
  const idRef = useRef(0);
  const options = useMemo(
    () => companies.map((company, index) => ({ index, name: company.short_name || company.name })),
    [companies]
  );

  const play = () => {
    if (leftIndex === rightIndex) return;
    idRef.current += 1;
    setPlaying({
      id: idRef.current,
      left: summary(companies[leftIndex]),
      right: summary(companies[rightIndex]),
    });
  };

  return (
    <>
      <section className="glass p-6">
        <div className="label-mono text-accent/80">ANIMATED COMPARISON</div>
        <div className="mt-4 grid items-end gap-3 md:grid-cols-[1fr_auto_1fr_auto]">
          <label className="text-xs text-ink-muted">
            Company A
            <select value={leftIndex} onChange={(event) => setLeftIndex(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-white/10 bg-surface-light px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/50">
              {options.map((option) => <option key={option.index} value={option.index}>{option.name}</option>)}
            </select>
          </label>
          <div className="pb-2 text-center font-mono text-xs text-ink-faint">VS</div>
          <label className="text-xs text-ink-muted">
            Company B
            <select value={rightIndex} onChange={(event) => setRightIndex(Number(event.target.value))} className="mt-1.5 w-full rounded-lg border border-white/10 bg-surface-light px-3 py-2.5 text-sm text-ink outline-none focus:border-accent/50">
              {options.map((option) => <option key={option.index} value={option.index}>{option.name}</option>)}
            </select>
          </label>
          <button onClick={play} disabled={leftIndex === rightIndex} className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40">
            Play comparison
          </button>
        </div>
      </section>

      {playing && (
        <RemotionOverlayPlayer
          key={playing.id}
          component={ComparisonComposition}
          inputProps={{ left: playing.left, right: playing.right }}
          durationInFrames={120}
          onEnded={() => setPlaying(null)}
          zIndex={40}
          blockInteraction
        />
      )}
    </>
  );
}
