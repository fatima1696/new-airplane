export type Vec3 = [number, number, number];

/** One camera keyframe. `at` is a 0..1 fraction of the beat's duration, so the
 *  camera path automatically follows the narration timing. */
export interface CamKey {
  at: number;
  pos: Vec3;
  look: Vec3;
  fov?: number;
  roll?: number;
}

export interface SfxCue {
  sfx: string; // file name (no extension) in public/sfx
  atWord?: number; // index of the spoken word in the beat (resolved by build-timeline)
  at?: number; // seconds from beat start
  atFrac?: number; // 0..1 of beat duration
  offset?: number; // seconds added after the anchor (negative = earlier)
  vol?: number; // 0..1
  rate?: number; // playback rate
}

export interface Word {
  w: string;
  s: number; // seconds from beat start
  e: number;
}

export interface Whip {
  t: number; // absolute seconds (centre of the whip)
  len: number; // seconds
}

export interface TBeat {
  id: string;
  section?: string;
  text: string;
  startSec: number;
  durSec: number;
  speechSec: number;
  audio: string | null; // path relative to /public, null = silent preview
  words: Word[];
  cam: CamKey[];
  sfx: SfxCue[];
}

export interface Theme {
  skyTop: string;
  skyBottom: string;
  tiltShift: boolean;
  vignette: number; // 0..0.6
  captionY: number; // 0..1 from top (reference videos sit around 0.66)
  captionSize: number; // px at 1080 wide
}

export interface Timeline {
  title: string;
  brand: string;
  fps: number;
  width: number;
  height: number;
  totalSec: number;
  theme: Theme;
  bed: {sfx: string; vol: number} | null;
  whips: Whip[];
  framing?: {label: string; beat: string; at: number; points: number[][]}[];
  beats: TBeat[];
}
