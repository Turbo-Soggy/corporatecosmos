import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCompanies } from './lib/useCompanies';
import { buildLayouts } from './lib/layouts';
import { useScrollProgress } from './hooks/useScrollProgress';
import { PHASES, phaseIndexFor } from './lib/phases';
import { sectorColor } from './lib/sectors';
import CosmosCanvas from './components/CosmosCanvas';
import HudOverlay from './components/hud/HudOverlay';
import IntroPlayer from './components/intro/IntroPlayer';
import BodyTransitionPlayer from './components/intro/BodyTransitionPlayer';
import PhaseTransitionPlayer from './components/intro/PhaseTransitionPlayer';
import PortalTransitionPlayer from './components/intro/PortalTransitionPlayer';
import DashboardStoryPlayer from './components/intro/DashboardStoryPlayer';
import DashboardView from './components/dashboard/DashboardView';

const SCROLL_VH = 400;

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

  const selectedRef = useRef(null);
  const transitionIdRef = useRef(0);
  const phaseIdRef = useRef(0);
  const portalIdRef = useRef(0);
  const portalTransitionRef = useRef(null);
  const lastPhaseRef = useRef(0);
  const storyIdRef = useRef(0);
  const storyPlayedRef = useRef(false);

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
            <CosmosCanvas layouts={layouts} progressRef={progressRef} sharedPositions={sharedPositions.current} hovered={hover.index} selected={selected} query={query} onHover={onHover} onSelect={onSelect} introActive={introState !== 'done'} />
            <div ref={triggerRef} style={{ height: `${SCROLL_VH}vh` }} className="relative z-0 pointer-events-none" />
          </>
        )}
        {view === 'dashboard' && (
          <DashboardView companies={companies} layouts={layouts} onSelectCompany={onSwitchToCosmos} onReplayStory={replayDashboardStory} />
        )}
        <HudOverlay progress={progress} layouts={layouts} companies={companies} hover={hover} selected={selected} query={query} onQuery={setQuery} onSelect={onSelect} onCloseSelected={() => onSelect(null)} view={view} onSwitchToDashboard={onSwitchToDashboard} onSwitchToCosmos={onSwitchToCosmos} />
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
