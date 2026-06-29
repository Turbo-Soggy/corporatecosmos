import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const STEPS = [
  { eyebrow: '01 · PORTFOLIO', title: 'See the whole market', body: 'KPIs and sectors summarize the same companies orbiting in the Cosmos.' },
  { eyebrow: '02 · SIGNALS', title: 'Find the outliers', body: 'Compare valuation, growth, geography, and profitability without mixing currencies.' },
  { eyebrow: '03 · TRAVERSE', title: 'Jump back into 3D', body: 'Select any chart point or company row to fly directly to that body.' },
];

function StoryCard({ step, localFrame, fps, stats }) {
  const enter = spring({ frame: localFrame, fps, config: { damping: 18, stiffness: 150 } });
  const opacity = interpolate(localFrame, [0, 7, 31, 39], [0, 1, 1, 0], CLAMP);
  return (
    <div style={{ opacity, transform: `translateY(${(1 - enter) * 22}px)` }}>
      <div style={{ color: '#5EEAD4', fontSize: 10, letterSpacing: '0.28em' }}>{step.eyebrow}</div>
      <div style={{ color: '#E6EDF7', fontSize: 34, fontWeight: 650, marginTop: 10 }}>{step.title}</div>
      <div style={{ color: '#9FB0C8', fontSize: 15, lineHeight: 1.6, marginTop: 12, maxWidth: 560 }}>{step.body}</div>
      {localFrame > 8 && (
        <div style={{ color: '#64748B', fontSize: 11, letterSpacing: '0.14em', marginTop: 22 }}>
          {stats.total} COMPANIES · {stats.sectors} SECTORS · PRIMARY COHORT {stats.currency}
        </div>
      )}
    </div>
  );
}

export default function DashboardStoryComposition({ stats }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const backdrop = interpolate(frame, [0, 8, 110, 119], [0, 0.82, 0.82, 0], CLAMP);
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `rgba(2,6,23,${backdrop})`,
        fontFamily: '"Space Grotesk", Inter, sans-serif',
      }}
    >
      <AbsoluteFill style={{ justifyContent: 'center', padding: '0 10vw' }}>
        {STEPS.map((step, index) => (
          <Sequence key={step.eyebrow} from={index * 40} durationInFrames={40} layout="none">
            <StoryCard step={step} localFrame={frame - index * 40} fps={fps} stats={stats} />
          </Sequence>
        ))}
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: '10vw', right: '10vw', bottom: 42, height: 1, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${Math.min(100, (frame / 119) * 100)}%`, height: 1, background: '#5EEAD4' }} />
      </div>
    </AbsoluteFill>
  );
}
