import { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// In-scene billboard label that tracks a single animated node. We only ever
// mount labels for the hovered + selected node (proximity labeling) — never all
// 118 — so this stays cheap. The group position is updated each frame from the
// shared world-position buffer the InstancedMesh publishes.
function NodeLabel({ index, sharedPositions, meta, accent }) {
  const groupRef = useRef(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g || !sharedPositions) return;
    const ix = index * 3;
    g.position.set(sharedPositions[ix], sharedPositions[ix + 1], sharedPositions[ix + 2]);
  });

  return (
    <group ref={groupRef}>
      <Html center distanceFactor={28} zIndexRange={[5, 0]} pointerEvents="none">
        <div className="-translate-y-6 whitespace-nowrap rounded-md border border-white/10 bg-surface/80 px-2 py-1 backdrop-blur-md">
          <span
            className="font-mono text-[11px] font-medium tracking-wide"
            style={{ color: accent ? '#5EEAD4' : '#E6EDF7' }}
          >
            {meta?.name}
          </span>
        </div>
      </Html>
    </group>
  );
}

export default function NodeLabels({ layouts, sharedPositions, hovered, selected }) {
  return (
    <>
      {selected != null && (
        <NodeLabel
          index={selected}
          sharedPositions={sharedPositions}
          meta={layouts.meta[selected]}
          accent
        />
      )}
      {hovered != null && hovered !== selected && (
        <NodeLabel
          index={hovered}
          sharedPositions={sharedPositions}
          meta={layouts.meta[hovered]}
        />
      )}
    </>
  );
}
