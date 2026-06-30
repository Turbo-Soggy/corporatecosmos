import { useEffect, useMemo, useState } from 'react';
import { checkOllamaHealth } from '../../agents/ollamaClient';
import { runMission } from '../../agents/orchestrator';
import { DEFAULT_OLLAMA_MODEL } from '../../agents/missionTypes';
import { companyName } from '../../agents/missionActions';
import MissionInput from './MissionInput';
import MissionTimeline from './MissionTimeline';
import MissionBrief from './MissionBrief';
import MissionSuggestions from './MissionSuggestions';
import MissionHelp from './MissionHelp';

function SparkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v5" />
      <path d="M12 17v5" />
      <path d="M4.9 4.9 8.4 8.4" />
      <path d="m15.6 15.6 3.5 3.5" />
      <path d="M2 12h5" />
      <path d="M17 12h5" />
      <path d="m4.9 19.1 3.5-3.5" />
      <path d="m15.6 8.4 3.5-3.5" />
    </svg>
  );
}

function defaultSuggestions(selectedCompany, view) {
  if (selectedCompany) {
    const name = companyName(selectedCompany);
    return [`Explain ${name}`, `Find companies like ${name}`, `Compare ${name} and Apple`, 'Run data quality scan'];
  }
  if (view === 'dashboard') {
    return ['Tell me the dashboard story', 'Find outliers', 'Run data quality scan', 'Show top valuation bodies'];
  }
  return ['Show Indian companies', 'Compare Apple and Tesla', 'Find companies like Microsoft', 'Check data quality'];
}

export default function MissionControl({
  companies,
  layouts,
  selected,
  view,
  phase,
  onMissionComplete,
  onMissionClear,
  currentMission,
}) {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);
  const [health, setHealth] = useState({ online: false, model: DEFAULT_OLLAMA_MODEL });
  const [error, setError] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const selectedCompany = selected != null ? companies[selected] : null;
  const suggestions = useMemo(
    () => currentMission?.nextQuestions?.length ? currentMission.nextQuestions : defaultSuggestions(selectedCompany, view),
    [currentMission, selectedCompany, view]
  );

  useEffect(() => {
    let cancelled = false;
    checkOllamaHealth().then((result) => {
      if (!cancelled) setHealth(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.altKey && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const execute = async (text) => {
    const nextCommand = text.trim();
    if (!nextCommand || running) return;
    setOpen(true);
    setCommand(nextCommand);
    if (nextCommand.toLowerCase() === '/help') {
      setHelpOpen(true);
      setError(null);
      return;
    }
    if (nextCommand.toLowerCase() === '/clear') {
      onMissionClear();
      setHelpOpen(false);
      setCommand('');
      setError(null);
      return;
    }
    setRunning(true);
    setError(null);
    setHelpOpen(false);
    try {
      const mission = await runMission({
        command: nextCommand,
        companies,
        layouts,
        selectedIndex: selected,
        phase,
        model: health.model || DEFAULT_OLLAMA_MODEL,
      });
      setHealth(mission.ollama);
      onMissionComplete(mission);
    } catch (missionError) {
      setError(missionError.message || 'Mission failed');
    } finally {
      setRunning(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    execute(command);
  };

  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 z-30 w-[min(24rem,calc(100vw-3rem))]">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-accent/25 bg-surface/70 px-3.5 py-2 text-sm text-ink shadow-glass backdrop-blur-xl outline-none transition hover:border-accent/45 focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="text-accent"><SparkIcon /></span>
          Mission Control
          <span className={`h-1.5 w-1.5 rounded-full ${health.online ? 'bg-pos' : 'bg-amber-300'}`} aria-hidden="true" />
        </button>
      )}

      {open && (
        <section className="glass overflow-hidden p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label-mono text-accent/80">MISSION CONTROL</div>
              <h2 className="mt-1 text-base font-semibold text-ink">Gemma Core</h2>
              <p className="mt-0.5 text-xs text-ink-faint">
                {health.online ? `${health.model} online - local inference` : 'Offline fallback - deterministic agents active'}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setHelpOpen((value) => !value)}
                aria-label="Show Mission Control commands"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-muted transition hover:bg-white/10 hover:text-ink"
              >
                <span className="font-mono text-xs">?</span>
              </button>
              <button
                onClick={() => {
                  onMissionClear();
                  setCommand('');
                  setHelpOpen(false);
                }}
                aria-label="Clear active mission"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-muted transition hover:bg-white/10 hover:text-ink"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="m19 6-1 14H6L5 6" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Collapse Mission Control"
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-muted transition hover:bg-white/10 hover:text-ink"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>

          <MissionInput value={command} onChange={setCommand} onSubmit={submit} disabled={running} />
          {error && <div className="mt-2 rounded-md border border-neg/20 bg-neg/10 px-2 py-1.5 text-xs text-neg">{error}</div>}
          {helpOpen && <MissionHelp onChoose={execute} />}
          <MissionTimeline running={running} agents={currentMission?.agents} />
          <MissionBrief mission={currentMission} />
          <MissionSuggestions suggestions={suggestions} onChoose={execute} />
        </section>
      )}
    </div>
  );
}
