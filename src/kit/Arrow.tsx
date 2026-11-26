import React from 'react';
import type {Vec3} from '../types';

/** Force/pressure arrow pointing along +x. `length` 0 hides it. Rotate the parent group for other directions. */
export const Arrow: React.FC<{position?: Vec3; length: number; color: string; thickness?: number; glow?: number}> = ({
  position = [0, 0, 0],
  length,
  color,
  thickness = 0.07,
  glow = 0.35,
}) => {
  if (length <= 0.01) return null;
  const head = Math.min(0.32, length * 0.45);
  const shaft = Math.max(0.001, length - head);
  return (
    <group position={position}>
      <mesh position={[shaft / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <cylinderGeometry args={[thickness, thickness, shaft, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.45} />
      </mesh>
      <mesh position={[shaft + head / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
        <coneGeometry args={[thickness * 2.3, head, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={glow} roughness={0.45} />
      </mesh>
    </group>
  );
};
