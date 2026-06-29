import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export default function PhaseTransitionComposition({ from, to }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 18, stiffness: 160 } });
  const opacity = interpolate(frame, [0, 4, 19, 27], [0, 1, 1, 0], CLAMP);
  const sweep = interpolate(frame, [0, 27], [-15, 115], CLAMP);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(100deg, transparent ${sweep - 8}%, rgba(94,234,212,0.08) ${sweep}%, transparent ${sweep + 8}%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 28,
          top: '46%',
          transform: `translateY(${(1 - enter) * 18}px)`,
          borderLeft: '2px solid #5EEAD4',
          padding: '8px 14px',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
        }}
      >
        <div style={{ color: '#64748B', fontSize: 10 }}>{from?.label || 'COSMOS'} →</div>
        <div style={{ color: '#E6EDF7', fontSize: 18, marginTop: 5 }}>{to?.code} · {to?.label}</div>
      </div>
    </AbsoluteFill>
  );
}
