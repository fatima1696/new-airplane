import React, {useLayoutEffect, useMemo} from 'react';
import * as THREE from 'three';

/** Shadow-casting key light that follows one set piece (put it inside that set's <group>). */
export const SetLight: React.FC<{intensity?: number; color?: string; extent?: number}> = ({
  intensity = 2.4,
  color = '#fff1dc',
  extent = 7,
}) => {
  const light = useMemo(() => new THREE.DirectionalLight(color, intensity), [color, intensity]);
  useLayoutEffect(() => {
    light.position.set(4, 9, 7);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    const cam = light.shadow.camera as THREE.OrthographicCamera;
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent;
    cam.bottom = -extent;
    cam.near = 1;
    cam.far = 30;
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    light.shadow.radius = 4;
  }, [light, extent]);
  return (
    <group>
      <primitive object={light} />
      <primitive object={light.target} />
    </group>
  );
};
