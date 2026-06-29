import PortalTransitionComposition from './PortalTransitionComposition';
import RemotionOverlayPlayer from './RemotionOverlayPlayer';

export default function PortalTransitionPlayer({ target, onMidpoint, onEnded }) {
  return (
    <RemotionOverlayPlayer
      component={PortalTransitionComposition}
      inputProps={{ target }}
      durationInFrames={31}
      midpointFrame={15}
      onMidpoint={onMidpoint}
      onEnded={onEnded}
      zIndex={30}
      blockInteraction
    />
  );
}
