import { sectorColor } from '../../lib/sectors';

// Floating glass tooltip that tracks the cursor over a hovered node. The dot
// reuses the shared sector color map so it matches the node's emissive hue.
export default function NodeTooltip({ meta, x, y }) {
  if (!meta) return null;
  const dot = sectorColor(meta.sector);
  return (
    <div
      className="pointer-events-none fixed z-20 -translate-y-full translate-x-3"
      style={{ left: x, top: y }}
    >
      <div className="glass px-3.5 py-2.5">
        <div className="text-sm font-semibold text-ink">{meta.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5 label-mono text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
          {meta.sector}
        </div>
        {meta.valuationDisplay && meta.valuationDisplay !== '—' && (
          <div className="tnum mt-1.5 text-xs text-ink-muted">
            Valuation ≈ <span className="text-ink">{meta.valuationDisplay}</span>
          </div>
        )}
      </div>
    </div>
  );
}
