import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {timeline} from '../timeline';
import {buildCameraKeys, sampleCamera} from '../lib/camera';
import {useT} from '../lib/useT';

/** Drives the R3F camera from the narration-synced spline. Add subtle handheld drift. */
export const CameraRig: React.FC<{drift?: number}> = ({drift = 0.012}) => {
  const camera = useThree((s) => s.camera) as any;
  const keys = useMemo(() => buildCameraKeys(timeline), []);
  const t = useT();
  const c = sampleCamera(keys, t);
  const dx = Math.sin(t * 0.9) * drift;
  const dy = Math.cos(t * 0.7) * drift;

  useLayoutEffect(() => {
    camera.position.set(c.pos[0] + dx, c.pos[1] + dy, c.pos[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(c.look[0], c.look[1], c.look[2]);
    if (c.roll) camera.rotateZ(c.roll);
    camera.fov = c.fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  });
  return null;
};
