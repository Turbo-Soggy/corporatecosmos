import { useCallback, useEffect, useRef, useState } from 'react';

// Drives the "launch sequence": steps the selected node through an ordered list
// of indices (your top matches), flying the camera to each. The CameraRig turns
// each `selected` change into a cinematic fly-to; this hook only owns the timing.
const DWELL_MS = 4200; // how long the camera lingers at a stop before advancing

export function useFlightTour(onSelect, order) {
  const [pos, setPos] = useState(-1); // -1 = inactive
  const posRef = useRef(-1);
  const timer = useRef(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const goTo = useCallback(
    (p) => {
      if (!order.length) return;
      const clamped = Math.max(0, Math.min(p, order.length - 1));
      posRef.current = clamped;
      setPos(clamped);
      onSelect(order[clamped]);
    },
    [order, onSelect]
  );

  const start = useCallback(() => goTo(0), [goTo]);
  const next = useCallback(() => goTo(posRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(posRef.current - 1), [goTo]);
  const exit = useCallback(() => {
    clearTimer();
    posRef.current = -1;
    setPos(-1);
  }, []);

  // Auto-advance until the final stop, then hold there (still "active").
  useEffect(() => {
    if (pos < 0) return undefined;
    clearTimer();
    if (pos >= order.length - 1) return undefined;
    timer.current = setTimeout(() => goTo(pos + 1), DWELL_MS);
    return clearTimer;
  }, [pos, order, goTo]);

  // A new résumé (new order array) cancels any running tour.
  useEffect(() => exit, [order, exit]);

  return {
    active: pos >= 0,
    pos,
    total: order.length,
    atEnd: pos >= 0 && pos >= order.length - 1,
    currentIndex: pos >= 0 ? order[pos] : null,
    start,
    next,
    prev,
    exit,
  };
}
