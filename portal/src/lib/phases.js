// Shared phase definition used by both the 3D scene and the DOM HUD so they
// never drift. Three layouts, soft cross-fades at the boundaries.

export const PHASES = [
  { id: 0, code: '01', label: 'THE GALAXY', blurb: 'All 118 companies, one rotating cloud.' },
  { id: 1, code: '02', label: 'FINANCIAL AXIS', blurb: 'Dispersed by valuation & YoY growth.' },
  { id: 2, code: '03', label: 'GEOGRAPHIC CLUSTERS', blurb: 'Grouped into regional pockets.' },
];

export function smoothstep(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

// Which discrete phase the HUD should show for a given 0..1 progress.
export function phaseIndexFor(p) {
  if (p < 0.35) return 0;
  if (p < 0.65) return 1;
  return 2;
}

// Continuous blend descriptor for the 3D layout interpolation.
// Returns { a, b, t } where a/b are layout keys and t is 0..1 between them.
export function layoutBlend(p) {
  if (p < 0.3) return { a: 'galaxy', b: 'galaxy', t: 0 };
  if (p < 0.4) return { a: 'galaxy', b: 'financial', t: smoothstep((p - 0.3) / 0.1) };
  if (p < 0.6) return { a: 'financial', b: 'financial', t: 0 };
  if (p < 0.7) return { a: 'financial', b: 'geographic', t: smoothstep((p - 0.6) / 0.1) };
  return { a: 'geographic', b: 'geographic', t: 0 };
}
