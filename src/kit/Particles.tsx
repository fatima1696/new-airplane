import React, {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import type {Vec3} from '../types';
import {rng} from '../lib/easing';

/** Jittering gas/liquid particles in a box. `visible` (0..1) reveals particles progressively. */
export const Particles: React.FC<{
  t: number;
  count: number;
  min: Vec3;
  max: Vec3;
  color: string;
  size?: number;
  speed?: number;
  jitter?: number;
  visible?: number;
  seed?: number;
  opacity?: number;
}> = ({t, count, min, max, color, size = 0.07, speed = 1, jitter = 0.12, visible = 1, seed = 1, opacity = 0.95}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const base = useMemo(() => {
    const r = rng(seed * 9973);
    return Array.from({length: count}, () => ({
      p: [min[0] + r() * (max[0] - min[0]), min[1] + r() * (max[1] - min[1]), min[2] + r() * (max[2] - min[2])] as Vec3,
      ph: r() * 6.283,
      f: 0.8 + r() * 1.6,
    }));
  }, [count, min, max, seed]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const shown = Math.floor(count * Math.min(1, Math.max(0, visible)));
    base.forEach((b, i) => {
      const a = t * speed * b.f + b.ph;
      dummy.position.set(
        b.p[0] + Math.sin(a * 1.3) * jitter,
        b.p[1] + Math.cos(a * 0.9) * jitter,
        b.p[2] + Math.sin(a * 1.1 + 1.7) * jitter * 0.6,
      );
      dummy.scale.setScalar(i < shown ? 1 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} transparent opacity={opacity} />
    </instancedMesh>
  );
};

/** Particles streaming along a polyline path (e.g. air through a tiny hole). amount 0..1 = how many flow. */
export const FlowParticles: React.FC<{
  t: number;
  path: Vec3[];
  count?: number;
  amount: number;
  color: string;
  size?: number;
  speed?: number;
  spread?: number;
  reverse?: boolean;
  seed?: number;
}> = ({t, path, count = 28, amount, color, size = 0.06, speed = 0.45, spread = 0.07, reverse = false, seed = 3}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const off = useMemo(() => {
    const r = rng(seed * 7919);
    return Array.from({length: count}, () => [(r() - 0.5) * spread, (r() - 0.5) * spread, (r() - 0.5) * spread]);
  }, [count, spread, seed]);
  const segLens = useMemo(() => {
    const l: number[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      l.push(Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1], path[i + 1][2] - path[i][2]));
    }
    return l;
  }, [path]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const total = segLens.reduce((a, b) => a + b, 0);
    const shown = Math.floor(count * Math.min(1, Math.max(0, amount)));
    for (let i = 0; i < count; i++) {
      let u = (t * speed + i / count) % 1;
      if (reverse) u = 1 - u;
      let d = u * total;
      let k = 0;
      while (k < segLens.length - 1 && d > segLens[k]) {
        d -= segLens[k];
        k++;
      }
      const f = segLens[k] > 0 ? d / segLens[k] : 0;
      const a = path[k];
      const b = path[k + 1];
      dummy.position.set(
        a[0] + (b[0] - a[0]) * f + off[i][0],
        a[1] + (b[1] - a[1]) * f + off[i][1],
        a[2] + (b[2] - a[2]) * f + off[i][2],
      );
      dummy.scale.setScalar(i < shown ? 1 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} />
    </instancedMesh>
  );
};
