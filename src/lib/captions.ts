import type {Timeline, Word} from '../types';

export interface Chunk {
  text: string;
  s: number; // absolute seconds
  e: number;
}

const DANGLERS = new Set([
  'the', 'a', 'an', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'with', 'by', 'for',
  'its', 'your', 'is', 'it', 'that', 'than', 'into', 'from', 'as', 'so', 'but', 'my', 'our',
]);
const ENDS = /[,.?!;:]$/;

/** Reference videos show 2-5 words at a time, breaking at commas/periods. */
export const chunkWords = (words: Word[], maxWords = 4, maxChars = 22): {text: string; s: number; e: number}[] => {
  const out: {text: string; s: number; e: number}[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({text: cur.map((w) => w.w).join(' '), s: cur[0].s, e: cur[cur.length - 1].e});
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);
    const chars = cur.map((x) => x.w).join(' ').length;
    if (ENDS.test(w.w)) {
      flush();
    } else if (cur.length >= maxWords || chars >= maxChars) {
      const lastClean = w.w.toLowerCase().replace(/[^a-z']/g, '');
      if (DANGLERS.has(lastClean) && cur.length > 1 && i < words.length - 1) {
        const carry = cur.pop() as Word;
        flush();
        cur = [carry];
      } else {
        flush();
      }
    }
  }
  flush();
  return out;
};

export const buildChunks = (tl: Timeline): Chunk[] => {
  const all: Chunk[] = [];
  for (const b of tl.beats) {
    for (const c of chunkWords(b.words)) {
      all.push({text: c.text, s: b.startSec + c.s, e: b.startSec + c.e});
    }
  }
  return all;
};

/** Active chunk at time t (held until the next chunk starts, max 0.35 s past its last word). */
export const chunkAt = (chunks: Chunk[], t: number): Chunk | null => {
  let idx = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].s <= t) idx = i;
    else break;
  }
  if (idx < 0) return null;
  const c = chunks[idx];
  const next = chunks[idx + 1];
  const end = next ? Math.min(next.s, c.e + 0.35) : c.e + 0.35;
  return t < end ? c : null;
};
