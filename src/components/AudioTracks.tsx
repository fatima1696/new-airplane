import React from 'react';
import * as R from 'remotion';
import {Sequence, interpolate, staticFile, useVideoConfig} from 'remotion';
import {timeline} from '../timeline';
import sfxManifest from '../../public/sfx/manifest.json';

// Remotion renamed <Audio> to <Html5Audio> in v4.0.3xx; support both.
const AudioTag: React.ComponentType<any> = (R as any).Html5Audio ?? (R as any).Audio;
const manifest = sfxManifest as Record<string, {dur: number}>;

export const VoiceTrack: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      {timeline.beats.map((b) =>
        b.audio ? (
          <Sequence key={b.id} from={Math.round(b.startSec * fps)} durationInFrames={Math.ceil((b.durSec + 0.5) * fps)} layout="none">
            <AudioTag src={staticFile(b.audio)} volume={1} />
          </Sequence>
        ) : null,
      )}
    </>
  );
};

export const SfxTrack: React.FC = () => {
  const {fps} = useVideoConfig();
  const out: React.ReactNode[] = [];
  timeline.beats.forEach((b) => {
    b.sfx.forEach((c, i) => {
      let at = b.startSec;
      if (c.atWord !== undefined) at += b.words[Math.min(c.atWord, b.words.length - 1)]?.s ?? 0;
      else if (c.atFrac !== undefined) at += b.durSec * c.atFrac;
      else if (c.at !== undefined) at += c.at;
      at += c.offset ?? 0;
      const dur = (manifest[c.sfx]?.dur ?? 3) / (c.rate ?? 1);
      out.push(
        <Sequence key={`${b.id}-${i}`} from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.ceil(dur * fps) + 2} layout="none">
          <AudioTag src={staticFile(`sfx/${c.sfx}.wav`)} volume={c.vol ?? 0.5} playbackRate={c.rate ?? 1} />
        </Sequence>,
      );
    });
  });
  return <>{out}</>;
};

/** Quiet looping ambience under everything (room tone / machine hum). */
export const BedTrack: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();
  const bed = timeline.bed;
  if (!bed) return null;
  return (
    <AudioTag
      src={staticFile(`sfx/${bed.sfx}.wav`)}
      loop
      volume={(f: number) =>
        bed.vol * interpolate(f, [0, fps, durationInFrames - fps * 1.2, durationInFrames], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      }
    />
  );
};
