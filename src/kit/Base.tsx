import React, {useMemo} from 'react';
import * as THREE from 'three';
import type {Vec3} from '../types';
import {makePlateTexture, makeWoodTexture} from './textures';

/** Wooden display plinth with a brass nameplate: the signature "miniature world" stage. */
export const Base: React.FC<{
  position?: Vec3;
  size?: Vec3;
  brand: string;
  top?: string;
}> = ({position = [0, 0, 0], size = [9, 0.7, 6], brand, top = '#c9d6df'}) => {
  const wood = useMemo(() => makeWoodTexture(), []);
  const plate = useMemo(() => makePlateTexture(brand), [brand]);
  const [w, h, d] = size;
  return (
    <group position={position}>
      <mesh position={[0, -h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial map={wood} roughness={0.5} />
      </mesh>
      {/* inset working surface the models stand on */}
      <mesh position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w - 0.45, d - 0.45]} />
        <meshStandardMaterial color={top} roughness={0.92} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -h * 0.5, d / 2 + 0.012]}>
        <planeGeometry args={[Math.min(3.4, w * 0.4), 0.36]} />
        <meshStandardMaterial map={plate} metalness={0.35} roughness={0.38} />
      </mesh>
    </group>
  );
};
