#!/usr/bin/env node
// Procedural sound-effect generator. Zero dependencies, deterministic output.
// Writes mono 44.1 kHz 16-bit WAVs to public/sfx/ plus manifest.json ({name: {dur}}).
// These are clean "designed" placeholders. Drop a better sample with the SAME file name
// into public/sfx/ (then update manifest.json durations) to upgrade any cue.
//
// usage: node scripts/generate-sfx.mjs [name ...]   (no args = generate everything)

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'sfx');
fs.mkdirSync(outDir, {recursive: true});

// ---------- helpers ----------
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const buf = (sec) => new Float32Array(Math.max(1, Math.round(sec * SR)));
const noise = (n, seed = 1) => {
  const r = rng(seed);
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) o[i] = r() * 2 - 1;
  return o;
};
const lerp = (a, b, t) => a + (b - a) * t;
const logLerp = (a, b, t) => Math.exp(lerp(Math.log(a), Math.log(b), t));
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** TPT state-variable filter with per-sample cutoff. mode: 'lp' | 'bp' | 'hp' */
const svf = (x, cutoffAt, q, mode = 'bp') => {
  const o = new Float32Array(x.length);
  let ic1 = 0;
  let ic2 = 0;
  const k = 1 / q;
  for (let i = 0; i < x.length; i++) {
    const fc = Math.min(cutoffAt(i / x.length, i / SR), SR * 0.45);
    const g = Math.tan((Math.PI * fc) / SR);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    const v3 = x[i] - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    o[i] = mode === 'lp' ? v2 : mode === 'bp' ? v1 : x[i] - k * v1 - v2;
  }
  return o;
};
const env = (n, fn) => {
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) o[i] = fn(i / n, i / SR);
  return o;
};
const mul = (a, b) => a.map((v, i) => v * b[i]);
const add = (...bs) => {
  const n = Math.max(...bs.map((b) => b.length));
  const o = new Float32Array(n);
  for (const b of bs) for (let i = 0; i < b.length; i++) o[i] += b[i];
  return o;
};
const gain = (a, g) => a.map((v) => v * g);
const mixAt = (dst, src, sec, g = 1) => {
  const off = Math.round(sec * SR);
  for (let i = 0; i < src.length && off + i < dst.length; i++) if (off + i >= 0) dst[off + i] += src[i] * g;
};
const osc = (n, freqAt, shape = 'sine', phase0 = 0) => {
  const o = new Float32Array(n);
  let ph = phase0;
  for (let i = 0; i < n; i++) {
    ph += (2 * Math.PI * freqAt(i / n, i / SR)) / SR;
    const s = Math.sin(ph);
    o[i] = shape === 'sine' ? s : shape === 'saw' ? ((ph / Math.PI) % 2) - 1 : shape === 'square' ? (s >= 0 ? 1 : -1) : s;
  }
  return o;
};
const expDecay = (rate) => (_p, t) => Math.exp(-t * rate);
const AD = (a, d) => (_p, t) => clamp01(t / a) * Math.exp(-Math.max(0, t - a) / d);
const hann = (_p, _t) => 0;

// ---------- sounds ----------
const S = {};

