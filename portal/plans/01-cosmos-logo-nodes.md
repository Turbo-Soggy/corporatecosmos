# Plan 01 — Cosmos nodes: InstancedMesh → 118 logo-textured meshes

Refactor `CompanyNodes` from one `InstancedMesh` into a map-loop of 118 individual
`<mesh>` components so each node can carry its own logo texture, while preserving the
existing per-frame blend/hover animation, sector-emissive look, env reflections, and bloom.

Execution-ready for `/claude-mem:do`. Each phase has copy-ready code, exact file refs, and a
verification gate. **Read Phase 0 first — it records facts confirmed against the live DB and
the existing code; do not re-assume them.**

---

## Phase 0 — Discovery (CONFIRMED, do not re-derive)

### Confirmed facts (checked against Supabase `company_json` + current source)

| Question | Answer | Evidence |
|---|---|---|
| Is `domain` a field? | **No.** Derive from `website_url`. | `jsonb_object_keys` scan — no `domain`; `website_url` present 118/118, 113 cleanly parseable. |
| Is `logo_url` present? | Yes, 118/118 — **but** 85 are SVG, 19 are `;`-joined multi-URL, only **43 raster**. | key-scan + regex counts on live data. |
| Is `<Environment>` present? | **Already added** at `CosmosCanvas.jsx:52` (`preset="city"`). Requirement #4 = DONE. | file read. |
| Prior material? | **Lit** `meshPhysicalMaterial` InstancedMesh + animated simplex-noise emissive shader patch + lights + env + bloom. NOT "unlit." | `CompanyNodes.jsx:22-129,254-264`. |
| Where does node metadata come from? | `layouts.meta[i]` built in `buildLayouts` (`layouts.js:102-112`). Does NOT yet carry `logo_url`/`domain`. | file read. |
| Sector → color map | `sectorColor(sector)` in `sectors.js:45-47`; 11 buckets. This is the emissive source. | file read. |
| Company name for letter fallback | `meta.name = short_name || name` (`layouts.js:104`). | file read. |

