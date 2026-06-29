import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { layoutBlend } from '../lib/phases';
import { reducedMotion } from '../lib/motion';
import { sectorColor } from '../lib/sectors';
import { useLogoTexture, disposeLogoCache } from '../lib/logoTexture';
import { matchIndices } from '../lib/search';

// One shared geometry, reused across all 118 meshes (per-node material carries the texture).
const NODE_GEOMETRY = new THREE.SphereGeometry(0.55, 24, 24);

const BASE_EMISSIVE = 1.5;     // category-color glow at rest
const ACTIVE_EMISSIVE = 2.6;   // hover/selected glow

// Live-search dim/blaze (driven by `query`): unmatched fade to 10% emissive, matched blaze
// brighter and shift toward yellow.
const SEARCH_DIM = 0.1;
const SEARCH_BLAZE = 2.8;
const tmpColor = new THREE.Color();

function LogoNode({ index, meta, sectorHex, register, onHover, onSelect }) {
  const meshRef = useRef(null);
  const matRef = useRef(null);
  // Per-node material instance (required for unique textures). Starts on the procedural
  // letter so the material owns a `map` from frame 0 → texture swaps never recompile.
  const texture = useLogoTexture({
    name: meta.name,
    logoUrl: meta.logoUrl,
    domain: meta.domain,
    sectorHex,
  });

  useLayoutEffect(() => {
    register(index, meshRef.current, matRef.current);
    return () => register(index, null, null);
  }, [index, register]);

  return (
    <mesh
      ref={meshRef}
      geometry={NODE_GEOMETRY}
      dispose={null}               // do NOT auto-dispose the shared geometry
      frustumCulled={false}
      onPointerOver={(e) => { e.stopPropagation(); onHover(index); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect(index); }}
    >
      <meshPhysicalMaterial
        ref={matRef}
        map={texture}              // logo / favicon / procedural — resolved by the hook
        emissive={sectorHex}       // category color, not `color` (keeps the logo legible)
        emissiveIntensity={BASE_EMISSIVE}
        roughness={0.15}
        metalness={0.8}
        toneMapped={false}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

/**
 * 118 individual meshes. Position is driven by the layout blend in useFrame; scale and
 * emissive are driven by GSAP-tweened scalars (enterT, activeT) that useFrame APPLIES.
 * One writer per property — GSAP never touches mesh.scale directly, useFrame never tweens.
 */
export default function CompanyNodes({
  layouts,
  progressRef,
  sharedPositions,
  hovered,
  selected,
  query,
  matchSet,
  blazeHex,
  onHover,
  onSelect,
}) {
  const groupRef = useRef(null);
  const n = layouts.count;
  // [{ mesh, material, activeT, enterT, searchT }] by index. Scalars are tweened by GSAP below.
  const nodes = useRef([]);

  const register = useCallback((i, mesh, material) => {
    if (mesh && material) {
      const prev = nodes.current[i];
      nodes.current[i] = {
        mesh,
        material,
        activeT: prev ? prev.activeT : 0,
        enterT: prev ? prev.enterT : 0,
        searchT: prev ? prev.searchT : 0,
      };
    } else {
      nodes.current[i] = null;
    }
  }, []);

  const current = useMemo(() => Float32Array.from(layouts.galaxy), [layouts]);
  const target = useMemo(() => new Float32Array(n * 3), [n]);
  // Per-node sector color, owned by useFrame (it lerps toward BLAZE_COLOR on a search hit).
  const baseColors = useMemo(
    () => layouts.meta.map((m) => new THREE.Color(sectorColor(m.sector))),
    [layouts]
  );
  // Highlight set drives the dim/blaze treatment. A résumé match (`matchSet`)
  // takes precedence over the live search query; null === neutral (all at rest).
  const matches = useMemo(
    () => matchSet ?? matchIndices(layouts.meta, query),
    [matchSet, layouts, query]
  );
  // Blaze tint: teal for a résumé constellation, the default yellow for search.
  const blazeColor = useMemo(() => new THREE.Color(blazeHex || '#fde047'), [blazeHex]);

  useEffect(() => () => disposeLogoCache(), []); // free shared textures on scene unmount

  // --- Lever #2: entrance stagger — nodes scale in, rippling from the center -------------
  // Runs after all child LogoNodes have registered (React flushes child layout effects
  // before this parent passive effect), so nodes.current is fully populated here.
  useEffect(() => {
    const list = nodes.current.filter(Boolean);
    if (reducedMotion) {
      list.forEach((node) => { node.enterT = 1; });
      return;
    }
    list.forEach((node) => { node.enterT = 0; });
    const tl = gsap.timeline();
    tl.to(list, {
      enterT: 1,
      duration: 1.1,
      ease: 'power2.out',
      stagger: { each: 0.012, from: 'center' },
    });
    return () => tl.kill();
  }, [layouts]);

  // --- Lever #1: hover/select overshoot — springy pop instead of linear lerp ------------
  useEffect(() => {
    nodes.current.forEach((node, i) => {
      if (!node) return;
      const active = i === hovered || i === selected ? 1 : 0;
      gsap.to(node, {
        activeT: active,
        duration: reducedMotion ? 0 : 0.45,
        ease: 'back.out(2.2)',
        overwrite: 'auto',
      });
    });
  }, [hovered, selected]);

  // --- Live search: tween each node to dim (-1), neutral (0), or blaze (+1) -------------
  useEffect(() => {
    nodes.current.forEach((node, i) => {
      if (!node) return;
      const target = matches == null ? 0 : matches.has(i) ? 1 : -1;
      gsap.to(node, {
        searchT: target,
        duration: reducedMotion ? 0 : 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  }, [matches]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const p = progressRef.current;
    const { a, b, t } = layoutBlend(p);
    const A = layouts[a];
    const B = layouts[b];

    if (p < 0.3 && !reducedMotion) group.rotation.y += delta * 0.05;
    else group.rotation.y = THREE.MathUtils.damp(group.rotation.y, 0, 3, delta);

    const k = 1 - Math.exp(-delta * 4);

    for (let i = 0; i < n; i++) {
      const ix = i * 3;
      target[ix] = A[ix] + (B[ix] - A[ix]) * t;
      target[ix + 1] = A[ix + 1] + (B[ix + 1] - A[ix + 1]) * t;
      target[ix + 2] = A[ix + 2] + (B[ix + 2] - A[ix + 2]) * t;

      current[ix] += (target[ix] - current[ix]) * k;
      current[ix + 1] += (target[ix + 1] - current[ix + 1]) * k;
      current[ix + 2] += (target[ix + 2] - current[ix + 2]) * k;

      const node = nodes.current[i];
      if (node) {
        node.mesh.position.set(current[ix], current[ix + 1], current[ix + 2]);
        // data-driven base × entrance (0→1) × hover-pop (1 → 1.6). GSAP owns enterT/activeT.
        const scale = layouts.scale[i] * node.enterT * (1 + 0.6 * node.activeT);
        node.mesh.scale.setScalar(scale);

        // Hover/select glow, then search dim/blaze layered on top. (searchT: -1..+1)
        let emiss = BASE_EMISSIVE + (ACTIVE_EMISSIVE - BASE_EMISSIVE) * node.activeT;
        const s = node.searchT;
        if (s < 0) emiss *= 1 + s * (1 - SEARCH_DIM); // s=-1 → ×0.1
        else if (s > 0) emiss += s * SEARCH_BLAZE;
        node.material.emissiveIntensity = emiss;

        if (s > 0.001) {
          node.material.emissive.copy(tmpColor.copy(baseColors[i]).lerp(blazeColor, s));
        } else {
          node.material.emissive.copy(baseColors[i]);
        }
      }
    }

    // Publish world positions (account for group rotation) for camera + labels.
    if (sharedPositions) {
      const ry = group.rotation.y;
      const cos = Math.cos(ry);
      const sin = Math.sin(ry);
      for (let i = 0; i < n; i++) {
        const ix = i * 3;
        const x = current[ix];
        const z = current[ix + 2];
        sharedPositions[ix] = x * cos + z * sin;
        sharedPositions[ix + 1] = current[ix + 1];
        sharedPositions[ix + 2] = -x * sin + z * cos;
      }
    }
  });

  return (
    <group ref={groupRef}>
      {layouts.meta.map((m, i) => (
        <LogoNode
          key={i}
          index={i}
          meta={m}
          sectorHex={sectorColor(m.sector)}
          register={register}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
