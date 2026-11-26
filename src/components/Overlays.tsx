import React from 'react';
import {AbsoluteFill} from 'remotion';
import {timeline} from '../timeline';
import {useT} from '../lib/useT';

/** Fake tilt-shift: blur the top and bottom bands for the "miniature" look. */
export const TiltShift: React.FC = () => {
  const band = (side: 'top' | 'bottom'): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    right: 0,
    [side]: 0,
    height: '24%',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    maskImage: `linear-gradient(${side === 'top' ? '180deg' : '0deg'}, #000 0%, transparent 100%)`,
    WebkitMaskImage: `linear-gradient(${side === 'top' ? '180deg' : '0deg'}, #000 0%, transparent 100%)`,
    pointerEvents: 'none',
  });
  return (
    <>
      <div style={band('top')} />
      <div style={band('bottom')} />
    </>
  );
};

export const Vignette: React.FC = () => {
  const v = timeline.theme.vignette;
  if (v <= 0) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${v}) 100%)`,
      }}
    />
  );
};

/** Quick motion-blur + brightness pulse that hides the camera whip between set pieces. */
export const Whips: React.FC = () => {
  const t = useT();
  let amount = 0;
  for (const w of timeline.whips) {
    const p = (t - (w.t - w.len / 2)) / w.len;
    if (p > 0 && p < 1) amount = Math.max(amount, Math.sin(Math.PI * p));
  }
  if (amount <= 0.001) return null;
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        backdropFilter: `blur(${(amount * 18).toFixed(2)}px)`,
        WebkitBackdropFilter: `blur(${(amount * 18).toFixed(2)}px)`,
        background: `rgba(255,255,255,${(amount * 0.2).toFixed(3)})`,
      }}
    />
  );
};
