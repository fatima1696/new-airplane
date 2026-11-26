import React from 'react';
import type {Vec3} from '../types';

const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 0.55],
  [0.55, -0.05, 0.1, 0.42],
  [-0.55, -0.08, -0.05, 0.4],
  [0.2, 0.28, 0, 0.38],
  [-0.2, 0.22, 0.12, 0.34],
];

/** Chunky toy cloud made from spheres. */
export const Cloud: React.FC<{position: Vec3; scale?: number}> = ({position, scale = 1}) => (
  <group position={position} scale={scale}>
    {PUFFS.map((p, i) => (
      <mesh key={i} position={[p[0], p[1], p[2]]} castShadow receiveShadow>
        <sphereGeometry args={[p[3], 20, 20]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
    ))}
  </group>
);
