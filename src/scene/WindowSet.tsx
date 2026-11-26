import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Base, Cloud, SetLight, frameGeometry, plateGeometry} from '../kit';
import {bump, kf} from '../lib/easing';
import {getBeat, timeline, whenSaid} from '../timeline';
import type {Vec3} from '../types';

export const WINDOW_AT: Vec3 = [14, 0, 0];
const CY = 2.55; // window centre height

const Pane: React.FC<{geo: THREE.BufferGeometry; z: number; color: string; glow: number; opacity: number}> = ({geo, z, color, glow, opacity}) => (
  <mesh geometry={geo} position={[0, CY, z]} renderOrder={2}>
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1 + glow * 0.9} transparent opacity={opacity} depthWrite={false} roughness={0.15} side={THREE.DoubleSide} />
  </mesh>
);

/** Set B: a fuselage window module whose three panes slide apart ("three layers of plastic"). */
export const WindowSet: React.FC<{t: number}> = ({t}) => {
  const frame = useMemo(() => frameGeometry(2.6, 4.2, 0.5, 1.2, 1.8, 0.5, 0.3), []);
  const outerG = useMemo(() => plateGeometry(1.3, 1.9, 0.52, 0.04), []);
  const middleG = useMemo(() => plateGeometry(1.3, 1.9, 0.52, 0.04, [{x: 0, y: -0.68, r: 0.045}]), []);
  const innerG = useMemo(() => plateGeometry(1.3, 1.9, 0.52, 0.04), []);
  const b3 = getBeat('b03');
  const explode = kf(t, [
    [b3.startSec, 0],
    [b3.startSec + b3.durSec * 0.14, 1],
    [b3.startSec + b3.durSec * 0.78, 1],
    [b3.startSec + b3.durSec, 0],
  ]);
  const g = (word: string) => bump(t, whenSaid('b03', word) - 0.1, 1.3);
  const sep = 0.08 + explode * 0.75;
  return (
    <group position={WINDOW_AT}>
      <SetLight />
      <Base size={[4.4, 0.6, 3.6]} brand={timeline.brand} />
      {/* fuselage wall */}
      <mesh geometry={frame} position={[0, CY, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#dde3ea" roughness={0.6} />
      </mesh>
      {/* sky behind the window */}
      <mesh position={[0, CY, -1.6]}>
        <planeGeometry args={[3, 3.4]} />
        <meshBasicMaterial color="#8fbbe8" />
      </mesh>
      <Cloud position={[0.25, CY + 0.2, -1.4]} scale={0.5} />
      <Pane geo={outerG} z={-sep} color="#5aa9ff" glow={g('outer')} opacity={0.5} />
      <Pane geo={middleG} z={0} color="#ffd166" glow={g('middle')} opacity={0.5} />
      <Pane geo={innerG} z={sep} color="#e8eef5" glow={g('inner')} opacity={0.4} />
    </group>
  );
};
