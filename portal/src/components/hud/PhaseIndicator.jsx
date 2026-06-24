import { PHASES, phaseIndexFor } from '../../lib/phases';

// Top-left monospaced phase counter: "01 / THE GALAXY".
export default function PhaseIndicator({ progress }) {
  const idx = phaseIndexFor(progress);
  const phase = PHASES[idx];
  const pct = Math.round(progress * 100);

  return (
    <div className="pointer-events-none absolute left-6 top-6 select-none">
      <div className="flex items-baseline gap-3 font-mono text-xs tracking-[0.3em]">
        <span className="text-accent">{phase.code}</span>
        <span className="text-ink-faint">/ {String(PHASES.length).padStart(2, '0')}</span>
      </div>

      <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink md:text-[34px] md:leading-none">
        {phase.label}
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">{phase.blurb}</p>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px w-40 overflow-hidden bg-white/10">
          <div
            className="h-px bg-accent transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="tnum font-mono text-[10px] text-ink-faint">{pct}%</span>
      </div>
    </div>
  );
}