### Decisions locked (by user, this session)
1. **Fallback chain = exactly 3 steps:** first **raster** URL inside `logo_url` → Clearbit
   `https://logo.clearbit.com/{domain}` → procedural letter. SVGs are skipped (TextureLoader
   can't rasterize them reliably), so the *dominant successful path will be Clearbit*. That is
   expected and acceptable.
2. **Emissive = plain category color** (`emissive=sectorHex`, `emissiveIntensity=1.5`,
   `toneMapped=false`). **Drop** the `vColor`/simplex-noise corona patch — it depends on
   `instanceColor`, which does not exist on individual meshes, and competes with the logo map.
3. Adopt the spec material params (`roughness 0.15`, `metalness 0.8`) over the old
   `0.8 / 0.1` — they were chosen deliberately to read as glossy logo-orbs under the env map.

### Allowed APIs (verified present — `package.json`)
- `three@^0.169.0`: `THREE.SphereGeometry`, `THREE.TextureLoader` (`.setCrossOrigin`,
  `.load(url, onLoad, onProgress, onError)`), `THREE.CanvasTexture`, `THREE.SRGBColorSpace`,
  `THREE.MathUtils.damp`, `Texture.dispose()`.
- `@react-three/fiber@^8.17.10`: `useFrame`, JSX `<mesh>`, `<group>`, ref-based imperative
  transforms; `dispose={null}` to opt a node out of auto-disposing shared resources.
- `@react-three/drei@^9.114.0`: `<Environment preset="city" />` — already mounted.
- `@react-three/postprocessing`: `<Bloom>` already mounted (`CosmosCanvas.jsx:73-80`).

### Anti-patterns to AVOID (will break this refactor)
- ❌ **Drei `useTexture`** — Suspense-based; no clean per-instance fallback-on-error. (User-excluded.)
- ❌ **`setState` per frame** across 118 components — drive transforms imperatively via refs in ONE parent `useFrame`. Texture *resolution* (a few swaps total) may use state.
- ❌ **Starting a material with `map={null}` then adding a map later** — flips the `USE_MAP`
  define → **118 staggered shader recompiles** → mount stutter. Every material must own a map
  (the procedural placeholder) **from frame 0**; later we only swap the binding.
- ❌ **`material.needsUpdate = true` on texture swap** — forces a recompile. Just assign `material.map`.
- ❌ **Loading remote images without `crossOrigin='anonymous'`** — taints the WebGL context.
  (With it set, CORS-less corporate CDNs simply `onError` → fall through. That's intended.)
- ❌ **Disposing the shared geometry** when one mesh unmounts — guard with `dispose={null}`.
- ❌ **Treating raw `logo_url` as one URL** — split on `;`/`,` first (19 rows are multi-URL).
- ❌ Re-adding `<Environment>` — it already exists; do not duplicate.

### Performance budget (the user explicitly asked for this)
- **Draw calls:** 1 → 118. ~1k tris/sphere × 118 ≈ 118k tris — trivial; 118 draws is well within
  any GPU's comfortable range. Steady-state cost ≈ **+0.2–0.5 ms/frame**.
- **Shader programs:** all 118 materials share ONE program (identical defines once every
  material has a map from frame 0) — **no compile storm** if placeholder-first is honored.
- **Texture memory:** every texture downscaled to **128×128 RGBA** ≈ 65 KB; 118 ≈ **~7.7 MB** GPU.
  (256² would be ~31 MB — 128² chosen.)
- **Mount stall:** **none by design.** Each node renders its procedural letter *synchronously*
  on mount (zero network) → scene is fully interactive immediately. Remote logos resolve
  async and swap in progressively (the requested "dim placeholder until resolved" treatment).
  Optional concurrency cap (≤12 in-flight) tames the request burst.

---

## Phase 1 — Thread `logo_url` + derived `domain` into node metadata

**File:** `portal/src/lib/layouts.js`

In `buildLayouts`, extend the `meta` objects (`layouts.js:102-112`) with two fields. Import the
domain helper from the new util (Phase 2).

```js
import { domainFromUrl } from './logoTexture';
// ...
const meta = companies.map((c, i) => ({
  index: i,
  name: c.short_name || c.name,
  fullName: c.name,
  category: c.category,
  sector: c.sector,
  region: regions[i],
  valuation: valuation[i],
  valuationDisplay: c.display.valuation,
  growthDisplay: c.display.yoy_growth_rate,
  logoUrl: c.logo_url ?? null,            // NEW — raw, may be multi-URL/SVG
  domain: domainFromUrl(c.website_url),   // NEW — derived; null if unparseable
}));
```

**Verify:** `grep -n "logoUrl\|domain" portal/src/lib/layouts.js` shows both fields.
Non-breaking for `NodeLabels`/HUD (additive).

---

## Phase 2 — Texture loading / fallback utility (NEW FILE)

**File:** `portal/src/lib/logoTexture.js`

Owns: domain derivation, the 3-step fallback chain, URL-keyed cache with in-flight dedupe +
optional concurrency cap, downscaling, procedural letter texture, and disposal. Uses raw
`THREE.TextureLoader` (per requirement). Exposes a React hook `useLogoTexture` and a
`disposeLogoCache()` for scene teardown.

```js
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const TEX_SIZE = 128;          // downscale target (≈65 KB/texture)
const MAX_INFLIGHT = 12;       // concurrency cap on remote loads
const RASTER = /\.(png|jpe?g|webp|gif)(\?|#|$)/i;

const loader = new THREE.TextureLoader();
loader.setCrossOrigin('anonymous');

// --- URL -> Promise<Texture> cache (shared across nodes, deduped) -------------
const remoteCache = new Map(); // url -> Promise<THREE.Texture>
let inflight = 0;
const queue = [];

function pump() {
  while (inflight < MAX_INFLIGHT && queue.length) {
    const job = queue.shift();
    inflight++;
    job().finally(() => { inflight--; pump(); });
  }
}

/** Derive a clearbit-ready domain from a website url. null if unparseable. */
export function domainFromUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/** First http raster URL inside a (possibly `;`/`,`-joined) logo_url. Skips SVG. */
function firstRasterUrl(raw) {
  if (!raw) return null;
  const parts = String(raw).split(/[;,]\s*/).map((p) => p.trim()).filter(Boolean);
  return parts.find((u) => /^https?:\/\//i.test(u) && RASTER.test(u)) || null;
}

/** Draw any loaded image 'contain'-fitted onto a dark TEX_SIZE canvas -> CanvasTexture. */
function downscale(image) {
  const c = document.createElement('canvas');
  c.width = c.height = TEX_SIZE;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const iw = image.width || TEX_SIZE;
  const ih = image.height || TEX_SIZE;
  const s = Math.min(TEX_SIZE / iw, TEX_SIZE / ih);
  const w = iw * s, h = ih * s;
  ctx.drawImage(image, (TEX_SIZE - w) / 2, (TEX_SIZE - h) / 2, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** Procedural: first letter of name on a dark, sector-tinted disc. Length-agnostic. */
function makeLetterTexture(name, sectorHex) {
  const c = document.createElement('canvas');
  c.width = c.height = TEX_SIZE;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b1120';
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);
  const letter = ((name && name.trim()[0]) || '?').toUpperCase();
  ctx.fillStyle = sectorHex || '#94a3b8';
  ctx.font = '700 72px "Space Grotesk", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, TEX_SIZE / 2, TEX_SIZE / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Cached + concurrency-limited remote load via THREE.TextureLoader. */
function loadRemote(url) {
  if (remoteCache.has(url)) return remoteCache.get(url);
  const p = new Promise((resolve, reject) => {
    queue.push(() => new Promise((done) => {
      loader.load(
        url,
        (tex) => {
          const small = downscale(tex.image);
          tex.dispose();           // free full-size source immediately
          resolve(small);
          done();
        },
        undefined,
        () => { reject(new Error(`logo load failed: ${url}`)); done(); },
      );
    }));
    pump();
  });
  remoteCache.set(url, p);
  // On failure, evict so a future node could retry (and so we don't cache rejections forever).
  p.catch(() => remoteCache.delete(url));
  return p;
}

/** Dispose every shared remote texture. Call when the whole scene unmounts. */
export function disposeLogoCache() {
  for (const p of remoteCache.values()) p.then((t) => t.dispose()).catch(() => {});
  remoteCache.clear();
}

/**
 * Returns the texture to render NOW. Starts as the procedural letter (instant, no network),
 * then async-swaps to the first resolving logo. Procedural is disposed once replaced; on
 * unmount the still-shown procedural is disposed. Shared remote textures live until
 * disposeLogoCache().
 */
export function useLogoTexture({ name, logoUrl, domain, sectorHex }) {
  const proceduralRef = useRef(null);
  const [texture, setTexture] = useState(() => {
    const t = makeLetterTexture(name, sectorHex);
    proceduralRef.current = t;
    return t;
  });

  useEffect(() => {
    let alive = true;
    const candidates = [];
    const raster = firstRasterUrl(logoUrl);
    if (raster) candidates.push(raster);
    if (domain) candidates.push(`https://logo.clearbit.com/${domain}?size=${TEX_SIZE}`);

    (async () => {
      for (const url of candidates) {
        try {
          const tex = await loadRemote(url);
          if (!alive) return;            // unmounted mid-flight; cache keeps the texture
          setTexture(tex);
          if (proceduralRef.current) {   // dispose the placeholder we just replaced
            proceduralRef.current.dispose();
            proceduralRef.current = null;
          }
          return;                        // stop at first success
        } catch {
          /* try next candidate */
        }
      }
    })();

    return () => {
      alive = false;
      if (proceduralRef.current) {
        proceduralRef.current.dispose();
        proceduralRef.current = null;
      }
    };
  }, [name, logoUrl, domain, sectorHex]);

  return texture;
}
```

**Verify:**
- `grep -n "useTexture" portal/src` → **no matches** (Drei hook not used).
- `grep -n "setCrossOrigin\|crossOrigin" portal/src/lib/logoTexture.js` → present.
- `firstRasterUrl("a.svg; b.png")` returns `b.png`; `firstRasterUrl("only.svg")` returns `null`.
- `domainFromUrl("https://www.tcs.com")` → `tcs.com`.

---

## Phase 3 — Refactor `CompanyNodes` into a map-loop of individual meshes

**File:** `portal/src/components/CompanyNodes.jsx` (replace the InstancedMesh body)

Key structure: shared module-level geometry; one `<group>` rotating as before; the existing
per-frame blend math **unchanged**, but it now writes into per-node mesh refs and lerps each
material's `emissiveIntensity` for the hover/active glow (replacing the old `instanceColor`
gain). Each `LogoNode` owns its material + texture.

```jsx
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { layoutBlend } from '../lib/phases';
import { reducedMotion } from '../lib/motion';
import { sectorColor } from '../lib/sectors';
import { useLogoTexture, disposeLogoCache } from '../lib/logoTexture';

