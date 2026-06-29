import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

// Transparent targeting pass used while the camera acquires a newly selected body.
export default function BodyTransitionComposition({ name, color }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const acquire = spring({ frame, fps, config: { damping: 18, stiffness: 170 } });
  const fade = interpolate(frame, [14, 23], [1, 0], CLAMP);
  const ring = 180 - acquire * 104;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        opacity: fade,
        color: color || '#5EEAD4',
        fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      }}
    >
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div
          style={{
            width: ring,
            height: ring,
            border: '1px solid currentColor',
            borderRadius: '50%',
            boxShadow: '0 0 32px color-mix(in srgb, currentColor 35%, transparent)',
            opacity: 0.75,
          }}
        />
        <div style={{ position: 'absolute', width: 16, height: 1, background: 'currentColor' }} />
        <div style={{ position: 'absolute', width: 1, height: 16, background: 'currentColor' }} />
      </AbsoluteFill>

      <div
        style={{
          position: 'absolute',
          left: 28,
          bottom: 28,
          borderLeft: '2px solid currentColor',
          paddingLeft: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          fontSize: 11,
          lineHeight: 1.7,
        }}
      >
        <div style={{ opacity: 0.55 }}>TARGET LOCK</div>
        <div style={{ color: '#E6EDF7', fontSize: 13 }}>{name}</div>
      </div>
    </AbsoluteFill>
  );
}