S.whoosh = () => {
  const n = Math.round(0.95 * SR);
  const raw = svf(noise(n, 11), (p) => logLerp(350, 3400, Math.sin(p * Math.PI * 0.5) ** 1.4) * (1 - 0.55 * Math.max(0, p - 0.55)), 2.2, 'bp');
  const w = svf(raw, () => 4200, 0.7, 'lp');
  return mul(w, env(n, (p) => Math.sin(Math.PI * p) ** 2.2));
};
S.whoosh_soft = () => {
  const n = Math.round(0.8 * SR);
  const w = svf(svf(noise(n, 12), (p) => logLerp(260, 1500, p), 1.6, 'bp'), () => 3000, 0.7, 'lp');
  return gain(mul(w, env(n, (p) => Math.sin(Math.PI * p) ** 2)), 0.8);
};
S.tick = () => {
  const n = Math.round(0.07 * SR);
  const c = mul(svf(noise(n, 13), () => 3200, 2.5, 'bp'), env(n, expDecay(160)));
  const b = mul(osc(n, () => 2300), env(n, expDecay(130)));
  return add(gain(c, 1.4), gain(b, 0.5));
};
S.click = () => {
  const n = Math.round(0.12 * SR);
  const hi = mul(svf(noise(n, 14), () => 2600, 2, 'bp'), env(n, expDecay(220)));
  const lo = mul(osc(n, (p) => lerp(520, 300, p)), env(n, expDecay(60)));
  return add(gain(hi, 1.2), gain(lo, 0.6));
};
S.pop = () => {
  const n = Math.round(0.22 * SR);
  const body = mul(osc(n, (p, t) => 160 + 640 * Math.exp(-t * 55)), env(n, expDecay(22)));
  const air = mul(svf(noise(n, 15), () => 1800, 1, 'bp'), env(n, expDecay(90)));
  return add(body, gain(air, 0.35));
};
S.thud = () => {
  const n = Math.round(0.6 * SR);
  const body = mul(osc(n, (p, t) => 48 + 70 * Math.exp(-t * 28)), env(n, expDecay(9)));
  const hit = mul(svf(noise(n, 16), () => 420, 0.8, 'lp'), env(n, expDecay(40)));
  return add(body, gain(hit, 0.7));
};
S.clunk = () => {
  const n = Math.round(0.7 * SR);
  const out = new Float32Array(n);
  mixAt(out, S.thud(), 0, 0.9);
  for (const [f, d, g] of [[310, 14, 0.35], [523, 18, 0.28], [811, 26, 0.2], [1337, 34, 0.12]]) {
    mixAt(out, mul(osc(n, () => f), env(n, expDecay(d))), 0, g);
  }
  return out;
};
S.metal_clank = () => {
  const n = Math.round(1.1 * SR);
  const out = new Float32Array(n);
  for (const [f, d, g] of [[420, 7, 0.4], [687, 9, 0.35], [1130, 11, 0.3], [1790, 15, 0.22], [2760, 22, 0.15]]) {
    mixAt(out, mul(osc(n, () => f * (1 + 0.003 * Math.sin(f))), env(n, expDecay(d))), 0, g);
  }
  mixAt(out, mul(svf(noise(n, 17), () => 3500, 1.5, 'hp'), env(n, expDecay(70))), 0, 0.5);
  return out;
};
S.ding = () => {
  const n = Math.round(1.6 * SR);
  const out = new Float32Array(n);
  for (const [r, d, g] of [[1, 3.2, 0.6], [2.76, 5, 0.3], [5.4, 8, 0.16], [8.93, 12, 0.08]]) {
    mixAt(out, mul(osc(n, () => 880 * r), env(n, expDecay(d))), 0, g);
  }
  return mul(out, env(n, AD(0.002, 1)));
};
S.sparkle = () => {
  const n = Math.round(0.9 * SR);
  const out = new Float32Array(n);
  const r = rng(18);
  for (let i = 0; i < 11; i++) {
    const f = 2200 + r() * 4200;
    const m = Math.round(0.18 * SR);
    mixAt(out, mul(osc(m, () => f), env(m, expDecay(26))), r() * 0.55, 0.2 + r() * 0.18);
  }
  return out;
};
S.swell = () => {
  const n = Math.round(1.9 * SR);
  const w = svf(noise(n, 19), (p) => logLerp(180, 1500, p), 0.8, 'bp');
  const pad = add(osc(n, () => 110), gain(osc(n, () => 165.4), 0.6), gain(osc(n, () => 220.7), 0.3));
  return mul(add(gain(w, 0.9), gain(pad, 0.25)), env(n, (p) => Math.sin(Math.PI * Math.pow(p, 0.7)) ** 2));
};
S.riser = () => {
  const n = Math.round(1.6 * SR);
  const w = svf(noise(n, 20), (p) => logLerp(300, 7000, p), 1.1, 'bp');
  const t = osc(n, (p) => logLerp(220, 1760, p));
  return mul(add(w, gain(t, 0.12)), env(n, (p) => p ** 2.2 * (p > 0.97 ? (1 - p) / 0.03 : 1)));
};
S.air_rush = () => {
  const n = Math.round(1.2 * SR);
  const w = svf(svf(noise(n, 21), (p, t) => 1000 + 450 * Math.sin(t * 5), 1.2, 'bp'), () => 3200, 0.7, 'lp');
  return mul(w, env(n, (p) => Math.sin(Math.PI * p) ** 1.3));
};
S.hiss = () => {
  const n = Math.round(0.6 * SR);
  return mul(svf(noise(n, 22), () => 5200, 0.8, 'hp'), env(n, AD(0.02, 0.18)));
};
S.crack = () => {
  const n = Math.round(0.6 * SR);
  const out = new Float32Array(n);
  mixAt(out, mul(svf(noise(n, 23), () => 1600, 0.7, 'hp'), env(n, expDecay(48))), 0, 1);
  const r = rng(24);
  for (let i = 0; i < 4; i++) mixAt(out, S.tick(), 0.03 + r() * 0.12, 0.5 + r() * 0.4);
  mixAt(out, mul(osc(n, () => 70), env(n, expDecay(18))), 0, 0.6);
  return out;
};
S.creak = () => {
  const n = Math.round(0.95 * SR);
  const f = (p, t) => lerp(120, 205, p) + 9 * Math.sin(t * 38) + 5 * Math.sin(t * 11);
  const saw = osc(n, f, 'saw');
  const voiced = svf(saw, (p) => lerp(520, 1100, Math.sin(p * 6)), 4, 'bp');
  return gain(mul(voiced, env(n, (p) => Math.sin(Math.PI * p) ** 1.2)), 1.2);
};
S.slide = () => {
  const n = Math.round(0.45 * SR);
  const w = svf(noise(n, 25), (p) => lerp(700, 1500, p), 2.2, 'bp');
  const out = mul(w, env(n, (p) => Math.sin(Math.PI * p) ** 1.5));
  mixAt(out, S.tick(), 0.4, 0.4);
  return out;
};
S.drip = () => {
  const n = Math.round(0.35 * SR);
  const a = mul(osc(n, (p, t) => 500 + 1600 * (1 - Math.exp(-t * 60))), env(n, expDecay(30)));
  const b = mul(osc(n, (p, t) => 900 + 900 * (1 - Math.exp(-t * 60))), env(n, expDecay(36)));
  const out = new Float32Array(n);
  mixAt(out, a, 0, 0.8);
  mixAt(out, b, 0.07, 0.3);
  return out;
};
S.drill = () => {
  const n = Math.round(0.7 * SR);
  const saw = osc(n, (p) => lerp(300, 540, Math.min(1, p * 2)), 'saw');
  const buzz = mul(saw, env(n, (p, t) => 0.55 + 0.45 * Math.sin(2 * Math.PI * 70 * t)));
  const f = svf(buzz, () => 1800, 1.4, 'lp');
  return mul(add(f, gain(svf(noise(n, 26), () => 4000, 1, 'hp'), 0.12)), env(n, (p) => Math.sin(Math.PI * Math.pow(p, 0.5)) ** 0.6));
};
S.servo = () => {
  const n = Math.round(1.1 * SR);
  const f = (p) => lerp(180, 360, p);
  const a = osc(n, f, 'square');
  const b = mul(svf(a, () => 1400, 1.2, 'lp'), env(n, (p) => 0.6 + 0.4 * Math.sin(p * 90)));
  return mul(b, env(n, (p) => Math.sin(Math.PI * p) ** 0.9));
};
S.water = () => {
  const n = Math.round(1.6 * SR);
  const w = svf(noise(n, 27), (p, t) => 2600 + 900 * Math.sin(t * 17) + 500 * Math.sin(t * 41), 0.9, 'bp');
  const b = svf(noise(n, 28), (p, t) => 900 + 400 * Math.sin(t * 9), 1.5, 'bp');
  return mul(add(w, gain(b, 0.6)), env(n, (p) => Math.min(1, p * 8) * Math.min(1, (1 - p) * 5)));
};
S.rumble_pass = () => {
  const n = Math.round(2.4 * SR);
  const w = svf(noise(n, 29), (p) => lerp(70, 160, Math.sin(p * Math.PI)), 0.8, 'lp');
  return mul(w, env(n, (p) => Math.sin(Math.PI * p) ** 1.6)).map((v) => v * 4);
};
S.beep = () => {
  const n = Math.round(0.22 * SR);
  return mul(osc(n, () => 1320), env(n, (p) => Math.min(1, p * 30) * Math.min(1, (1 - p) * 20)));
};

