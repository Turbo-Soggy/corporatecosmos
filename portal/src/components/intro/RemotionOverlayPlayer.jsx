import { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';

// Shared deterministic lifecycle for short transparent Remotion overlays.
export default function RemotionOverlayPlayer({
  component,
  inputProps,
  durationInFrames,
  onEnded,
  onMidpoint,
  midpointFrame,
  zIndex = 20,
  fps = 30,
  blockInteraction = false,
}) {
  const playerRef = useRef(null);
  const completedRef = useRef(false);
  const midpointRef = useRef(false);
  const callbacksRef = useRef({ onEnded, onMidpoint });
  callbacksRef.current = { onEnded, onMidpoint };
  const size = useRef({
    width: Math.max(640, Math.round(window.innerWidth)),
    height: Math.max(360, Math.round(window.innerHeight)),
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return undefined;
    const complete = () => {
      if (completedRef.current) return;
      if (midpointFrame != null && !midpointRef.current) {
        midpointRef.current = true;
        callbacksRef.current.onMidpoint?.();
      }
      completedRef.current = true;
      callbacksRef.current.onEnded?.();
    };
    const onFrame = ({ detail }) => {
      if (midpointFrame != null && detail.frame >= midpointFrame && !midpointRef.current) {
        midpointRef.current = true;
        callbacksRef.current.onMidpoint?.();
      }
      if (detail.frame >= durationInFrames - 1) complete();
    };
    player.addEventListener('ended', complete);
    player.addEventListener('frameupdate', onFrame);
    player.seekTo(0);
    player.play();
    const fallback = window.setTimeout(complete, (durationInFrames / fps) * 1000 + 600);
    return () => {
      window.clearTimeout(fallback);
      player.removeEventListener('ended', complete);
      player.removeEventListener('frameupdate', onFrame);
    };
  }, [durationInFrames, fps, midpointFrame]);

  return (
    <Player
      ref={playerRef}
      component={component}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      fps={fps}
      compositionWidth={size.current.width}
      compositionHeight={size.current.height}
      autoPlay
      initiallyMuted
      controls={false}
      loop={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      acknowledgeRemotionLicense
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex,
        pointerEvents: blockInteraction ? 'auto' : 'none',
        background: 'transparent',
      }}
    />
  );
}
