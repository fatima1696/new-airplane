import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Jost';
import {timeline} from '../timeline';
import {buildChunks, chunkAt} from '../lib/captions';
import {easeOutCubic} from '../lib/easing';
import {useT} from '../lib/useT';

const {fontFamily} = loadFont('normal', {weights: ['600'], subsets: ['latin']});

/** White, semi-bold geometric sans, 2-5 words at a time, centred ~2/3 down the frame. */
export const Captions: React.FC = () => {
  const t = useT();
  const {width} = useVideoConfig();
  const chunks = useMemo(() => buildChunks(timeline), []);
  const c = chunkAt(chunks, t);
  if (!c) return null;
  const th = timeline.theme;
  const local = t - c.s;
  const pop = easeOutCubic(local / 0.14);
  const size = (th.captionSize * width) / 1080;
  return (
    <div
      style={{
        position: 'absolute',
        left: '8%',
        right: '8%',
        top: `${th.captionY * 100}%`,
        transform: `translateY(-50%) translateY(${(1 - pop) * 10}px) scale(${0.94 + 0.06 * pop})`,
        opacity: Math.min(1, local / 0.06),
        textAlign: 'center',
        fontFamily: `${fontFamily}, 'Avenir Next', 'Helvetica Neue', Arial, sans-serif`,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.1,
        color: '#fff',
        textShadow: '0 2px 10px rgba(0,0,0,0.45), 0 0 2px rgba(0,0,0,0.4)',
        letterSpacing: 0.2,
      }}
    >
      {c.text}
    </div>
  );
};
