import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {timeline} from './timeline';
import {CameraRig} from './components/CameraRig';
import {Captions} from './components/Captions';
import {TiltShift, Vignette, Whips} from './components/Overlays';
import {BedTrack, SfxTrack, VoiceTrack} from './components/AudioTracks';
import {Scene} from './scene/Scene';

export const Video: React.FC = () => {
  const {width, height} = useVideoConfig();
  const th = timeline.theme;
  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg, ${th.skyTop} 0%, ${th.skyBottom} 100%)`}}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        camera={{fov: 34, position: [0, 3, 10], near: 0.1, far: 250}}
        gl={{antialias: true}}
      >
        <CameraRig />
        <ambientLight intensity={0.55} />
        <hemisphereLight args={['#dbe9ff', '#8a6a4a', 0.65]} />
        <Scene />
      </ThreeCanvas>
      {th.tiltShift ? <TiltShift /> : null}
      <Vignette />
      <Whips />
      <Captions />
      <VoiceTrack />
      <SfxTrack />
      <BedTrack />
    </AbsoluteFill>
  );
};
