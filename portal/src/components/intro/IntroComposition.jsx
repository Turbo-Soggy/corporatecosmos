import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

function rng(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticles(width, height, galaxy, scales, colors) {
  const random = rng(1337);
  const count = galaxy ? Math.floor(galaxy.length / 3) : 0;
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 2000);
  camera.position.set(0, 10, 58);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  const focalLength = height / (2 * Math.tan(THREE.MathUtils.degToRad(55 / 2)));

  return Array.from({ length: count }, (_, index) => {
    const world = new THREE.Vector3(galaxy[index * 3], galaxy[index * 3 + 1], galaxy[index * 3 + 2]);
    const view = world.clone().applyMatrix4(camera.matrixWorldInverse);
    const projected = world.clone().project(camera);
    const worldRadius = 0.55 * (scales?.[index] || 1);
    const radius = THREE.MathUtils.clamp((worldRadius * focalLength) / Math.max(1, -view.z), 2, 16);
    return {
      scatterX: random() * width,
      scatterY: random() * height,
      targetX: (projected.x + 1) * 0.5 * width,
      targetY: (1 - projected.y) * 0.5 * height,
      radius,
      color: colors?.[index] || '#5EEAD4',
      appearAt: 12 + (index / Math.max(1, count)) * 18,
    };
  });
}

export default function IntroComposition({ galaxy, scales, colors }) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef(null);
  const particles = useMemo(
    () => buildParticles(width, height, galaxy, scales, colors),
    [width, height, galaxy, scales, colors]
  );
  const converge = frame < 40
    ? 0
    : Math.min(1, spring({ frame: frame - 40, fps, config: { damping: 24, stiffness: 95, mass: 0.8 } }));
  const sceneOpacity = interpolate(frame, [76, 89], [1, 0], CLAMP);
  const titleOpacity = interpolate(frame, [0, 12, 48, 66], [0, 1, 1, 0], CLAMP);
  const titleScale = interpolate(frame, [0, 15], [0.92, 1], CLAMP);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const appear = interpolate(frame, [particle.appearAt, particle.appearAt + 8], [0, 1], CLAMP);
      const x = particle.scatterX + (particle.targetX - particle.scatterX) * converge;
      const y = particle.scatterY + (particle.targetY - particle.scatterY) * converge;
      context.globalAlpha = appear;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(x, y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }, [frame, particles, converge, width, height]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#020617', opacity: sceneOpacity }}>
      <canvas ref={canvasRef} width={width} height={height} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: titleOpacity, transform: `scale(${titleScale})` }}>
        <div style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: Math.max(11, width * 0.012), letterSpacing: '0.5em', color: '#5EEAD4', textTransform: 'uppercase', marginBottom: '0.6em' }}>The</div>
        <div style={{ fontFamily: '"Space Grotesk", Inter, sans-serif', fontSize: Math.max(36, width * 0.06), fontWeight: 700, letterSpacing: '0.02em', color: '#E6EDF7', lineHeight: 1 }}>CORPORATE&nbsp;COSMOS</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
