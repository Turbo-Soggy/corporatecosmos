import PhaseIndicator from './PhaseIndicator';
import ClusterCard from './ClusterCard';
import CompanyPanel from './CompanyPanel';
import CommandPalette from './CommandPalette';
import SearchSpotlight from './SearchSpotlight';
import UploadDock from '../resume/UploadDock';
import AlignedStars from '../resume/AlignedStars';
import FlightControls from '../resume/FlightControls';

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

// Top DOM layer (z-10). Container ignores pointer events; interactive panels
// re-enable them so the canvas underneath still receives raycasts elsewhere.
// The view toggle is always visible; the rest is gated to the cosmos view.
export default function HudOverlay({
  progress,
  layouts,
  companies,
  selected,
  query,
  onQuery,
  onSelect,
  onCloseSelected,
  view,
  onSwitchToDashboard,
  onSwitchToCosmos,
  resume,
  uploadOpen,
  onUploadOpen,
  onResume,
  onClearResume,
  tour,
}) {
  const selectedCompany = selected != null ? companies[selected] : null;
  const inCosmos = view === 'cosmos';
  const resumeActive = Boolean(resume);

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      {/* View toggle — the one control present in both views. */}
      <button
        onClick={() => (inCosmos ? onSwitchToDashboard() : onSwitchToCosmos())}
        aria-label={inCosmos ? 'Open dashboard' : 'Return to 3D view'}
        className="label-mono pointer-events-auto absolute right-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-surface/60 px-3.5 py-2 !tracking-normal text-ink-muted backdrop-blur-xl outline-none transition hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        {inCosmos ? <GridIcon /> : <GlobeIcon />}
        {inCosmos ? 'Dashboard' : '3D View'}
      </button>

      {inCosmos && (
        <>
          {/* The phase title + scroll hint step aside while the résumé drawer is open. */}
          {!resumeActive && <PhaseIndicator progress={progress} />}
          <SearchSpotlight query={query} onQuery={onQuery} layouts={layouts} onSelect={onSelect} />
          <CommandPalette companies={companies} onSelect={onSelect} />
          <ClusterCard progress={progress} layouts={layouts} />

          {!resumeActive && (
            <div className="label-mono pointer-events-none absolute bottom-6 left-6">
              {selected != null
                ? 'Esc to exit focus · Click another body to switch'
                : 'Scroll to traverse · ⌘K to search · Click a node to inspect'}
            </div>
          )}

          {/* Résumé → constellation experience. */}
          <UploadDock
            open={uploadOpen}
            setOpen={onUploadOpen}
            hasResult={resumeActive}
            companies={companies}
            onResult={onResume}
          />
          <AlignedStars
            resume={resume}
            selected={selected}
            onSelect={onSelect}
            onStartTour={tour.start}
            onReplace={() => onUploadOpen(true)}
            onClear={onClearResume}
          />
          <FlightControls tour={tour} resume={resume} />

          <CompanyPanel company={selectedCompany} onClose={onCloseSelected} />
        </>
      )}
    </div>
  );
}
