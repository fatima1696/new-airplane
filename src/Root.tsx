import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {timeline} from './timeline';

export const Root: React.FC = () => (
  <Composition
    id="Explainer"
    component={Video}
    width={timeline.width}
    height={timeline.height}
    fps={timeline.fps}
    durationInFrames={Math.ceil(timeline.totalSec * timeline.fps)}
  />
);
