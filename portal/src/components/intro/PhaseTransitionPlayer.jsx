import PhaseTransitionComposition from './PhaseTransitionComposition';
import RemotionOverlayPlayer from './RemotionOverlayPlayer';

export default function PhaseTransitionPlayer({ from, to, onEnded }) {
  return (
    <RemotionOverlayPlayer
      component={PhaseTransitionComposition}
      inputProps={{ from, to }}
      durationInFrames={28}
      onEnded={onEnded}
      zIndex={8}
    />
  );
}
