import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { sectorColor } from '../lib/sectors';

// In-scene hover card. Unlike a cursor-anchored DOM tooltip, this rides the node
// itself: a group whose position is set every frame from the shared world-position
// buffer, so the card stays glued to a moving/orbiting body with no mouse-driven
// re-render stutter. Constant screen size (no distanceFactor) — it reads as a HUD
// tile, not a 3D billboard.
function HoverCard({ index, meta, sharedPositions }) {
  const groupRef = useRef(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g || !sharedPositions) return;
    const ix = index * 3;
    g.position.set(sharedPositions[ix], sharedPositions[ix + 1], sharedPositions[ix + 2]);
  });

  const dot = sectorColor(meta.sector);

  return (
    <group ref={groupRef}>
      <Html zIndexRange={[6, 0]} pointerEvents="none">
        {/* Center horizontally on the node and float just above it. */}
        <div style={{ transform: 'translate(-50%, calc(-100% - 14px))' }}>
          <div className="glass whitespace-nowrap px-3.5 py-2.5">
            <div className="text-sm font-semibold text-ink">{meta.name}</div>
            <div className="label-mono mt-0.5 flex items-center gap-1.5 text-ink-muted">
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
      </Html>
    </group>
  );
}

export default function NodeHoverCard({ hovered, selected, layouts, sharedPositions }) {
  // Suppress while hovering the selected node — its accent label already shows.
  if (hovered == null || hovered === selected) return null;
  return <HoverCard index={hovered} meta={layouts.meta[hovered]} sharedPositions={sharedPositions} />;
}