// ---------- ambience beds (seamless loops) ----------
const loopify = (x, xfSec = 1) => {
  const xf = Math.round(xfSec * SR);
  const n = x.length - xf;
  const o = new Float32Array(n);
  for (let i = 0; i < n; i++) o[i] = x[i];
  for (let i = 0; i < xf; i++) {
    const a = Math.sin((i / xf) * Math.PI * 0.5);
    const b = Math.cos((i / xf) * Math.PI * 0.5);
    o[i] = x[i] * a + x[n + i] * b;
  }
  return o;
};
const bed = (seed, lowHz, tones, hissG) => () => {
  const sec = 13;
  const n = Math.round(sec * SR);
  const low = svf(noise(n, seed), () => lowHz, 0.7, 'lp');
  let out = gain(low, 5);
  for (const [f, g] of tones) out = add(out, gain(osc(n, () => f), g));
  out = add(out, gain(svf(noise(n, seed + 1), () => 3200, 0.6, 'bp'), hissG));
  return loopify(out, 1);
};
S.cabin_hum = bed(31, 210, [[98, 0.05], [147.3, 0.03]], 0.1);
S.room_tone = bed(33, 320, [[60, 0.02]], 0.05);
S.machine_hum = bed(35, 260, [[120, 0.07], [240.4, 0.035], [360.9, 0.02]], 0.04);

// ---------- write ----------
const fade = (x, inMs = 2, outMs = 25) => {
  const a = Math.round((inMs / 1000) * SR);
  const b = Math.round((outMs / 1000) * SR);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= i / a;
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= i / b;
  return x;
};
const isBed = (name) => ['cabin_hum', 'room_tone', 'machine_hum'].includes(name);
const wav = (x) => {
  const data = Buffer.alloc(x.length * 2);
  for (let i = 0; i < x.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};

const manifestPath = path.join(outDir, 'manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const wanted = process.argv.slice(2);
for (const [name, make] of Object.entries(S)) {
  if (wanted.length && !wanted.includes(name)) continue;
  let x = make();
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const target = isBed(name) ? 0.5 : 0.9;
  if (peak > 0) x = x.map((v) => (v / peak) * target);
  if (!isBed(name)) x = fade(x);
  fs.writeFileSync(path.join(outDir, `${name}.wav`), wav(x));
  manifest[name] = {dur: +(x.length / SR).toFixed(3)};
  console.log(`  ${name.padEnd(12)} ${manifest[name].dur.toFixed(2)}s`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`SFX written to ${path.relative(process.cwd(), outDir) || outDir}`);
