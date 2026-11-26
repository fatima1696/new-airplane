import type {CamKey, Timeline, Vec3} from '../types';
import {clamp} from './easing';

export interface AbsKey {
  t: number;
  pos: Vec3;
  look: Vec3;
  fov: number;
  roll: number;
}

/** Flatten per-beat fractional keys into one absolute-time path. */
export const buildCameraKeys = (tl: Timeline, defaultFov = 34): AbsKey[] => {
  const keys: AbsKey[] = [];
  for (const b of tl.beats) {
    for (const k of b.cam as CamKey[]) {
      let t = b.startSec + b.durSec * k.at;
      const prev = keys[keys.length - 1];
      if (prev && t <= prev.t) t = prev.t + 0.01;
      keys.push({t, pos: k.pos, look: k.look, fov: k.fov ?? defaultFov, roll: k.roll ?? 0});
    }
  }
  return keys;
};

const hermite = (p0: number, p1: number, m0: number, m1: number, h: number, s: number) => {
  const s2 = s * s;
  const s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * h * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * h * m1;
};

/** Smooth, overshoot-free path through the keys (non-uniform cardinal Hermite). */
export const sampleCamera = (keys: AbsKey[], t: number): AbsKey => {
  if (keys.length === 0) throw new Error('No camera keys: give each beat at least one cam key');
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const h = b.t - a.t;
  const s = clamp((t - a.t) / h);
  const tan = (get: (k: AbsKey) => number, idx: number) => {
    const p = keys[idx - 1];
    const n = keys[idx + 1];
    if (!p && !n) return 0;
    if (!p) return (get(n) - get(keys[idx])) / (n.t - keys[idx].t);
    if (!n) return (get(keys[idx]) - get(p)) / (keys[idx].t - p.t);
    return (get(n) - get(p)) / (n.t - p.t);
  };
  const blend = (get: (k: AbsKey) => number) =>
    hermite(get(a), get(b), tan(get, i), tan(get, i + 1), h, s);
  return {
    t,
    pos: [blend((k) => k.pos[0]), blend((k) => k.pos[1]), blend((k) => k.pos[2])],
    look: [blend((k) => k.look[0]), blend((k) => k.look[1]), blend((k) => k.look[2])],
    fov: blend((k) => k.fov),
    roll: blend((k) => k.roll),
  };
};
