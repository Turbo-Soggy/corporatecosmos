import PhaseIndicator from './PhaseIndicator';
import ClusterCard from './ClusterCard';
import NodeTooltip from './NodeTooltip';
import CompanyPanel from './CompanyPanel';
import CommandPalette from './CommandPalette';
import SearchSpotlight from './SearchSpotlight';

// Top DOM layer (z-10). Container ignores pointer events; interactive panels
// re-enable them so the canvas underneath still receives raycasts elsewhere.
export default function HudOverlay({
  progress,
  layouts,
  companies,
  hover,
  selected,
  query,
  onQuery,
  onSelect,
  onCloseSelected,
}) {
  const hoverMeta = hover.index != null ? layouts.meta[hover.index] : null;
  const selectedCompany = selected != null ? companies[selected] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <PhaseIndicator progress={progress} />
      <SearchSpotlight query={query} onQuery={onQuery} layouts={layouts} onSelect={onSelect} />
      <CommandPalette companies={companies} onSelect={onSelect} />
      <ClusterCard progress={progress} layouts={layouts} />

      <div className="label-mono pointer-events-none absolute bottom-6 left-6">
        Scroll to traverse · ⌘K to search · Click a node to inspect
      </div>

      <NodeTooltip meta={hoverMeta} x={hover.x} y={hover.y} />
      <CompanyPanel company={selectedCompany} onClose={onCloseSelected} />
    </div>
  );
}
