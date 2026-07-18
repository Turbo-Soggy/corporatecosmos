import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCompanies } from './lib/useCompanies';
import { buildLayouts } from './lib/layouts';
import { useScrollProgress } from './hooks/useScrollProgress';
import { PHASES, phaseIndexFor } from './lib/phases';
import { sectorColor } from './lib/sectors';
import { useFlightTour } from './hooks/useFlightTour';
import { analyzeResume, TOUR_N } from './lib/resumeMatch';
import CosmosCanvas from './components/CosmosCanvas';
import HudOverlay from './components/hud/HudOverlay';
import IntroPlayer from './components/intro/IntroPlayer';
import BodyTransitionPlayer from './components/intro/BodyTransitionPlayer';
import PhaseTransitionPlayer from './components/intro/PhaseTransitionPlayer';
import PortalTransitionPlayer from './components/intro/PortalTransitionPlayer';
import DashboardStoryPlayer from './components/intro/DashboardStoryPlayer';
import DashboardView from './components/dashboard/DashboardView';

const RESUME_BLAZE = '#5eead4'; // teal tint for the personal constellation

const SCROLL_VH = 400; // height of the scroll driver -> length of the journey

function appendScannerText(lines, value) {
  if (typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) return;
  const text = String(value).trim();
  if (text) lines.push(text);
}

function scannerResultText(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return '';
  if (result.source_type !== 'jd' && result.source_type !== 'resume') return '';
  if (!Array.isArray(result.skills)) return '';

  const lines = [];
  appendScannerText(lines, result.role);
  appendScannerText(lines, result.company);
  if (Array.isArray(result.skills)) {
    result.skills.forEach((skill) => {
      if (!skill || typeof skill !== 'object' || Array.isArray(skill)) return;
      appendScannerText(lines, skill.skill_name);
      appendScannerText(lines, skill.evidence);
    });
  }
  for (const [items, fields] of [
    [result.education, ['qualification', 'institution', 'dates']],
    [result.projects, ['name', 'summary']],
    [result.experience, ['role', 'organization', 'dates']],
  ]) {
    if (!Array.isArray(items)) continue;
    items.forEach((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return;
      fields.forEach((field) => appendScannerText(lines, item[field]));
    });
  }
  return lines.join('\n').trim();
}

