// Offline QA for the camera path: run with `npm run check`.
// For every entry in story.json "framing" it samples the camera at that moment, projects the
// listed world-space subject points through the 9:16 perspective camera, and reports shots where
// a subject would be clipped or behind the camera. It also verifies the loop closes and lists
// the fastest camera moves (which should coincide with your "whips").
//
// story.json:  "framing": [{"label": "b04 wide", "beat": "b04", "at": 0.6, "points": [[x,y,z], ...]}]
import {timeline as tl, getBeat} from '../src/timeline';
import {buildCameraKeys, sampleCamera} from '../src/lib/camera';

const keys = buildCameraKeys(tl);
const dist = (p: number[], q: number[]) => Math.hypot(...p.map((v, i) => v - q[i]));
const aspect = tl.width / tl.height;

const first = sampleCamera(keys, 0);
const last = sampleCamera(keys, tl.totalSec);
const loopGap = dist(first.pos, last.pos) + dist(first.look, last.look);
console.log(`loop closure: start vs end camera differ by ${loopGap.toFixed(3)} units ${loopGap < 0.25 ? '(ok)' : '(WARN: video will not loop seamlessly)'}`);

let prev = first;
let fastest = {speed: 0, t: 0};
for (let t = 1 / tl.fps; t < tl.totalSec; t += 1 / tl.fps) {
  const s = sampleCamera(keys, t);
  if ([...s.pos, ...s.look, s.fov].some((v) => !Number.isFinite(v))) throw new Error(`non-finite camera at t=${t}`);
  const sp = dist(s.pos, prev.pos) * tl.fps;
  if (sp > fastest.speed) fastest = {speed: sp, t};
  prev = s;
}
console.log(`fastest camera move: ${fastest.speed.toFixed(1)} units/s at ${fastest.t.toFixed(1)}s; whips scheduled at ${tl.whips.map((w) => w.t.toFixed(1)).join(', ') || 'none'}`);

const project = (cam: ReturnType<typeof sampleCamera>, p: number[]) => {
  const f = cam.look.map((v, i) => v - cam.pos[i]);
  const fl = Math.hypot(...f);
  const fw = f.map((v) => v / fl);
  // right = forward x up(0,1,0)
  const right = [-fw[2], 0, fw[0]];
  const rl = Math.hypot(...right) || 1;
  const r = right.map((v) => v / rl);
  const u = [r[1] * fw[2] - r[2] * fw[1], r[2] * fw[0] - r[0] * fw[2], r[0] * fw[1] - r[1] * fw[0]];
  const v = p.map((x, i) => x - cam.pos[i]);
  const x = v[0] * r[0] + v[1] * r[1] + v[2] * r[2];
  const y = v[0] * u[0] + v[1] * u[1] + v[2] * u[2];
  const z = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
  const th = Math.tan((cam.fov * Math.PI) / 360);
  return {x: x / z / (th * aspect), y: y / z / th, z};
};

let bad = 0;
const checks = (tl as any).framing as {label: string; beat: string; at: number; points: number[][]}[] | undefined;
if (!checks?.length) console.log('no "framing" checks in story.json (add some: this is how you catch clipped shots before a long render)');
for (const c of checks ?? []) {
  const b = getBeat(c.beat);
  const cam = sampleCamera(keys, b.startSec + b.durSec * c.at);
  const ps = c.points.map((p) => project(cam, p));
  const worst = Math.max(...ps.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  const behind = ps.some((p) => p.z <= 0);
  const flag = behind ? 'BEHIND' : worst > 1 ? 'CLIPPED' : worst > 0.96 ? 'tight' : 'ok';
  if (flag === 'CLIPPED' || flag === 'BEHIND') bad++;
  console.log(`  ${flag.padEnd(8)} worst|ndc|=${worst.toFixed(2)}  ${c.label}`);
}
console.log(bad ? `\n${bad} shot(s) need camera fixes (frame is only ~0.34 x camera-distance wide in 9:16)` : '\nframing ok');
process.exit(bad ? 1 : 0);
