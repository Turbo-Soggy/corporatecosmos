import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Bridges DOM scroll -> animation. Returns:
//  - triggerRef: attach to the tall scroll spacer.
//  - progressRef: a live { current: 0..1 } read INSIDE useFrame (no re-renders).
//  - progress: throttled React state for the DOM HUD.
//
// `ready` MUST be true only once the spacer div is actually in the DOM. On first
// paint the app shows the loading splash (no spacer), so creating the trigger then
// would silently bail and — with a static dep array — never retry after data loads.
// Gating on `ready` re-runs the effect exactly when the spacer mounts (and tears
// the trigger down + rebuilds it when we leave/re-enter the cosmos view).
export function useScrollProgress(ready) {
  const triggerRef = useRef(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!ready) return;
    const el = triggerRef.current;
    if (!el) return;

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      // Lever #4: snap to the three settled layouts (galaxy / financial / geographic). These
      // anchors land exactly where layoutBlend() reports t=0, so sections never rest mid-blend.
      snap: {
        snapTo: [0, 0.5, 1],
        duration: { min: 0.2, max: 0.6 },
        ease: 'power1.inOut',
      },
      onUpdate: (self) => {
        progressRef.current = self.progress; // smooth source for useFrame
        setProgress(self.progress); // GSAP already throttles to rAF
      },
    });

    // The spacer mounts in the same commit that flips `ready`; refresh so the
    // trigger measures the now-tall document instead of the splash's height.
    ScrollTrigger.refresh();

    return () => st.kill();
  }, [ready]);

  return { triggerRef, progressRef, progress };
}
