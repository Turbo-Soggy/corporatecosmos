import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { SECTOR_COLORS } from '../../lib/sectors';

// 3-second cold-open (90 frames @ 30fps) played by IntroPlayer while the WebGL
// scene warms up underneath. Pure SVG/CSS — no Three.js — so it costs nothing.
//   0–15  : "CORPORATE COSMOS" wordmark fades + scales in
//   15–45 : 118 sector-tinted points scatter across the field
//   45–75 : points spring inward into a globe silhouette
//   75–90 : whole frame fades to transparent, revealing the live cosmos beneath
//
// Remotion APIs used (all from `remotion`): useCurrentFrame, useVideoConfig,
// interpolate, spring, AbsoluteFill — https://www.remotion.dev/docs/

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const TAU = Math.PI * 2;
const COUNT = 118;
const COLORS = Object.values(SECTOR_COLORS);

// Deterministic PRNG so the starfield is identical every play (no flicker on
// re-render). Same mulberry32 the layout precompute uses.
function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticles(width, height) {
  const r = rng(1337);
  const globeR = Math.min(width, height) * 0.13;
  const cx = width / 2;
  const cy = height / 2;
  const out = [];
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * TAU;
    out.push({
      scatterX: r() * width,
      scatterY: r() * height,
      // converge target: a thin shell — reads as a sphere of points
      targetX: cx + Math.cos(a) * globeR * (0.85 + r() * 0.3),
      targetY: cy + Math.sin(a) * globeR * (0.85 + r() * 0.3),
      radius: 2 + r() * 2.5,
      color: COLORS[i % COLORS.length],
      appearAt: 15 + (i / COUNT) * 20, // staggered entrance
    });
  }
  return out;
}

export default function IntroComposition() {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const particles = buildParticles(width, height);

  const sceneOpacity = interpolate(frame, [75, 90], [1, 0], CLAMP); // global fade-out
  const titleOpacity = interpolate(frame, [0, 15, 60, 74], [0, 1, 1, 0], CLAMP);
  const titleScale = interpolate(frame, [0, 15], [0.92, 1], CLAMP);

  // 0 until frame 45, then springs to 1 — drives scatter→globe convergence.
  const converge =
    frame < 45 ? 0 : spring({ frame: frame - 45, fps, config: { damping: 200, stiffness: 80 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#020617', opacity: sceneOpacity }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {particles.map((p, i) => {
          const appear = interpolate(frame, [p.appearAt, p.appearAt + 10], [0, 1], CLAMP);
          const x = p.scatterX + (p.targetX - p.scatterX) * converge;
          const y = p.scatterY + (p.targetY - p.scatterY) * converge;
          const opacity = appear * (1 - converge * 0.5); // dim as they pack together
          return (
            <circle key={i} cx={x} cy={y} r={p.radius} fill={p.color} opacity={opacity} />
          );
        })}
      </svg>

      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: Math.max(11, width * 0.012),
            letterSpacing: '0.5em',
            color: '#5EEAD4',
            textTransform: 'uppercase',
            marginBottom: '0.6em',
          }}
        >
          The
        </div>
        <div
          style={{
            fontFamily: '"Space Grotesk", Inter, sans-serif',
            fontSize: Math.max(36, width * 0.06),
            fontWeight: 700,
            letterSpacing: '0.02em',
            color: '#E6EDF7',
            lineHeight: 1,
          }}
        >
          CORPORATE&nbsp;COSMOS
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
