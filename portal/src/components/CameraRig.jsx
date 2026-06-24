import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { reducedMotion } from '../lib/motion';

const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();
const nodePos = new THREE.Vector3();

/**
 * Scroll- and selection-driven camera. No OrbitControls — fully scripted.
 * Galaxy: slow orbit. Financial: pull back to read the X axis. Geographic:
 * lifted 3/4 view. Selecting a node overrides everything with a GSAP fly-to.
 */
export default function CameraRig({ progressRef, sharedPositions, selected }) {
  const { camera } = useThree();
  const lookRef = useRef(new THREE.Vector3(0, 0, 0));
  // Lever #3: single-writer fly-to targets. GSAP eases these on selection; useFrame copies
  // them. We never tween camera.position directly, and useFrame never tweens — one owner each.
  const flyPos = useRef(new THREE.Vector3());
  const flyLook = useRef(new THREE.Vector3());
  const flying = useRef(false);

  useEffect(() => {
    if (selected == null || !sharedPositions) {
      flying.current = false; // hand control back to the scroll camera
      return undefined;
    }
    const ix = selected * 3;
    nodePos.set(sharedPositions[ix], sharedPositions[ix + 1], sharedPositions[ix + 2]);
    // Seed from wherever the camera currently is so the flight eases (never snaps), and so
    // a node→node reselect re-aims from the live position rather than resetting.
    flyPos.current.copy(camera.position);
    flyLook.current.copy(lookRef.current);
    flying.current = true;

    const dur = reducedMotion ? 0 : 1.4;
    const tweens = [
      gsap.to(flyPos.current, {
        x: nodePos.x + 4,
        y: nodePos.y + 3,
        z: nodePos.z + 16,
        duration: dur,
        ease: 'power3.inOut',
        overwrite: 'auto',
      }),
      gsap.to(flyLook.current, {
        x: nodePos.x,
        y: nodePos.y,
        z: nodePos.z,
        duration: dur,
        ease: 'power3.inOut',
        overwrite: 'auto',
      }),
    ];
    return () => tweens.forEach((t) => t.kill());
  }, [selected, sharedPositions, camera]);

  useFrame((state, delta) => {
    if (flying.current) {
      // GSAP already eased the targets — just apply them.
      camera.position.copy(flyPos.current);
      lookRef.current.copy(flyLook.current);
      camera.lookAt(lookRef.current);
      return;
    }

    const p = progressRef.current;
    if (p < 0.3) {
      // Galaxy: gentle automated orbit (held static under reduced motion).
      if (reducedMotion) {
        desiredPos.set(0, 12, 60);
      } else {
        const a = state.clock.elapsedTime * 0.08;
        desiredPos.set(Math.sin(a) * 58, 10, Math.cos(a) * 58);
      }
      desiredLook.set(0, 0, 0);
    } else if (p < 0.6) {
      // Financial axis: straight-on, pulled back to see the spread.
      desiredPos.set(0, 8, 96);
      desiredLook.set(0, 0, 0);
    } else {
      // Geographic clusters: elevated three-quarter view.
      desiredPos.set(0, 60, 82);
      desiredLook.set(0, 0, 0);
    }

    // Scroll camera eases toward the phase pose. On deselect this resumes from wherever the
    // fly-to left the camera, so the return is smooth.
    const k = 1 - Math.exp(-delta * 1.6);
    camera.position.lerp(desiredPos, k);
    lookRef.current.lerp(desiredLook, k);
    camera.lookAt(lookRef.current);
  });

  return null;
}