// REQUIREMENT #1: one shared geometry, reused across all 118 meshes.
const NODE_GEOMETRY = new THREE.SphereGeometry(0.55, 24, 24);

const BASE_EMISSIVE = 1.5;     // REQUIREMENT #3
const ACTIVE_EMISSIVE = 2.6;   // hover/selected glow (was the old ACTIVE_GAIN)

function LogoNode({ index, meta, sectorHex, register, onHover, onSelect }) {
  const meshRef = useRef(null);
  const matRef = useRef(null);
  // Per-node material instance (required for unique textures). Starts on the procedural
  // letter so the material owns a map from frame 0 → texture swaps never recompile.
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
      onPointerMove={(e) => { e.stopPropagation(); onHover(index, e.clientX, e.clientY); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); }}
      onClick={(e) => { e.stopPropagation(); onSelect(index); }}
    >
      <meshPhysicalMaterial
        ref={matRef}
        map={texture}              // logo / clearbit / procedural — resolved by the hook
        emissive={sectorHex}       // REQUIREMENT #3: category color, not `color`
        emissiveIntensity={BASE_EMISSIVE}
        roughness={0.15}
        metalness={0.8}
        toneMapped={false}
        envMapIntensity={0.6}      // picks up the existing <Environment preset="city" />
      />
    </mesh>
  );
}

