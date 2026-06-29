import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// The "personal constellation" — a glowing teal flight-path threading your top
// matched companies in ranked order. Vertices are rewritten every frame from the
// shared world-position buffer the nodes publish, so the line tracks the cloud as
// it drifts and re-lays-out across scroll phases. Opacity eases in when a résumé
// match is active and out when it clears, so the same mesh stays mounted.
export default function ConstellationLinks({ sharedPositions, order, active }) {
  const lineRef = useRef(null);
  const matRef = useRef(null);
  const opacity = useRef(0);

  // One vertex pair per segment between consecutive stops. Rebuilt only when the
  // match set changes (stable identity otherwise → no per-frame allocation).
  const { geometry, positions, segments } = useMemo(() => {
    const segments = Math.max(0, order.length - 1);
    const positions = new Float32Array(segments * 2 * 3);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry, positions, segments };
  }, [order]);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 4);
    const target = active && segments > 0 ? 0.5 : 0;
    opacity.current += (target - opacity.current) * k;

    const line = lineRef.current;
    if (matRef.current) matRef.current.opacity = opacity.current;
    if (line) line.visible = opacity.current > 0.01;

    if (!sharedPositions || segments === 0 || opacity.current <= 0.01) return;

    for (let s = 0; s < segments; s++) {
      const a = order[s] * 3;
      const b = order[s + 1] * 3;
      const o = s * 6;
      positions[o] = sharedPositions[a];
      positions[o + 1] = sharedPositions[a + 1];
      positions[o + 2] = sharedPositions[a + 2];
      positions[o + 3] = sharedPositions[b];
      positions[o + 4] = sharedPositions[b + 1];
      positions[o + 5] = sharedPositions[b + 2];
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        ref={matRef}
        color="#5eead4"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}
