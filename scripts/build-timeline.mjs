#!/usr/bin/env node
// Builds public/timeline.json from src/story/story.json (+ voiceover files if present).
//
//  - If public/voice/<id>.json exists (written by make_voiceover.py) its duration and
//    word timings are used; else if <id>.mp3 exists, ffprobe is tried; else timings are
//    ESTIMATED from the word count so you can preview the animation before recording.
//  - Resolves string `atWord` SFX anchors ("secretly" or "pane:2") to word indices.
//  - Fails loudly on bad anchors so you never render a silently-misplaced sound effect.

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const story = JSON.parse(fs.readFileSync(path.join(root, 'src/story/story.json'), 'utf8'));
const meta = story.meta;
const GAP = meta.gap ?? 0.14; // pause between beats (s)
const TAIL = meta.tail ?? 0.6; // after the last beat (s)
const WPS = meta.wps ?? 2.9; // estimation speed (reference videos ≈ 2.8–3.0 words/s)

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const tokens = (text) => text.split(/\s+/).filter(Boolean);

function estimateWords(text, speechSec) {
  const toks = tokens(text);
  const pause = (w) => (/[.?!]$/.test(w) ? 0.4 : /[,;:]$/.test(w) ? 0.2 : 0);
  const totalPause = toks.reduce((a, w) => a + pause(w), 0);
  const weights = toks.map((w) => w.replace(/[^A-Za-z0-9]/g, '').length + 2);
  const wsum = weights.reduce((a, b) => a + b, 0);
  const speak = Math.max(0.2 * toks.length, speechSec - totalPause);
  let t = 0;
  return toks.map((w, i) => {
    const d = (weights[i] / wsum) * speak;
    const o = {w, s: +t.toFixed(3), e: +(t + d).toFixed(3)};
    t += d + pause(w);
    return o;
  });
}

function probeMp3(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], {encoding: 'utf8'});
  const d = parseFloat(r.stdout);
  return Number.isFinite(d) ? d : null;
}

let cursor = 0;
const beats = [];
for (const b of story.beats) {
  const toks = tokens(b.text);
  const mp3 = path.join(root, 'public/voice', `${b.id}.mp3`);
  const side = path.join(root, 'public/voice', `${b.id}.json`);
  const hasAudio = fs.existsSync(mp3);
  let speechSec;
  let words;
  if (fs.existsSync(side)) {
    const j = JSON.parse(fs.readFileSync(side, 'utf8'));
    speechSec = j.duration;
    words = Array.isArray(j.words) && j.words.length === toks.length
      ? j.words.map((w, i) => ({w: toks[i], s: +w.s.toFixed(3), e: +w.e.toFixed(3)}))
      : estimateWords(b.text, speechSec);
  } else if (hasAudio && (speechSec = probeMp3(mp3))) {
    words = estimateWords(b.text, speechSec);
  } else {
    speechSec = toks.length / WPS + 0.15;
    words = estimateWords(b.text, speechSec);
  }
  const durSec = +(speechSec + GAP + (b.hold ?? 0)).toFixed(3);

  const sfx = (b.sfx ?? []).map((c) => {
    const o = {...c};
    if (typeof o.atWord === 'string') {
      const [needle, occ = '1'] = o.atWord.split(':');
      let n = 0;
      let idx = -1;
      for (let i = 0; i < toks.length; i++) {
        if (norm(toks[i]) === norm(needle) && ++n === Number(occ)) {
          idx = i;
          break;
        }
      }
      if (idx < 0) {
        throw new Error(`[${b.id}] sfx "${c.sfx}": word "${o.atWord}" not found.\n  words: ${toks.map((w, i) => `${i}:${w}`).join(' ')}`);
      }
      o.atWord = idx;
    }
    if (o.atWord === undefined && o.at === undefined && o.atFrac === undefined) o.at = 0;
    return o;
  });

  beats.push({
    id: b.id,
    section: b.section,
    text: b.text,
    startSec: +cursor.toFixed(3),
    durSec,
    speechSec: +speechSec.toFixed(3),
    audio: hasAudio ? `voice/${b.id}.mp3` : null,
    words,
    cam: b.cam ?? [],
    sfx,
  });
  cursor += durSec;
}
const totalSec = +(cursor + TAIL).toFixed(3);

const whips = (story.whips ?? []).map((w) => {
  const b = beats.find((x) => x.id === w.beat);
  if (!b) throw new Error(`whip references unknown beat "${w.beat}"`);
  return {t: +(b.startSec + b.durSec * w.at).toFixed(3), len: w.len ?? 0.6};
});

const theme = {
  skyTop: '#6f96bd',
  skyBottom: '#c9d9e6',
  tiltShift: true,
  vignette: 0.28,
  captionY: 0.66,
  captionSize: 64,
  ...(meta.theme ?? {}),
};

const timeline = {
  title: meta.title,
  brand: meta.brand,
  fps: meta.fps ?? 30,
  width: meta.width ?? 1080,
  height: meta.height ?? 1920,
  totalSec,
  theme,
  bed: meta.bed ?? null,
  whips,
  framing: story.framing ?? [],
  beats,
};
fs.mkdirSync(path.join(root, 'public'), {recursive: true});
fs.writeFileSync(path.join(root, 'public/timeline.json'), JSON.stringify(timeline, null, 1));
const voiced = beats.filter((b) => b.audio).length;
console.log(`timeline: ${beats.length} beats, ${totalSec.toFixed(1)}s, ${Math.round(totalSec * timeline.fps)} frames, voiced beats ${voiced}/${beats.length}${voiced < beats.length ? '  (unvoiced beats use ESTIMATED timing: run `npm run voice`)' : ''}`);
