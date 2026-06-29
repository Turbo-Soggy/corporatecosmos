import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

export default function PortalTransitionComposition({ target }) {
  const frame = useCurrentFrame();
  const radius = frame <= 15
    ? interpolate(frame, [0, 15], [0, 82], CLAMP)
    : interpolate(frame, [15, 30], [82, 0], CLAMP);
  const ringOpacity = interpolate(frame, [0, 7, 23, 30], [0, 1, 1, 0], CLAMP);
  const label = target === 'dashboard' ? 'ENTERING DATA SPACE' : 'RETURNING TO COSMOS';

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#020617',
          clipPath: `circle(${radius}% at 50% 50%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: `${radius * 2}vmin`,
          height: `${radius * 2}vmin`,
          transform: 'translate(-50%, -50%)',
          border: '1px solid rgba(94,234,212,0.7)',
          borderRadius: '50%',
          boxShadow: '0 0 48px rgba(94,234,212,0.2)',
          opacity: ringOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#E6EDF7',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 11,
          letterSpacing: '0.28em',
          opacity: ringOpacity,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </div>
    </AbsoluteFill>
  );
}
