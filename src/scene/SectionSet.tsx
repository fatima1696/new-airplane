import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Arrow, Base, FlowParticles, Particles, SetLight} from '../kit';
import {bump, kf, rng} from '../lib/easing';
import {getBeat, timeline, whenSaid} from '../timeline';
import type {Vec3} from '../types';

export const SECTION_AT: Vec3 = [28, 0, 0];

// ---- cross-section layout (local x; cabin on the left, outside on the right) ----
const Y0 = 0.25;
const Y1 = 3.25;
const X_INNER = -1.25;
const X_MID = -0.1;
const X_OUT = 0.87;
const HOLE_Y = 0.77;
const COL = {amber: '#ffb347', cool: '#6fb7ff', outer: '#5aa9ff', middle: '#ffd166', inner: '#e8eef5', stress: '#ff6a3d', hold: '#3ddc84'};

// constant boxes defined once so Particles' memo is stable
const CABIN_MIN: Vec3 = [-2.4, 0.4, -0.45];
const CABIN_MAX: Vec3 = [-0.3, 3.1, 0.45];
const GAP_MIN: Vec3 = [0.08, 0.5, -0.45];
const GAP_MAX: Vec3 = [0.66, 3.0, 0.45];
const OUT_MIN: Vec3 = [1.15, 0.5, -0.45];
const OUT_MAX: Vec3 = [2.6, 3.0, 0.45];
const THROUGH_HOLE: Vec3[] = [[-0.9, HOLE_Y, 0], [-0.3, HOLE_Y, 0], [0.25, HOLE_Y, 0], [0.5, 1.1, 0], [0.5, 1.8, 0]];
const DRAIN: Vec3[] = [[0.5, 2.0, 0], [0.45, 1.0, 0], [0.1, HOLE_Y, 0], [-0.5, HOLE_Y, 0], [-1.0, 0.6, 0]];
const ARROW_Y = [1.2, 1.8, 2.4, 3.0];

const Slab: React.FC<{x: number; y0: number; y1: number; w: number; color: string; opacity?: number; emissive?: string; ei?: number; d?: number}> = ({
  x, y0, y1, w, color, opacity = 0.9, emissive = '#000000', ei = 0, d = 1,
}) => (
  <mesh position={[x, (y0 + y1) / 2, 0]} castShadow>
    <boxGeometry args={[w, y1 - y0, d]} />
    <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={ei} transparent opacity={opacity} roughness={0.25} />
  </mesh>
);