/**
 * 118 individual meshes. Positions/scale/sharedPositions are driven imperatively by ONE
 * useFrame (no per-node React state per frame); only texture resolution uses state.
 */
export default function CompanyNodes({
  layouts,
  progressRef,
  sharedPositions,
  hovered,
  selected,
  onHover,
  onSelect,
}) {
  const groupRef = useRef(null);
  const n = layouts.count;
  const nodes = useRef([]); // [{ mesh, material }] by index

  const register = useCallback((i, mesh, material) => {
    nodes.current[i] = mesh && material ? { mesh, material } : null;
  }, []);

  const current = useMemo(() => Float32Array.from(layouts.galaxy), [layouts]);
  const target = useMemo(() => new Float32Array(n * 3), [n]);
  const curScale = useMemo(() => Float32Array.from(layouts.scale), [layouts]);

  useEffect(() => () => disposeLogoCache(), []); // free shared textures on scene unmount

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

      const isActive = i === hovered || i === selected;
      const wantScale = layouts.scale[i] * (isActive ? 1.6 : 1);
      curScale[i] += (wantScale - curScale[i]) * k;

      const node = nodes.current[i];
      if (node) {
        node.mesh.position.set(current[ix], current[ix + 1], current[ix + 2]);
        node.mesh.scale.setScalar(curScale[i]);
        const wantE = isActive ? ACTIVE_EMISSIVE : BASE_EMISSIVE;
        node.material.emissiveIntensity += (wantE - node.material.emissiveIntensity) * k;
      }
    }

    // Publish world positions (account for group rotation) for camera + labels. UNCHANGED.
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
```

**What carries over unchanged:** the `layoutBlend` A/B interpolation, the `k = 1-exp(-delta*4)`
smoothing, the `1.6×` active scale bump, the group-rotation logic, and the `sharedPositions`
publish (so `CameraRig` + `NodeLabels` keep working with zero changes).

**What changes:** `instanceColor` HDR-gain animation → per-material `emissiveIntensity` lerp;
`setMatrixAt`/`instanceMatrix` → per-mesh `position`/`scale`; the `vColor` simplex-noise shader
patch (`CompanyNodes.jsx:8-129,254-264`) is **deleted**.

**Anti-pattern guards:** no `setState` in `useFrame`; material owns a map from frame 0
(placeholder) so swaps don't recompile; `dispose={null}` protects the shared geometry; no
`material.needsUpdate=true` on swap.

---

## Phase 4 — Material declaration (already inline in Phase 3) + Environment

- **Material** is declared inside `LogoNode` (Phase 3): `meshPhysicalMaterial` with `map`,
  `emissive=sectorHex`, `emissiveIntensity=1.5`, `roughness=0.15`, `metalness=0.8`,
  `toneMapped=false`, `envMapIntensity=0.6`. Matches the rest of the scene (the prior pass also
  used `meshPhysicalMaterial`), so Physical is retained.
- **Environment (#4):** **NO CHANGE.** `<Environment preset="city" />` already exists at
  `CosmosCanvas.jsx:52`, once at the canvas root. Confirm it is still there; do not add a second.

**Verify:** `grep -n "Environment" portal/src/components/CosmosCanvas.jsx` → exactly one match.

---

## Phase 5 — Bloom tuning check (light touch)

The old look pushed `instanceColor` into HDR (`>1`) so emissive bloomed past
`luminanceThreshold=0.8` (`CosmosCanvas.jsx:74-79`). Now glow comes from
`emissive=sectorHex × emissiveIntensity(1.5)` with `toneMapped=false`. The bright sector hexes
(e.g. `#22d3ee`) × 1.5 already exceed 0.8, so bloom should fire — but the logo albedo (a lit
surface) sits on top. After Phase 3 runs, eyeball it; if nodes look flat, nudge
`emissiveIntensity` base toward `1.8` or drop `luminanceThreshold` to `~0.7`. **Do not** change
bloom blindly before seeing it. This is a tuning gate, not a code requirement.

