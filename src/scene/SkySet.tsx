import React from 'react';
import {Base, Cloud, SetLight} from '../kit';
import {Airliner} from './Airliner';
import {bump} from '../lib/easing';
import {timeline, whenSaid} from '../timeline';
import type {Vec3} from '../types';

export const SKY_AT: Vec3 = [0, 0, 0];

/** Set A: the hook. A toy jet cruising above clouds on a wooden plinth. */
export const SkySet: React.FC<{t: number}> = ({t}) => {
  const bob = Math.sin(t * 1.1) * 0.05;
  const ring = bump(t, whenSaid('b01', 'hole') - 0.1, 1.8);
  return (
    <group position={SKY_AT}>
      <SetLight />
      <Base size={[5.6, 0.6, 4.4]} brand={timeline.brand} />
      <Cloud position={[-1.4, 0.45, 0.3 + Math.sin(t * 0.2) * 0.08]} scale={0.75} />
      <Cloud position={[1.3, 0.4, -0.5]} scale={0.6} />
      <Cloud position={[0.2, 0.35, 1.1]} scale={0.5} />
      <group position={[0, 2.3 + bob, 0]} rotation={[0, -0.3, Math.sin(t * 0.9) * 0.015]} scale={0.6}>
        <Airliner ring={ring} />
      </group>
    </group>
  );
};
