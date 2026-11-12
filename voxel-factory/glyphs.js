// Text -> voxel layout. Latin/digits use a crisp 5x7 bitmap font; any other
// character (CJK, symbols...) is rasterised from the system font so nothing is dropped.
const F = {
  A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01110/10001/10000/10000/10000/10001/01110', D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001',
  I: '01110/00100/00100/00100/00100/00100/01110', J: '00111/00010/00010/00010/00010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110', P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101', R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110', V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/11011/10001', X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100', Z: '11111/00001/00010/00100/01000/10000/11111',
  0: '01110/10011/10101/10101/11001/10001/01110', 1: '00100/01100/00100/00100/00100/00100/01110',
  2: '01110/10001/00001/00110/01000/10000/11111', 3: '11110/00001/00001/01110/00001/00001/11110',
  4: '10010/10010/10010/11111/00010/00010/00010', 5: '11111/10000/11110/00001/00001/10001/01110',
  6: '01110/10000/11110/10001/10001/10001/01110', 7: '11111/00001/00010/00100/01000/01000/01000',
  8: '01110/10001/10001/01110/10001/10001/01110', 9: '01110/10001/10001/01111/00001/00001/01110',
  '-': '00000/00000/00000/11111/00000/00000/00000', '.': '00000/00000/00000/00000/00000/01100/01100',
  '!': '00100/00100/00100/00100/00100/00000/00100', '?': '01110/10001/00001/00110/00100/00000/00100',
  ',': '00000/00000/00000/00000/00110/00100/01000', "'": '00100/00100/01000/00000/00000/00000/00000',
  ':': '00000/01100/01100/00000/01100/01100/00000', '&': '01100/10010/10100/01000/10101/10010/01101',
};

const cache = new Map();
let rasterCanvas;

function bitmap(ch) {
  const rows = F[ch];
  if (!rows) return null;
  return rows.split('/').map((r) => [...r].map((c) => c === '1'));
}

function raster(ch) {
  const N = 10;
  rasterCanvas ??= document.createElement('canvas');
  rasterCanvas.width = rasterCanvas.height = N;
  const g = rasterCanvas.getContext('2d', { willReadFrequently: true });
  g.clearRect(0, 0, N, N);
  g.fillStyle = '#000';
  g.font = `bold ${N}px sans-serif`;
  g.textBaseline = 'middle';
  g.textAlign = 'center';
  g.fillText(ch, N / 2, N / 2 + 1);
  const d = g.getImageData(0, 0, N, N).data;
  const grid = [];
  let any = false;
  for (let y = 0; y < N; y++) {
    const row = [];
    for (let x = 0; x < N; x++) {
      const on = d[(y * N + x) * 4 + 3] > 110;
      any ||= on;
      row.push(on);
    }
    grid.push(row);
  }
  return any ? grid : null;
}

// Returns { grid, approximated } ; grid rows are top-first.
export function glyph(ch) {
  if (cache.has(ch)) return cache.get(ch);
  let res;
  const up = ch.toUpperCase();
  if (F[up]) res = { grid: bitmap(up), approximated: up !== ch };
  else res = { grid: raster(ch), approximated: false };
  if (!res.grid) res = { grid: bitmap('?'), approximated: true };
  cache.set(ch, res);
  return res;
}

export const MAX_LINE_VOX = 60;
export const MAX_LINES = 3;
const GAP = 1;
const LINE_GAP = 3;

function charW(ch) {
  return ch === ' ' ? 3 : glyph(ch).grid[0].length;
}

function wrap(text) {
  const lines = [];
  for (const para of text.split(/\r?\n/)) {
    let cur = '';
    let curW = 0;
    const push = () => { lines.push(cur.replace(/\s+$/, '')); cur = ''; curW = 0; };
    for (const word of para.split(/(?<=\s)/)) {
      const chars = [...word];
      const w = chars.reduce((s, c) => s + charW(c) + GAP, 0);
      if (curW + w - GAP > MAX_LINE_VOX && cur) push();
      for (const c of chars) {
        const cw = charW(c) + GAP;
        if (curW + cw - GAP > MAX_LINE_VOX && cur) push();
        cur += c;
        curW += cw;
      }
    }
    lines.push(cur.replace(/\s+$/, ''));
  }
  return lines.filter((l, i) => l || lines.length === 1 || i < lines.length - 1);
}

// Layout in voxel units; y grows upward from 0.
export function layoutText(text) {
  let lines = wrap(text.trim() || ' ');
  const truncated = lines.length > MAX_LINES;
  lines = lines.slice(0, MAX_LINES);
  if (truncated) lines[MAX_LINES - 1] = lines[MAX_LINES - 1].slice(0, -1) + '…';
  let approximated = false;
  const rendered = lines.map((l) => {
    let x = 0;
    const cells = [];
    let h = 7;
    for (const ch of l) {
      if (ch === ' ') { x += 3 + GAP; continue; }
      const { grid, approximated: a } = glyph(ch);
      approximated ||= a;
      h = Math.max(h, grid.length);
      cells.push({ grid, x });
      x += grid[0].length + GAP;
    }
    return { cells, w: Math.max(0, x - GAP), h };
  });
  const W = Math.max(1, ...rendered.map((r) => r.w));
  const H = rendered.reduce((s, r) => s + r.h, 0) + LINE_GAP * (rendered.length - 1);
  const voxels = [];
  let top = H;
  for (const r of rendered) {
    const offX = Math.floor((W - r.w) / 2);
    for (const { grid, x } of r.cells) {
      const gh = grid.length;
      for (let row = 0; row < gh; row++) {
        for (let col = 0; col < grid[0].length; col++) {
          if (grid[row][col]) voxels.push({ x: offX + x + col, y: top - r.h + (gh - 1 - row) });
        }
      }
    }
    top -= r.h + LINE_GAP;
  }
  return { voxels, W, H, lines, truncated, approximated };
}
