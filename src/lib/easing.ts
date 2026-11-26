export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeOutBack = (x: number) => {
  const t = clamp(x);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
/** 0 → 1 → 0 bump over [t0, t0+dur] */
export const bump = (t: number, t0: number, dur: number) =>
  Math.sin(Math.PI * clamp((t - t0) / dur));
/** Deterministic PRNG so every Remotion render worker draws identical scenes. */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Piecewise smooth keyframes: kf(t, [[time, value], ...]) with ascending times. */
export const kf = (t: number, pts: [number, number][]): number => {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, v0] = pts[i];
    const [t1, v1] = pts[i + 1];
    if (t < t1) return lerp(v0, v1, smooth((t - t0) / Math.max(1e-6, t1 - t0)));
  }
  return pts[pts.length - 1][1];
};