---

## Phase 6 — Final verification

1. **Build:** `cd portal && npm run build` → compiles with no errors.
2. **Anti-pattern greps:**
   - `grep -rn "useTexture" portal/src` → none.
   - `grep -rn "instancedMesh\|instanceColor\|setMatrixAt\|patchEmissive\|snoise" portal/src/components/CompanyNodes.jsx` → none (old path fully removed).
   - `grep -rn "Environment" portal/src/components/CosmosCanvas.jsx` → exactly one.
   - `grep -n "dispose={null}" portal/src/components/CompanyNodes.jsx` → present (shared-geometry guard).
3. **Runtime (`npm run dev`):**
   - Scene is interactive immediately on load; every node shows a sector-tinted letter disc
     within the first frame (no blank/stall).
   - Logos progressively swap in (watch Network: many `logo.clearbit.com` 200s, scattered
     corporate-CDN/​SVG failures — expected).
   - Hover/select still bumps scale `1.6×` and brightens the node; camera fly-to + labels
     still track (proves `sharedPositions` intact).
   - No `THREE.WebGLRenderer: tainted canvas` or CORS security errors in console
     (proves `crossOrigin` is set).
   - DevTools Memory: GPU texture footprint stays bounded (~8 MB), not climbing on
     hover/re-render (proves disposal works).
4. **Update graph:** `graphify update .` (per project CLAUDE.md) so the new
   `logoTexture.js` + refactored component are indexed.

### Known trade-offs (accepted)
- `dispose={null}` also opts each node's *material* out of R3F auto-disposal. Acceptable: the
  cosmos scene is persistent (single-page, 118 fixed nodes); the heavy GPU resource is the
  **texture**, which IS disposed (procedural per-node on swap/unmount; remote via
  `disposeLogoCache`). Materials are lightweight and live for the app's lifetime.
- Clearbit (`logo.clearbit.com`) is HubSpot-owned and not contractually guaranteed long-term.
  If it 404s broadly, the procedural letter is always the safety net. A `s2/favicons` 4th step
  was offered and declined; re-add later if Clearbit coverage drops.
