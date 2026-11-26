import * as THREE from 'three';
import {rng} from '../lib/easing';

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

const finish = (c: HTMLCanvasElement) => {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

/** Procedural walnut grain (seeded: identical in every render worker). */
export const makeWoodTexture = (base = '#7a4a2b', dark = '#4d2a14') => {
  const c = canvas(1024, 512);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, base);
  grad.addColorStop(1, dark);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 512);
  const r = rng(7);
  for (let i = 0; i < 220; i++) {
    const y = r() * 512;
    const amp = 2 + r() * 10;
    const f = 0.004 + r() * 0.012;
    g.strokeStyle = `rgba(${r() > 0.5 ? '30,14,4' : '190,130,80'},${0.05 + r() * 0.18})`;
    g.lineWidth = 0.6 + r() * 2.2;
    g.beginPath();
    for (let x = 0; x <= 1024; x += 8) {
      const yy = y + Math.sin(x * f + i) * amp;
      if (x === 0) g.moveTo(x, yy);
      else g.lineTo(x, yy);
    }
    g.stroke();
  }
  return finish(c);
};

/** Engraved brass nameplate that sits on the front edge of each diorama base. */
export const makePlateTexture = (text: string) => {
  const c = canvas(1024, 128);
  const g = c.getContext('2d') as CanvasRenderingContext2D;
  const grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#e3c872');
  grad.addColorStop(0.5, '#b98f35');
  grad.addColorStop(1, '#8e6a22');
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 128);
  g.strokeStyle = 'rgba(70,48,10,0.7)';
  g.lineWidth = 4;
  g.strokeRect(10, 10, 1004, 108);
  g.fillStyle = '#3f2c09';
  g.font = '600 56px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  (g as any).letterSpacing = '6px';
  g.fillText(text.toUpperCase(), 512, 68);
  return finish(c);
};