export default function App() {
  const { companies, loading, error } = useCompanies();
  const [hover, setHover] = useState({ index: null, x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('cosmos');
  const [introState, setIntroState] = useState('playing');
  const [bodyTransition, setBodyTransition] = useState(null);
  const [phaseTransition, setPhaseTransition] = useState(null);
  const [portalTransition, setPortalTransition] = useState(null);
  const [dashboardStory, setDashboardStory] = useState(null);
  const [missionResult, setMissionResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerResult, setScannerResult] = useState(null);
  const [scannerProjection, setScannerProjection] = useState(null);

  const selectedRef = useRef(null);
  const transitionIdRef = useRef(0);
  const phaseIdRef = useRef(0);
  const portalIdRef = useRef(0);
  const portalTransitionRef = useRef(null);
  const lastPhaseRef = useRef(0);
  const storyIdRef = useRef(0);
  const storyPlayedRef = useRef(false);

  // Résumé match: parsed { profile, ranked, fileName } | null, plus the upload modal.
  const [resume, setResume] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const matchSet = useMemo(() => {
    const source = resume || scannerProjection;
    return source ? new Set(source.ranked.filter((r) => r.compatible).map((r) => r.index)) : null;
  }, [resume, scannerProjection]);
  const missionMatchSet = useMemo(() => {
    const highlighted = missionResult?.companies?.highlightedIndices || [];
    return highlighted.length ? new Set(highlighted) : null;
  }, [missionResult]);
  const linkOrder = useMemo(
    () => {
      const source = resume || scannerProjection;
      return source
        ? source.ranked.filter((r) => r.compatible).slice(0, TOUR_N).map((r) => r.index)
        : [];
    },
    [resume, scannerProjection]
  );
  const missionLinkOrder = useMemo(
    () => missionResult?.cosmos?.linkOrder?.slice(0, 12) || [],
    [missionResult]
  );

  const layouts = useMemo(() => (companies.length ? buildLayouts(companies) : null), [companies]);
  const introColors = useMemo(
    () => (layouts ? layouts.meta.map((meta) => sectorColor(meta.sector)) : []),
    [layouts]
  );
  const dashboardStats = useMemo(() => {
    const currencies = new Map();
    companies.forEach((company) => {
      const currency = company.metricCurrencies?.valuation;
      if (currency) currencies.set(currency, (currencies.get(currency) || 0) + 1);
    });
    const primaryCurrency = [...currencies.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'USD';
    return {
      total: companies.length,
      sectors: new Set(companies.map((company) => company.sector)).size,
      currency: primaryCurrency,
    };
  }, [companies]);

  const { triggerRef, progressRef, progress } = useScrollProgress(Boolean(layouts) && view === 'cosmos');
  const sharedPositions = useRef(null);
  if (layouts && (!sharedPositions.current || sharedPositions.current.length !== layouts.count * 3)) {
    sharedPositions.current = new Float32Array(layouts.count * 3);
  }

  const onHover = useCallback((index, x = 0, y = 0) => setHover({ index, x, y }), []);

  // Direct A -> B traversal. Re-selecting the active node is a no-op (no state
  // change => the camera keeps its smooth lerp instead of restarting). The HUD
  // panel stays mounted throughout and just swaps which company it shows.
  const onSelect = useCallback((index) => {
    if (index != null && index !== selectedRef.current) {
      transitionIdRef.current += 1;
      setBodyTransition({ id: transitionIdRef.current, index });
    }
    selectedRef.current = index;
    setSelected(index);
  }, []);
  const onIntroEnded = useCallback(() => setIntroState('done'), []);
  const onBodyTransitionEnded = useCallback(() => setBodyTransition(null), []);
  const onPhaseTransitionEnded = useCallback(() => setPhaseTransition(null), []);
  const onDashboardStoryEnded = useCallback(() => setDashboardStory(null), []);
  const replayDashboardStory = useCallback(() => {
    storyIdRef.current += 1;
    setDashboardStory({ id: storyIdRef.current });
  }, []);

  const tour = useFlightTour(onSelect, linkOrder);

  const clearResume = useCallback(() => {
    setResume(null);
    setSelected(null);
  }, []);

  const startPortal = useCallback((target, index = null) => {
    if (portalTransitionRef.current) return;
    portalIdRef.current += 1;
    const transition = { id: portalIdRef.current, target, index };
    portalTransitionRef.current = transition;
    setPortalTransition(transition);
  }, []);

  const onSwitchToDashboard = useCallback(() => startPortal('dashboard'), [startPortal]);
  const onSwitchToCosmos = useCallback((index) => {
    startPortal('cosmos', typeof index === 'number' ? index : null);
  }, [startPortal]);

  const scrollToPhase = useCallback((phase) => {
    const target = { galaxy: 0, financial: 0.5, geographic: 1 }[phase];
    if (target == null) return;
    requestAnimationFrame(() => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: maxScroll * target, behavior: 'smooth' });
    });
  }, []);

  const onMissionComplete = useCallback((mission) => {
    setMissionResult(mission);
    const focusIndex = mission.cosmos?.focusCompanyIndex;
    const highlighted = mission.companies?.highlightedIndices || [];
    const phase = mission.cosmos?.phase;

    if (mission.dashboard?.open) {
      if (view !== 'dashboard') startPortal('dashboard');
      return;
    }

    if (view !== 'cosmos') {
      startPortal('cosmos', typeof focusIndex === 'number' ? focusIndex : highlighted[0] ?? null);
      return;
    }

    if (typeof focusIndex === 'number') onSelect(focusIndex);
    else if (highlighted.length === 1) onSelect(highlighted[0]);
    if (phase) scrollToPhase(phase);
  }, [onSelect, scrollToPhase, startPortal, view]);

  const onMissionClear = useCallback(() => {
    setMissionResult(null);
  }, []);

  const clearScanner = useCallback(() => {
    setScannerResult(null);
    setScannerProjection(null);
  }, []);

  const onScannerResult = useCallback((nextResult, action) => {
    if (action?.type === 'reset-project') {
      setScannerProjection(null);
      setScannerResult(nextResult ? { ...nextResult, projected: false } : null);
      return;
    }

    if (action?.type === 'project') {
      const text = scannerResultText(nextResult);
      if (!text || !Array.isArray(companies) || companies.length === 0) return;
      setScannerProjection(analyzeResume(text, companies));
      setScannerResult({ ...nextResult, projected: true });
      return;
    }

    setScannerProjection(null);
    setScannerResult(nextResult);
  }, [companies]);

  const onPortalMidpoint = useCallback(() => {
    const transition = portalTransitionRef.current;
    if (!transition) return;
    if (transition.target === 'dashboard') {
      setView('dashboard');
      return;
    }
    if (sharedPositions.current && layouts) sharedPositions.current.set(layouts.galaxy);
    lastPhaseRef.current = 0;
    onSelect(typeof transition.index === 'number' ? transition.index : null);
    setView('cosmos');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [layouts, onSelect]);

  const onPortalEnded = useCallback(() => {
    const transition = portalTransitionRef.current;
    portalTransitionRef.current = null;
    setPortalTransition(null);
    if (transition?.target === 'dashboard' && !storyPlayedRef.current) {
      storyPlayedRef.current = true;
      storyIdRef.current += 1;
      setDashboardStory({ id: storyIdRef.current });
    }
  }, []);

  const phaseIndex = phaseIndexFor(progress);
  useEffect(() => {
    if (view !== 'cosmos' || introState !== 'done' || portalTransition) return;
    const previous = lastPhaseRef.current;
    if (phaseIndex === previous) return;
    phaseIdRef.current += 1;
    setPhaseTransition({ id: phaseIdRef.current, from: PHASES[previous], to: PHASES[phaseIndex] });
    lastPhaseRef.current = phaseIndex;
  }, [phaseIndex, view, introState, portalTransition]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && selectedRef.current != null) onSelect(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSelect]);

  return (
    <>
      {layouts && introState !== 'done' && (
        <IntroPlayer
          galaxy={layouts.galaxy}
          scales={layouts.scale}
          colors={introColors}
          onEnded={onIntroEnded}
        />
      )}

      {introState === 'done' && phaseTransition && !portalTransition && (
        <PhaseTransitionPlayer key={phaseTransition.id} from={phaseTransition.from} to={phaseTransition.to} onEnded={onPhaseTransitionEnded} />
      )}
      {introState === 'done' && bodyTransition && layouts && !portalTransition && (
        <BodyTransitionPlayer key={bodyTransition.id} name={layouts.meta[bodyTransition.index]?.name || 'Company'} color={sectorColor(layouts.meta[bodyTransition.index]?.sector)} onEnded={onBodyTransitionEnded} />
      )}
      {view === 'dashboard' && dashboardStory && !portalTransition && (
        <DashboardStoryPlayer key={dashboardStory.id} stats={dashboardStats} onEnded={onDashboardStoryEnded} />
      )}
      {portalTransition && (
        <PortalTransitionPlayer key={portalTransition.id} target={portalTransition.target} onMidpoint={onPortalMidpoint} onEnded={onPortalEnded} />
      )}

      {renderBody()}
    </>
  );

  function renderBody() {
    if (loading) return <Splash text="Charting the cosmos…" />;
    if (error) return <ConfigError message={error} />;
    if (!layouts) return <Splash text="No companies found in company_json." />;
    return (
      <>
        {view === 'cosmos' && (
          <>
            <CosmosCanvas
              layouts={layouts}
              progressRef={progressRef}
              sharedPositions={sharedPositions.current}
              hovered={hover.index}
              selected={selected}
              query={query}
              matchSet={matchSet || missionMatchSet}
              blazeHex={resume || scannerProjection ? RESUME_BLAZE : missionMatchSet ? '#fbbf24' : null}
              linkOrder={resume || scannerProjection ? linkOrder : missionLinkOrder}
              onHover={onHover}
              onSelect={onSelect}
              introActive={introState !== 'done'}
            />
            {/* Invisible scroll driver — gives the page its height so GSAP can scrub. */}
            <div ref={triggerRef} style={{ height: `${SCROLL_VH}vh` }} className="relative z-0 pointer-events-none" />
          </>
        )}
        {view === 'dashboard' && (
          <DashboardView
            companies={companies}
            layouts={layouts}
            mission={missionResult}
            onSelectCompany={onSwitchToCosmos}
            onReplayStory={replayDashboardStory}
          />
        )}
        <HudOverlay
          progress={progress}
          layouts={layouts}
          companies={companies}
          hover={hover}
          selected={selected}
          query={query}
          onQuery={setQuery}
          onSelect={onSelect}
          onCloseSelected={() => onSelect(null)}
          view={view}
          onSwitchToDashboard={onSwitchToDashboard}
          onSwitchToCosmos={onSwitchToCosmos}
          resume={resume}
          uploadOpen={uploadOpen}
          onUploadOpen={setUploadOpen}
          onResume={setResume}
          onClearResume={clearResume}
          tour={tour}
          mission={missionResult}
          onMissionComplete={onMissionComplete}
          onMissionClear={onMissionClear}
          scannerOpen={scannerOpen}
          scannerResult={scannerResult}
          onScannerOpen={setScannerOpen}
          onScannerResult={onScannerResult}
          onScannerClear={clearScanner}
        />
      </>
    );
  }
}

function Splash({ text }) {
  return <div className="flex h-full items-center justify-center bg-canvas"><div className="label-mono animate-pulse text-accent/80">{text}</div></div>;
}

function ConfigError({ message }) {
  return (
    <div className="flex h-full items-center justify-center bg-canvas p-8">
      <div className="glass max-w-md p-6">
        <div className="label-mono text-neg">Connection</div>
        <h2 className="mt-2 font-display text-lg font-semibold text-ink">Cannot load data</h2>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
        <p className="mt-4 text-sm text-ink-faint">Copy <code className="text-accent">.env.example</code> to <code className="text-accent">.env</code>, add your Supabase URL and anon key, then restart <code className="text-accent">npm run dev</code>.</p>
      </div>
    </div>
  );
}
