function StatusDot({ status }) {
  const cls = status === 'running' ? 'bg-accent shadow-[0_0_16px_rgba(94,234,212,0.7)]' : 'bg-pos/80';
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${cls}`} aria-hidden="true" />;
}

export default function AgentActivityRow({ agent }) {
  return (
    <li className="flex gap-2.5 py-2">
      <StatusDot status={agent.status} />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink">{agent.name}</span>
          <span className="label-mono !tracking-normal text-ink-faint">{agent.status}</span>
        </div>
        {agent.finding && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{agent.finding}</p>}
      </div>
    </li>
  );
}
