import AgentActivityRow from './AgentActivityRow';

export default function MissionTimeline({ running, agents }) {
  const activity = running
    ? [
        { name: 'Mission Orchestrator', status: 'running', finding: 'Parsing command and routing local agents.' },
        { name: 'Gemma Core', status: 'running', finding: 'Attempting local intent and briefing support.' },
        { name: 'Deterministic Agents', status: 'running', finding: 'Preparing factual calculations.' },
      ]
    : agents || [];

  if (!activity.length) return null;

  return (
    <ul className="mt-3 divide-y divide-white/[0.06]">
      {activity.slice(0, 6).map((agent, index) => (
        <AgentActivityRow key={`${agent.name}-${index}`} agent={agent} />
      ))}
    </ul>
  );
}
