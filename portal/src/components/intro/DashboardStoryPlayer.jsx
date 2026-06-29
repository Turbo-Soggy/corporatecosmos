import DashboardStoryComposition from './DashboardStoryComposition';
import RemotionOverlayPlayer from './RemotionOverlayPlayer';

export default function DashboardStoryPlayer({ stats, onEnded }) {
  return (
    <RemotionOverlayPlayer
      component={DashboardStoryComposition}
      inputProps={{ stats }}
      durationInFrames={120}
      onEnded={onEnded}
      zIndex={25}
      blockInteraction
    />
  );
}
