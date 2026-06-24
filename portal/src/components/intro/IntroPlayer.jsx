import { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import IntroComposition from './IntroComposition';

// Plays the cold-open composition fullscreen above everything (z-20). The live
// cosmos mounts underneath during these 3 seconds so there's no cold-start when
// we fade out. `@remotion/player` surfaces lifecycle via the ref, not props —
// the 'ended' event is the handoff signal. https://www.remotion.dev/docs/player
export default function IntroPlayer({ onEnded }) {
  const playerRef = useRef(null);
  // Fixed composition size in CSS px; the player scales it to fill the screen.
  const size = useRef({
    w: Math.max(640, Math.round(window.innerWidth)),
    h: Math.max(360, Math.round(window.innerHeight)),
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    player.addEventListener('ended', onEnded);
    return () => player.removeEventListener('ended', onEnded);
  }, [onEnded]);

  return (
    <Player
      ref={playerRef}
      component={IntroComposition}
      durationInFrames={90}
      fps={30}
      compositionWidth={size.current.w}
      compositionHeight={size.current.h}
      autoPlay
      loop={false}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      // Silences the console license notice. NOTE: Remotion needs a paid company
      // license for orgs above its free tier — see https://remotion.dev/license
      acknowledgeRemotionLicense
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 20, background: '#020617' }}
    />
  );
}
