# The Corporate Cosmos

Immersive, scroll-driven WebGL portal visualizing 118 companies from Supabase.
Built with Vite + React, `@react-three/fiber` / `drei`, GSAP ScrollTrigger, Tailwind.

## Architecture in one breath

- **One fetch, no cascades.** `useCompanies` pulls every row's `full_json` from the
  `company_json` table in a single query (~750 KB total) and keeps it in memory.
- **Parse once, never per frame.** `lib/parseMetric.js` turns strings like `"$64.1B"`
  or `"740,000 employees"` into numbers; `lib/layouts.js` uses them to precompute the
  three spatial layouts a single time (memoized).
- **One InstancedMesh for all 118 nodes.** `CompanyNodes` interpolates positions in
  `useFrame` toward scroll-derived targets — no per-node React components.
- **Scripted camera.** `CameraRig` lerps through galaxy → financial → geographic
  framings, and snaps to a node on click.

## Scroll journey

| Progress | Phase | Layout |
|---|---|---|
| 0–35% | The Galaxy | Rotating Fibonacci-sphere cloud |
| 35–65% | Financial Axis | X = valuation, Y = YoY growth |
| 65–100% | Geographic Clusters | Regional pockets from HQ/office text |

## Run

```bash
cd portal
npm install
cp .env.example .env      # then fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

The app reads the **public anon key** only. Ensure row-level security / a read
policy allows `select` on `public.company_json`.

## File map

```
src/
  App.jsx                     state + scroll-driver wiring
  lib/
    parseMetric.js            "$64.1B" -> 64100000000
    supabaseClient.js         env-driven client
    useCompanies.js           single bulk fetch of full_json
    layouts.js                3 precomputed position buffers + meta
    phases.js                 shared phase math (3D + HUD)
  hooks/useScrollProgress.js  GSAP ScrollTrigger -> progress ref + state
  components/
    CosmosCanvas.jsx          fixed R3F canvas
    CompanyNodes.jsx          InstancedMesh + per-frame interpolation
    CameraRig.jsx             scripted/selection camera
    hud/                      glassmorphic overlay (phase, cards, tooltip, panel)
```
