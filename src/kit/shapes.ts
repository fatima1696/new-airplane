import * as THREE from 'three';

/** Append a rounded rectangle (centred on the origin) to a Shape or Path. */
export const roundedRect = (p: THREE.Path, w: number, h: number, r: number) => {
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y);
  p.lineTo(x + w - r, y);
  p.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x + w, y + h - r);
  p.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  p.lineTo(x + r, y + h);
  p.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x, y + r);
  p.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
};

/** Rounded plate with optional round holes, extruded along +z. */
export const plateGeometry = (
  w: number,
  h: number,
  r: number,
  depth: number,
  holes: {x: number; y: number; r: number}[] = [],
) => {
  const s = new THREE.Shape();
  roundedRect(s, w, h, r);
  for (const hole of holes) {
    const p = new THREE.Path();
    p.absarc(hole.x, hole.y, hole.r, 0, Math.PI * 2, true);
    s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: false, curveSegments: 28});
  g.translate(0, 0, -depth / 2);
  return g;
};

/** Rounded frame (outer rounded-rect with a rounded-rect window cut out). */
export const frameGeometry = (
  w: number,
  h: number,
  rOuter: number,
  winW: number,
  winH: number,
  rWin: number,
  depth: number,
) => {
  const s = new THREE.Shape();
  roundedRect(s, w, h, rOuter);
  const hole = new THREE.Path();
  roundedRect(hole, winW, winH, rWin);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 28});
  g.translate(0, 0, -depth / 2);
  return g;
};
