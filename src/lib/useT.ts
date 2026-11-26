import {useCurrentFrame, useVideoConfig} from 'remotion';

/** Current time in seconds. Safe to call inside <ThreeCanvas>. */
export const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};
