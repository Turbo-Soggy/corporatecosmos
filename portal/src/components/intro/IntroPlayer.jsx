import { useEffect, useRef } from 'react';
import { Player } from '@remotion/player';
import IntroComposition from './IntroComposition';

// Plays the cold-open composition fullscreen above everything (z-20). The live
// cosmos mounts underneath during these 3 seconds so there's no cold-start when
// we fade out. `@remotion/player` surfaces lifecycle via the ref, not props —
// the 'ended' event is the handoff signal. https://www.remotion.dev/docs/player
export default function IntroPlayer({ galaxy, scales, colors, onEnded }) {
  const playerRef = useRef(null);
  const completedRef = useRef(false);
  // Fixed composition size in CSS px; the player scales it to fill the screen.
  const size = useRef({
    w: Math.max(640, Math.round(window.innerWidth)),
    h: Math.max(360, Math.round(window.innerHeight)),
  });

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const complete = () => {
      if (completedRef.current) return;
      completedRef.current = true;
      onEnded();
    };
    const onFrame = ({ detail }) => {
      if (detail.frame >= 89) complete();
    };
    player.addEventListener('ended', complete);
    player.addEventListener('frameupdate', onFrame);
    player.seekTo(0);
    player.play();
    // Some browser/visibility combinations stop on the last frame without
    // emitting `ended`. Never leave an invisible Player mounted forever.
    const fallback = window.setTimeout(complete, 3800);
    return () => {
      window.clearTimeout(fallback);
      player.removeEventListener('ended', complete);
      player.removeEventListener('frameupdate', onFrame);
    };
  }, [onEnded]);

  return (
    <Player
      ref={playerRef}
      component={IntroComposition}
      inputProps={{ galaxy, scales, colors }}
      durationInFrames={90}
      fps={30}
      compositionWidth={size.current.w}
      compositionHeight={size.current.h}
      autoPlay
      initiallyMuted
      loop={false}
      controls={false}
      clickToPlay={false}
      doubleClickToFullscreen={false}
      // Silences the console license notice. NOTE: Remotion needs a paid company
      // license for orgs above its free tier — see https://remotion.dev/license
      acknowledgeRemotionLicense
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 20, background: 'transparent' }}
    />
  );
}
