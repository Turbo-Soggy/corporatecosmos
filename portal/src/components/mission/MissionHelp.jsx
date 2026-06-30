const COMMANDS = [
  { command: '/help', description: 'Show available Mission Control commands.' },
  { command: '/clear', description: 'Clear the active mission, highlights, and brief.' },
  { command: 'Compare Apple and Microsoft', description: 'Compare companies that exist in the dataset.' },
  { command: 'Show Indian companies', description: 'Highlight a geographic cohort.' },
  { command: 'Find companies like Microsoft', description: 'Map similar peer bodies.' },
  { command: 'Explain Apple', description: 'Focus a company and produce a mission scan.' },
  { command: 'Check data quality', description: 'Scan inferred and confirmed telemetry.' },
  { command: 'Tell me the dashboard story', description: 'Open the analytics view with a dataset brief.' },
];

export default function MissionHelp({ onChoose }) {
  return (
    <section className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
      <div className="label-mono text-accent/80">COMMANDS</div>
      <div className="mt-2 divide-y divide-white/[0.06]">
        {COMMANDS.map((item) => (
          <button
            key={item.command}
            onClick={() => onChoose(item.command)}
            className="flex w-full gap-3 py-2 text-left transition hover:text-accent"
          >
            <span className="w-36 shrink-0 font-mono text-[11px] text-ink">{item.command}</span>
            <span className="text-xs leading-relaxed text-ink-muted">{item.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