const Zone: React.FC<{x0: number; x1: number; color: string; opacity: number}> = ({x0, x1, color, opacity}) =>
  opacity < 0.002 ? null : (
    <mesh position={[(x0 + x1) / 2, (Y0 + Y1) / 2, -0.62]}>
      <planeGeometry args={[x1 - x0, Y1 - Y0]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );

/** Set C: the cross-section where the story happens (cabin | inner | middle | gap | outer | outside). */
export const SectionSet: React.FC<{t: number}> = ({t}) => {
  const T = (id: string, a: number) => getBeat(id).startSec + getBeat(id).durSec * a;
  const tHole = whenSaid('b09', 'added');
  const tSeep = whenSaid('b10', 'seeps');
  const tCrack = whenSaid('b12', 'cracks');
  const tDrain = whenSaid('b11', 'escape');
  const b13 = T('b13', 0);

  // ---- animated state, all pure functions of time ----
  const aOuter = kf(t, [[T('b05', 0.4), 0], [T('b05', 0.9), 1], [T('b06', 0.35), 1], [T('b06', 0.9), 0.65], [T('b10', 0.3), 0.65], [T('b10', 0.85), 1], [tCrack, 1], [tCrack + 0.25, 0], [b13, 0], [b13 + 0.5, 1]]);
  const aMid = kf(t, [[T('b06', 0.35), 0], [T('b06', 0.9), 0.65], [T('b10', 0.3), 0.65], [T('b10', 0.85), 0.04], [tCrack + 0.1, 0.04], [tCrack + 0.6, 1], [b13, 1], [b13 + 0.5, 0.04]]);
  const stress = kf(t, [[T('b06', 0.4), 0], [T('b06', 0.9), 0.5], [T('b07', 0.8), 1], [tHole, 1], [tHole + 1.2, 0]]);
  const fatigue = kf(t, [[T('b07', 0.2), 0], [T('b07', 0.9), 1], [tHole, 1], [tHole + 0.4, 0]]);
  const plug = 1 - kf(t, [[tHole, 0], [tHole + 0.55, 1]]);
  const fill = kf(t, [[tSeep, 0.35], [tSeep + 2.4, 1]]);
  const flow = kf(t, [[tSeep, 0], [tSeep + 0.4, 1], [tSeep + 2.6, 0.3], [T('b11', 0), 0]]);
  const fog = kf(t, [[T('b08', 0.2), 0], [T('b08', 0.9), 1], [tDrain, 1], [tDrain + 1.8, 0]]);
  const drain = kf(t, [[tDrain, 0], [tDrain + 0.3, 1], [tDrain + 2.2, 0]]);
  const brk = kf(t, [[tCrack - 0.01, 0], [tCrack + 0.12, 1], [b13, 1], [b13 + 0.5, 0]]);
  const hold = kf(t, [[tCrack + 0.3, 0], [tCrack + 1, 1], [b13, 1], [b13 + 0.5, 0]]);
  const ringBase = Math.max(
    kf(t, [[tHole - 0.3, 0], [tHole + 0.3, 1], [tHole + 1.8, 0]]),
    kf(t, [[T('b14', 0), 0], [T('b14', 0.2), 1], [T('b15', 0.2), 1], [T('b15', 0.6), 0]]),
  );
  const ring = ringBase * (0.8 + 0.2 * Math.sin(t * 6));
  const worksGlow = bump(t, whenSaid('b13', 'works') - 0.1, 1.1);
  const waitsGlow = bump(t, whenSaid('b13', 'waits') - 0.1, 1.1);

  const shards = useMemo(() => {
    const r = rng(77);
    return Array.from({length: 7}, () => ({d: [0.25 + r() * 0.5, (r() - 0.3) * 0.9, (r() - 0.5) * 0.8] as Vec3, s: 0.05 + r() * 0.06, rot: r() * 3}));
  }, []);
  const midStress = stress * (0.5 + 0.5 * Math.sin(t * 9));
  const midGlowColor = hold > 0.01 ? COL.hold : COL.stress;
  const midGlow = Math.max(midStress * 0.9, hold * 0.8, waitsGlow * 0.6);

  return (
    <group position={SECTION_AT}>
      <SetLight extent={6} />
      <Base size={[7.2, 0.6, 3.2]} brand={timeline.brand} />

      {/* zone backdrops */}
      <Zone x0={-2.6} x1={-0.2} color={COL.amber} opacity={0.2} />
      <Zone x0={0} x1={0.74} color={COL.cool} opacity={(1 - fill) * 0.3} />
      <Zone x0={0} x1={0.74} color={COL.amber} opacity={fill * 0.3} />
      <Zone x0={1.0} x1={2.7} color={COL.cool} opacity={0.18} />

      {/* panes */}
      <Slab x={X_INNER} y0={Y0} y1={Y1} w={0.08} color={COL.inner} opacity={0.4} />
      <Slab x={X_MID} y0={Y0} y1={HOLE_Y - 0.09} w={0.2} color={COL.middle} emissive={midGlowColor} ei={midGlow} />
      <Slab x={X_MID} y0={HOLE_Y + 0.09} y1={Y1} w={0.2} color={COL.middle} emissive={midGlowColor} ei={midGlow} />
      <group position={[X_MID, HOLE_Y, 0]} scale={[1, Math.max(0.0001, plug), 1]}>
        <mesh>
          <boxGeometry args={[0.2, 0.18, 1]} />
          <meshStandardMaterial color={COL.middle} transparent opacity={0.9} />
        </mesh>
      </group>
      <Slab x={X_OUT} y0={Y0} y1={1.9} w={0.26} color={COL.outer} emissive={COL.outer} ei={worksGlow * 0.7} />
      <group position={[X_OUT + brk * 0.14, 1.9, 0]} rotation={[0, 0, -brk * 0.06]}>
        <mesh position={[0, (Y1 - 1.9) / 2, 0]} castShadow>
          <boxGeometry args={[0.26, Y1 - 1.9, 1]} />
          <meshStandardMaterial color={COL.outer} emissive={COL.outer} emissiveIntensity={worksGlow * 0.7} transparent opacity={0.9} roughness={0.25} />
        </mesh>
      </group>
      {/* seal spacers */}
      {[Y0 + 0.09, Y1 - 0.09].map((y) => (
        <mesh key={y} position={[0.37, y, 0]} castShadow>
          <boxGeometry args={[0.74, 0.18, 1]} />
          <meshStandardMaterial color="#8793a0" roughness={0.7} />
        </mesh>
      ))}
      {/* shards when the outer pane cracks */}
      {shards.map((s, i) => {
        const p = kf(t, [[tCrack, 0], [tCrack + 0.8, 1]]) * (t < b13 ? 1 : 0);
        if (p <= 0.001) return null;
        return (
          <mesh key={i} position={[X_OUT + 0.2 + s.d[0] * p, 1.9 + s.d[1] * p - p * p * 0.6, s.d[2] * p]} rotation={[s.rot * p * 3, s.rot * p * 2, 0]} scale={1 - p * 0.5}>
            <boxGeometry args={[s.s, s.s, s.s]} />
            <meshStandardMaterial color={COL.outer} emissive={COL.outer} emissiveIntensity={0.4} />
          </mesh>
        );
      })}
      {/* hairline fatigue marks on the middle pane while the gap is sealed */}
      {[0.3, 0.55, 0.8].map((f, i) =>
        fatigue > f - 0.25 ? (
          <mesh key={i} position={[X_MID, 1.2 + i * 0.7, 0.52]} rotation={[0, 0, 0.5 - i * 0.4]}>
            <boxGeometry args={[0.16, 0.012, 0.005]} />
            <meshBasicMaterial color="#2b1b0a" />
          </mesh>
        ) : null,
      )}

      {/* pressure arrows (amber = cabin pressure pushing out) */}
      {ARROW_Y.map((y) => (
        <React.Fragment key={y}>
          <Arrow position={[-0.22 - 0.9 * aMid + Math.sin(t * 5 + y) * 0.03, y, 0.0]} length={0.9 * aMid} color={COL.amber} thickness={0.045} />
          <Arrow position={[0.72 - 0.65 * aOuter + Math.sin(t * 5 + y) * 0.03, y, 0.0]} length={0.65 * aOuter} color={COL.amber} thickness={0.045} />
        </React.Fragment>
      ))}

      {/* air */}
      <Particles t={t} count={150} min={CABIN_MIN} max={CABIN_MAX} color={COL.amber} speed={1.4} jitter={0.1} seed={1} />
      <Particles t={t} count={14} min={OUT_MIN} max={OUT_MAX} color={COL.cool} speed={0.6} jitter={0.16} seed={2} />
      <Particles t={t} count={70} min={GAP_MIN} max={GAP_MAX} color={fill > 0.6 ? COL.amber : COL.cool} speed={1.1} jitter={0.07} visible={fill} seed={3} size={0.055} />
      <FlowParticles t={t} path={THROUGH_HOLE} amount={flow} color={COL.amber} />
      <FlowParticles t={t} path={DRAIN} amount={drain} color="#bfe3ff" count={16} size={0.05} seed={9} speed={0.4} />

      {/* fog / frost on the sealed gap */}
      {fog > 0.01 ? (
        <mesh position={[0.37, (Y0 + Y1) / 2, 0.52]}>
          <planeGeometry args={[0.74, Y1 - Y0 - 0.4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={fog * 0.55} depthWrite={false} />
        </mesh>
      ) : null}

      {/* gold ring around the hole */}
      {ring > 0.01 ? (
        <mesh position={[X_MID, HOLE_Y, 0.62]} scale={0.85 + ring * 0.25}>
          <torusGeometry args={[0.2, 0.018, 12, 48]} />
          <meshStandardMaterial color="#ffcf4a" emissive="#ffcf4a" emissiveIntensity={0.9} transparent opacity={Math.min(1, ring)} />
        </mesh>
      ) : null}
    </group>
  );
};
