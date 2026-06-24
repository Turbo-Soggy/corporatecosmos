// Read once at load. Used by the 3D scene to drop idle orbit / camera drift so
// the experience honors prefers-reduced-motion (DOM transitions handled in CSS).
export const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
