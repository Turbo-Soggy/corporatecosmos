import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import CompanyNodes from './CompanyNodes';
import CameraRig from './CameraRig';
import NodeLabels from './NodeLabels';
import ConstellationGrid from './ConstellationGrid';

function AnimatedGalaxy() {
  const groupRef = useRef();
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.03;
      groupRef.current.rotation.x -= delta * 0.015;
    }
  });

  return (
    <group ref={groupRef}>
      <Stars radius={100} depth={50} count={2600} factor={5} saturation={0.45} fade speed={1.2} />
      <Sparkles count={140} scale={40} size={2.5} speed={0.5} opacity={0.35} color="#88ccff" />
    </group>
  );
}

// Fixed full-screen WebGL background. Sits behind the HUD (z-1).
export default function CosmosCanvas({
  layouts,
  progressRef,
  sharedPositions,
  hovered,
  selected,
  query,
  onHover,
  onSelect,
  introActive,
}) {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none">
      <Canvas
        className="pointer-events-auto"
        camera={{ position: [0, 10, 58], fov: 55, near: 0.1, far: 2000 }}
        dpr={[1, 1.35]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        style={{ touchAction: 'auto' }}
      >
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 110, 280]} />

        {/* Lighting gives the metallic spheres real volume + specular highlights. */}
        <ambientLight intensity={0.35} />
        <directionalLight position={[30, 40, 20]} intensity={2.2} color="#cbd5ff" />
        <pointLight position={[-50, -20, -30]} intensity={0.6} color="#5eead4" />

        <Environment preset="city" />
        <AnimatedGalaxy />
        <ConstellationGrid progressRef={progressRef} layouts={layouts} />

        <CameraRig progressRef={progressRef} sharedPositions={sharedPositions} selected={selected} introActive={introActive} />
        <CompanyNodes
          layouts={layouts}
          progressRef={progressRef}
          sharedPositions={sharedPositions}
          hovered={hovered}
          selected={selected}
          query={query}
          onHover={onHover}
          onSelect={onSelect}
          introActive={introActive}
        />
        <NodeLabels
          layouts={layouts}
          sharedPositions={sharedPositions}
          hovered={hovered}
          selected={selected}
        />

        {/* The "Pro Max" glow — HDR instance colors bloom against the dark void. */}
        <EffectComposer disableNormalPass multisampling={0}>
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.15}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.85} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
