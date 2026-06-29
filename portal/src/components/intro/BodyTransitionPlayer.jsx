import BodyTransitionComposition from './BodyTransitionComposition';
import RemotionOverlayPlayer from './RemotionOverlayPlayer';

export default function BodyTransitionPlayer({ name, color, onEnded }) {
  return (
    <RemotionOverlayPlayer
      component={BodyTransitionComposition}
      inputProps={{ name, color }}
      durationInFrames={24}
      onEnded={onEnded}
      zIndex={9}
    />
  );
}
