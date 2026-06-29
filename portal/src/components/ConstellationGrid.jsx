import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { smoothstep, phaseIndexFor } from '../lib/phases';

// Procedural structural context for each layout. The nodes stop being a random cloud and sit
// inside a legible system: an armillary sphere (galaxy), a valuation×growth plane (financial),
// and a polar "radar" floor with a ring per region (geographic). Each layer's opacity is
// driven by the same scroll progress that drives the layout blend, so structure fades in
// exactly as you arrive in its phase.

const TAU = Math.PI * 2;
const Z_FIN = -6;   // financial plane sits just behind the node slab (z ±5)
const Y_GEO = -14;  // geographic floor sits below the lowest pocket

function circle(segs, at) {
  const pts = [];
  for (let i = 0; i < segs; i++) {
    const p0 = at((i / segs) * TAU);
    const p1 = at(((i + 1) / segs) * TAU);
    pts.push(p0[0], p0[1], p0[2], p1[0], p1[1], p1[2]);
  }
  return pts;
}

function geoFrom(pts) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

// Per-phase visibility weight, mirroring layoutBlend's cross-fade boundaries.
function phaseWeights(p) {
  if (p < 0.3) return { galaxy: 1, financial: 0, geographic: 0 };
  if (p < 0.4) { const s = smoothstep((p - 0.3) / 0.1); return { galaxy: 1 - s, financial: s, geographic: 0 }; }
  if (p < 0.6) return { galaxy: 0, financial: 1, geographic: 0 };
  if (p < 0.7) { const s = smoothstep((p - 0.6) / 0.1); return { galaxy: 0, financial: 1 - s, geographic: s }; }
  return { galaxy: 0, financial: 0, geographic: 1 };
}

function buildLayers(layouts) {
  const layers = [];

  // --- Galaxy: a faint oblate armillary (3 great circles) enclosing the cloud ---
  const R = 27;
  const SY = 0.7; // matches the galaxy layout's vertical squash
  const galaxy = [
    ...circle(96, (a) => [Math.cos(a) * R, 0, Math.sin(a) * R]),         // equator (XZ)
    ...circle(96, (a) => [Math.cos(a) * R, Math.sin(a) * R * SY, 0]),     // meridian (XY)
    ...circle(96, (a) => [0, Math.sin(a) * R * SY, Math.cos(a) * R]),     // meridian (YZ)
  ];
  layers.push({ phase: 'galaxy', base: 0.1, color: '#6f8fd6', geo: geoFrom(galaxy) });

  // --- Financial: XY coordinate plane (valuation × growth) ---
  const X0 = -45, X1 = 45, Y0 = -22, Y1 = 22, SX = 9, SYg = 11;
  const minor = [];
  for (let x = X0; x <= X1 + 0.01; x += SX) if (Math.abs(x) > 0.01) minor.push(x, Y0, Z_FIN, x, Y1, Z_FIN);
  for (let y = Y0; y <= Y1 + 0.01; y += SYg) if (Math.abs(y) > 0.01) minor.push(X0, y, Z_FIN, X1, y, Z_FIN);
  layers.push({ phase: 'financial', base: 0.12, color: '#3b82f6', geo: geoFrom(minor) });
  const axes = [X0, 0, Z_FIN, X1, 0, Z_FIN, 0, Y0, Z_FIN, 0, Y1, Z_FIN];
  layers.push({ phase: 'financial', base: 0.5, color: '#22d3ee', geo: geoFrom(axes) });

  // --- Geographic: polar floor (radar) + a ring per region pocket ---
  const radar = [];
  for (const r of [10, 20, 30, 40]) radar.push(...circle(96, (a) => [Math.cos(a) * r, Y_GEO, Math.sin(a) * r]));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    radar.push(0, Y_GEO, 0, Math.cos(a) * 45, Y_GEO, Math.sin(a) * 45);
  }
  layers.push({ phase: 'geographic', base: 0.12, color: '#34d399', geo: geoFrom(radar) });
  const pockets = [];
  for (const rc of layouts.regionCounts) {
    if (rc.x == null) continue;
    pockets.push(...circle(64, (a) => [rc.x + Math.cos(a) * 9, Y_GEO, rc.z + Math.sin(a) * 9]));
  }
  if (pockets.length) layers.push({ phase: 'geographic', base: 0.32, color: '#5eead4', geo: geoFrom(pockets) });

  return layers;
}

const CAPTION =
  'whitespace-nowrap rounded border border-white/10 bg-surface/70 px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wide backdrop-blur-md';

export default function ConstellationGrid({ progressRef, layouts }) {
  const layers = useMemo(() => buildLayers(layouts), [layouts]);
  const meshRefs = useRef([]);
  const [phase, setPhase] = useState(0);
  const phaseRef = useRef(0);

  const finLabels = useMemo(
    () => [
      { pos: [30, -3, Z_FIN], text: 'WITHIN-CURRENCY VALUATION →' },
      { pos: [4, 19.5, Z_FIN], text: '↑ YoY GROWTH' },
    ],
    []
  );
  const geoLabels = useMemo(
    () =>
      layouts.regionCounts
        .filter((rc) => rc.x != null)
        .map((rc) => ({ pos: [rc.x, Y_GEO + 2, rc.z], text: `${rc.region} · ${rc.count}` })),
    [layouts]
  );

  useFrame(() => {
    const p = progressRef.current;
    const w = phaseWeights(p);
    for (let i = 0; i < layers.length; i++) {
      const m = meshRefs.current[i];
      if (!m) continue;
      const o = layers[i].base * w[layers[i].phase];
      m.visible = o > 0.002;
      m.material.opacity = o;
    }
    const pi = phaseIndexFor(p);
    if (pi !== phaseRef.current) {
      phaseRef.current = pi;
      setPhase(pi); // rare (per phase change) — toggles which captions are mounted
    }
  });

  return (
    <group>
      {layers.map((L, i) => (
        <lineSegments
          key={i}
          ref={(m) => { if (m) meshRefs.current[i] = m; }}
          geometry={L.geo}
          frustumCulled={false}
        >
          <lineBasicMaterial
            color={L.color}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ))}

      {phase === 1 &&
        finLabels.map((l, i) => (
          <group key={`f${i}`} position={l.pos}>
            <Html center distanceFactor={36} zIndexRange={[4, 0]} pointerEvents="none">
              <div className={CAPTION} style={{ color: '#67e8f9' }}>{l.text}</div>
            </Html>
          </group>
        ))}

      {phase === 2 &&
        geoLabels.map((l, i) => (
          <group key={`g${i}`} position={l.pos}>
            <Html center distanceFactor={40} zIndexRange={[4, 0]} pointerEvents="none">
              <div className={CAPTION} style={{ color: '#5eead4' }}>{l.text}</div>
            </Html>
          </group>
        ))}
    </group>
  );
}
