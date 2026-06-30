export default function MissionBrief({ mission }) {
  if (!mission) return null;
  return (
    <section className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="label-mono text-accent/80">{mission.narrativeSource === 'gemma' ? 'GEMMA BRIEF' : 'LOCAL BRIEF'}</div>
      <h3 className="mt-1 text-sm font-semibold leading-snug text-ink">{mission.title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{mission.summary}</p>
      {mission.bullets?.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {mission.bullets.slice(0, 3).map((bullet, index) => (
            <li key={index} className="flex gap-2 text-xs leading-relaxed text-ink-muted">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent/80" aria-hidden="true" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
      {mission.confidence?.warnings?.length > 0 && (
        <div className="mt-2 rounded-md border border-amber-300/20 bg-amber-300/[0.06] px-2 py-1.5 text-[11px] leading-relaxed text-amber-100/75">
          {mission.confidence.warnings[0]}
        </div>
      )}
    </section>
  );
}
