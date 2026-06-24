import { useMemo, useRef, useState, useCallback } from 'react';
import { useCompanies } from './lib/useCompanies';
import { buildLayouts } from './lib/layouts';
import { useScrollProgress } from './hooks/useScrollProgress';
import CosmosCanvas from './components/CosmosCanvas';
import HudOverlay from './components/hud/HudOverlay';
import IntroPlayer from './components/intro/IntroPlayer';
import DashboardView from './components/dashboard/DashboardView';

const SCROLL_VH = 400; // height of the scroll driver -> length of the journey

export default function App() {
  const { companies, loading, error } = useCompanies();

  const [hover, setHover] = useState({ index: null, x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState(''); // live search → dim/blaze in CompanyNodes
  const [view, setView] = useState('cosmos'); // 'cosmos' | 'dashboard'
  // Cold-open state machine: the Remotion intro plays once, fades, then unmounts.
  const [introState, setIntroState] = useState('playing'); // 'playing' | 'fading' | 'done'

  // Precompute the three spatial layouts ONCE from parsed full_json.
  const layouts = useMemo(
    () => (companies.length ? buildLayouts(companies) : null),
    [companies]
  );

  // The scroll trigger can only attach once the spacer div is in the DOM — i.e.
  // after layouts resolve, we've left the loading splash, AND we're in the cosmos
  // view. Gating on all three rebuilds the trigger when returning from the dashboard.
  const { triggerRef, progressRef, progress } = useScrollProgress(
    Boolean(layouts) && view === 'cosmos'
  );

  // Shared buffer the CameraRig reads to snap onto the selected node.
  const sharedPositions = useRef(null);
  if (layouts && (!sharedPositions.current || sharedPositions.current.length !== layouts.count * 3)) {
    sharedPositions.current = new Float32Array(layouts.count * 3);
  }

  const onHover = useCallback((index, x = 0, y = 0) => {
    setHover({ index, x, y });
  }, []);

  // Direct A -> B traversal. Re-selecting the active node is a no-op (no state
  // change => the camera keeps its smooth lerp instead of restarting). The HUD
  // panel stays mounted throughout and just swaps which company it shows.
  const onSelect = useCallback((index) => {
    setSelected((prev) => (prev === index ? prev : index));
  }, []);

  const onIntroEnded = useCallback(() => {
    setIntroState('fading');
    setTimeout(() => setIntroState('done'), 300);
  }, []);

  const onSwitchToDashboard = useCallback(() => setView('dashboard'), []);

  // Return to the 3D scene. When called with a company index (dashboard row /
  // scatter click) we select it so the camera flies in. Reset scroll to the top
  // so the rebuilt ScrollTrigger starts at the galaxy phase, and pre-seed the
  // shared positions to the galaxy layout so the fly-to aims at the right spot.
  const onSwitchToCosmos = useCallback((index) => {
    if (sharedPositions.current && layouts) sharedPositions.current.set(layouts.galaxy);
    if (typeof index === 'number') setSelected(index);
    setView('cosmos');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [layouts]);

  return (
    <>
      {/* Cold-open overlay (z-20, opaque) sits above the scene while WebGL warms
          up underneath, then fades to reveal it. Unmounts entirely when done. */}
      {introState !== 'done' && (
        <div
          style={{
            pointerEvents: 'none',
            opacity: introState === 'fading' ? 0 : 1,
            transition: 'opacity 300ms ease',
          }}
        >
          <IntroPlayer onEnded={onIntroEnded} />
        </div>
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
              onHover={onHover}
              onSelect={onSelect}
            />
            {/* Invisible scroll driver — gives the page its height so GSAP can scrub. */}
            <div ref={triggerRef} style={{ height: `${SCROLL_VH}vh` }} className="relative z-0 pointer-events-none" />
          </>
        )}

        {view === 'dashboard' && (
          <DashboardView companies={companies} layouts={layouts} onSelectCompany={onSwitchToCosmos} />
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
          onCloseSelected={() => setSelected(null)}
          view={view}
          onSwitchToDashboard={onSwitchToDashboard}
          onSwitchToCosmos={onSwitchToCosmos}
        />
      </>
    );
  }
}

function Splash({ text }) {
  return (
    <div className="flex h-full items-center justify-center bg-canvas">
      <div className="label-mono animate-pulse text-accent/80">{text}</div>
    </div>
  );
}

function ConfigError({ message }) {
  return (
    <div className="flex h-full items-center justify-center bg-canvas p-8">
      <div className="glass max-w-md p-6">
        <div className="label-mono text-neg">Connection</div>
        <h2 className="mt-2 font-display text-lg font-semibold text-ink">Cannot load data</h2>
        <p className="mt-2 text-sm text-ink-muted">{message}</p>
        <p className="mt-4 text-sm text-ink-faint">
          Copy <code className="text-accent">.env.example</code> to{' '}
          <code className="text-accent">.env</code>, add your Supabase URL and anon key, then restart{' '}
          <code className="text-accent">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
