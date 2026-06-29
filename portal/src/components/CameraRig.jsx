import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { reducedMotion } from '../lib/motion';

const desiredPos = new THREE.Vector3();
const desiredLook = new THREE.Vector3();
const nodePos = new THREE.Vector3();
const followPos = new THREE.Vector3();
const FOLLOW_OFFSET = new THREE.Vector3(4, 3, 16);

/** Scroll camera when idle; live target-follow camera while a node is selected. */
export default function CameraRig({ progressRef, sharedPositions, selected, introActive }) {
  const { camera } = useThree();
  const lookRef = useRef(new THREE.Vector3(0, 0, 0));
  const flyStartPos = useRef(new THREE.Vector3());
  const flyStartLook = useRef(new THREE.Vector3());
  const acquire = useRef({ value: 0 });

  useEffect(() => {
    if (selected == null || !sharedPositions) return undefined;

    // Tween only the acquisition progress. The destination is read from the
    // shared live-position buffer every frame, so a focused body cannot drift away.
    flyStartPos.current.copy(camera.position);
    flyStartLook.current.copy(lookRef.current);
    acquire.current.value = 0;

    const tween = gsap.to(acquire.current, {
      value: 1,
      duration: reducedMotion ? 0 : 1.4,
      ease: 'power3.inOut',
      overwrite: 'auto',
    });
    return () => tween.kill();
  }, [selected, sharedPositions, camera]);

  useFrame((state, delta) => {
    if (introActive && selected == null) {
      camera.position.set(0, 10, 58);
      lookRef.current.set(0, 0, 0);
      camera.lookAt(lookRef.current);
      return;
    }
    if (selected != null && sharedPositions) {
      const ix = selected * 3;
      nodePos.set(sharedPositions[ix], sharedPositions[ix + 1], sharedPositions[ix + 2]);
      followPos.copy(nodePos).add(FOLLOW_OFFSET);
      const t = acquire.current.value;
      camera.position.lerpVectors(flyStartPos.current, followPos, t);
      lookRef.current.lerpVectors(flyStartLook.current, nodePos, t);
      camera.lookAt(lookRef.current);
      return;
    }

    const p = progressRef.current;
    if (p < 0.3) {
      if (reducedMotion) {
        desiredPos.set(0, 12, 60);
      } else {
        const a = state.clock.elapsedTime * 0.08;
        desiredPos.set(Math.sin(a) * 58, 10, Math.cos(a) * 58);
      }
      desiredLook.set(0, 0, 0);
    } else if (p < 0.6) {
      desiredPos.set(0, 8, 96);
      desiredLook.set(0, 0, 0);
    } else {
      desiredPos.set(0, 60, 82);
      desiredLook.set(0, 0, 0);
    }

    const k = 1 - Math.exp(-delta * 1.6);
    camera.position.lerp(desiredPos, k);
    lookRef.current.lerp(desiredLook, k);
    camera.lookAt(lookRef.current);
  });

  return null;
}
