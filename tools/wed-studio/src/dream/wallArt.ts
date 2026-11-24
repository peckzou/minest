// Minest · 造梦基地 — the pictures on the walls of 1401 Flower Street: concept paintings in the manner of the ones that
// hang in Imagineering's halls, painted on a canvas with gradients and shapes (no words). Our own pictures of the
// kinds of place a park has — a castle at night, a great silver sphere, a ship of pirates, a jungle river, a snowy
// mountain, a rocket, an old house on a hill, a main street — not copies of any real painting.
export type Scene = 'castle' | 'sphere' | 'pirates' | 'jungle' | 'mountain' | 'space' | 'mansion' | 'street' | 'plan' | 'monorail';
type C = CanvasRenderingContext2D;
function sky(c: C, w: number, h: number, stops: string[]) { const g = c.createLinearGradient(0, 0, 0, h); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function stars(c: C, w: number, h: number, n: number, seed: number) { c.fillStyle = '#fff'; for (let i = 0; i < n; i++) { const x = (Math.sin(i * 12.9898 + seed) * 43758.5453) % 1, y = (Math.sin(i * 78.233 + seed) * 12543.123) % 1; c.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(i * 3.1)); c.fillRect(Math.abs(x) * w, Math.abs(y) * h * 0.62, 1.6, 1.6); } c.globalAlpha = 1; }
function tri(c: C, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x, y - h); c.lineTo(x + w / 2, y); c.closePath(); c.fill(); }
function hills(c: C, w: number, h: number, y: number, amp: number, col: string, ph: number) { c.fillStyle = col; c.beginPath(); c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, y + Math.sin(x / w * 6.3 + ph) * amp + Math.sin(x / w * 17 + ph * 2) * amp * 0.35); c.lineTo(w, h); c.fill(); }
function burst(c: C, x: number, y: number, r: number, col: string) { c.strokeStyle = col; c.lineWidth = 1.6; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.25, y + Math.sin(a) * r * 0.25); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r + r * 0.12); c.stroke(); } c.globalAlpha = 1; }
function tree(c: C, x: number, y: number, s: number, col: string) { c.fillStyle = '#4a3323'; c.fillRect(x - s * 0.06, y - s * 0.5, s * 0.12, s * 0.5); c.fillStyle = col; [[0, -0.75, 0.42], [-0.26, -0.55, 0.3], [0.26, -0.55, 0.3]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }); }

export function paint(scene: Scene, c: C, w: number, h: number) {
  const G = h * 0.8;   // the ground line
  if (scene === 'castle') {
    sky(c, w, h, ['#0b1238', '#2a1f6b', '#7a3f8f', '#f08a6b']); stars(c, w, h, 70, 1);
    burst(c, w * 0.2, h * 0.24, h * 0.16, '#fde68a'); burst(c, w * 0.8, h * 0.2, h * 0.2, '#f9a8d4'); burst(c, w * 0.62, h * 0.12, h * 0.1, '#93c5fd');
    hills(c, w, h, G, 6, '#1b1a3a', 0.4);
    const x = w / 2, wall = '#f3e9f5', roof = '#3b5fc4';
    c.fillStyle = '#d9cfe6'; c.fillRect(x - w * 0.2, G - h * 0.2, w * 0.4, h * 0.2);
    ([[-0.2, 0.3, 0.05], [0.2, 0.3, 0.05], [-0.1, 0.4, 0.045], [0.1, 0.4, 0.045], [0, 0.55, 0.06]] as number[][]).forEach(([dx, th, tw]) => { c.fillStyle = wall; c.fillRect(x + dx * w - tw * w / 2, G - th * h, tw * w, th * h); tri(c, x + dx * w, G - th * h, tw * w * 1.5, h * 0.13, roof); c.fillStyle = '#fbbf24'; c.fillRect(x + dx * w - 1.5, G - th * h - h * 0.17, 3, h * 0.045); });
    c.fillStyle = '#4a2f5e'; c.beginPath(); c.arc(x, G, w * 0.035, Math.PI, 0); c.fill(); c.fillStyle = '#fde68a'; for (let i = -2; i <= 2; i++) c.fillRect(x + i * w * 0.05 - 2, G - h * 0.12, 4, 7);
    c.fillStyle = 'rgba(255,220,180,.18)'; c.fillRect(0, G, w, h - G);
  } else if (scene === 'sphere') {
    sky(c, w, h, ['#1e3a8a', '#60a5fa', '#fcd9a8']); hills(c, w, h, G, 5, '#3f7d58', 1.2);
    const x = w * 0.56, y = h * 0.47, r = h * 0.3, g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#cbd5e1'); g.addColorStop(1, '#64748b');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(x, y, r, 0, 7); c.clip(); c.strokeStyle = 'rgba(30,41,59,.35)'; c.lineWidth = 1;
    for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(x + i * r / 4 - r, y - r); c.lineTo(x + i * r / 4 + r, y + r); c.stroke(); c.beginPath(); c.moveTo(x + i * r / 4 + r, y - r); c.lineTo(x + i * r / 4 - r, y + r); c.stroke(); c.beginPath(); c.moveTo(x - r, y + i * r / 4); c.lineTo(x + r, y + i * r / 4); c.stroke(); } c.restore();
    c.fillStyle = '#94a3b8'; [[-0.5, 0.9], [0.5, 0.9], [0, 0.98]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(x + dx * r - 5, G); c.lineTo(x + dx * r * 0.6, y + dy * r); c.lineTo(x + dx * r + 5, G); c.fill(); });
    c.fillStyle = '#e2e8f0'; c.fillRect(0, h * 0.64, w, 4); for (let i = 0; i < 6; i++) c.fillRect(i * w / 5 - 3, h * 0.64, 6, G - h * 0.64); c.fillStyle = '#f8fafc'; c.beginPath(); c.roundRect(w * 0.06, h * 0.585, w * 0.3, h * 0.055, 9); c.fill(); c.fillStyle = '#d0262d'; c.fillRect(w * 0.06, h * 0.615, w * 0.3, 3);
  } else if (scene === 'pirates') {
    sky(c, w, h, ['#062a3a', '#0f5a66', '#2f8f8a']); stars(c, w, h, 40, 5);
    c.fillStyle = '#fef3c7'; c.beginPath(); c.arc(w * 0.78, h * 0.22, h * 0.1, 0, 7); c.fill(); c.fillStyle = 'rgba(254,243,199,.12)'; c.beginPath(); c.arc(w * 0.78, h * 0.22, h * 0.19, 0, 7); c.fill();
    hills(c, w, h, h * 0.62, 14, '#0b3b40', 2.2); c.fillStyle = '#f6ad55'; for (let i = 0; i < 5; i++) c.fillRect(w * 0.06 + i * 13, h * 0.58 - (i % 2) * 6, 4, 5);
    const x = w * 0.44, y = h * 0.7; c.fillStyle = '#5b3a22'; c.beginPath(); c.moveTo(x - w * 0.2, y - h * 0.08); c.quadraticCurveTo(x, y + h * 0.1, x + w * 0.22, y - h * 0.12); c.lineTo(x + w * 0.17, y + h * 0.02); c.quadraticCurveTo(x, y + h * 0.12, x - w * 0.15, y + h * 0.02); c.fill();
    c.strokeStyle = '#3b2616'; c.lineWidth = 3; [-0.09, 0.02, 0.12].forEach((dx, i) => { c.beginPath(); c.moveTo(x + dx * w, y - h * 0.02); c.lineTo(x + dx * w, y - h * (0.42 + (i === 1 ? 0.1 : 0))); c.stroke(); c.fillStyle = '#f1e4c6'; c.beginPath(); c.moveTo(x + dx * w - w * 0.055, y - h * 0.12); c.quadraticCurveTo(x + dx * w + w * 0.03, y - h * 0.25, x + dx * w - w * 0.05, y - h * (0.38 + (i === 1 ? 0.09 : 0))); c.lineTo(x + dx * w + w * 0.05, y - h * (0.38 + (i === 1 ? 0.09 : 0))); c.quadraticCurveTo(x + dx * w + w * 0.08, y - h * 0.25, x + dx * w + w * 0.055, y - h * 0.12); c.fill(); });
    c.fillStyle = '#111'; c.fillRect(x + w * 0.02, y - h * 0.56, w * 0.05, h * 0.035);
    for (let i = 0; i < 4; i++) hills(c, w, h, y + h * 0.05 + i * h * 0.06, 4, ['#0e6f78', '#0b5a66', '#094852', '#073944'][i], i * 1.7);
  } else if (scene === 'jungle') {
    sky(c, w, h, ['#fde68a', '#a7e3a1', '#2f8f5a']); c.fillStyle = '#fff7d6'; c.beginPath(); c.arc(w * 0.72, h * 0.2, h * 0.09, 0, 7); c.fill();
    hills(c, w, h, h * 0.5, 16, '#1f6b45', 0.3); hills(c, w, h, h * 0.58, 12, '#17553a', 2.0);
    c.fillStyle = '#3aa6b9'; c.beginPath(); c.moveTo(0, h * 0.7); c.bezierCurveTo(w * 0.3, h * 0.6, w * 0.6, h * 0.86, w, h * 0.68); c.lineTo(w, h); c.lineTo(0, h); c.fill();
    const x = w * 0.46, y = h * 0.76; c.fillStyle = '#7a4a26'; c.beginPath(); c.roundRect(x - w * 0.14, y, w * 0.28, h * 0.07, 8); c.fill(); for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#f8fafc' : '#d0262d'; c.fillRect(x - w * 0.12 + i * w * 0.034, y - h * 0.13, w * 0.034, h * 0.045); } c.fillStyle = '#4a3323'; [-0.12, 0.115].forEach((dx) => c.fillRect(x + dx * w, y - h * 0.09, 3, h * 0.09));
    for (let i = 0; i < 7; i++) { const lx = (i * 0.17 + 0.02) * w; c.strokeStyle = '#0f3f2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(lx, h); c.quadraticCurveTo(lx + 10, h * 0.7, lx + (i % 2 ? 26 : -22), h * 0.52); c.stroke(); c.fillStyle = ['#2f9e5f', '#1f7a4a'][i % 2]; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(lx + (i % 2 ? 26 : -22), h * 0.52, 30, 8, k * 0.63 - 1.2, 0, 7); c.fill(); } }
  } else if (scene === 'mountain') {
    sky(c, w, h, ['#3b82f6', '#bfdbfe', '#f0f9ff']); c.fillStyle = 'rgba(255,255,255,.85)'; [[0.2, 0.2, 0.09], [0.28, 0.22, 0.07], [0.8, 0.15, 0.08]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x * w, y * h, r * w, r * h * 0.55, 0, 0, 7); c.fill(); });
    tri(c, w * 0.5, G, w * 0.62, h * 0.66, '#7b8794'); tri(c, w * 0.5, G - h * 0.42, w * 0.225, h * 0.24, '#ffffff'); tri(c, w * 0.42, G, w * 0.3, h * 0.3, '#5f6b78'); tri(c, w * 0.66, G, w * 0.26, h * 0.24, '#6b7785');
    c.strokeStyle = '#d0262d'; c.lineWidth = 3; c.beginPath(); c.moveTo(w * 0.3, G - h * 0.05); c.bezierCurveTo(w * 0.45, G - h * 0.3, w * 0.5, G - h * 0.05, w * 0.62, G - h * 0.22); c.stroke(); c.fillStyle = '#fbbf24'; c.beginPath(); c.roundRect(w * 0.47, G - h * 0.185, 16, 7, 3); c.fill();
    hills(c, w, h, G, 5, '#e6f0f5', 0.8); for (let i = 0; i < 9; i++) tri(c, w * (0.05 + i * 0.115), G + 8 + (i % 2) * 6, 22, 44, i % 2 ? '#14532d' : '#166534');
  } else if (scene === 'space') {
    sky(c, w, h, ['#020617', '#0f172a', '#312e81']); stars(c, w, h * 1.5, 130, 9);
    const g = c.createRadialGradient(w * 0.2, h * 0.3, 4, w * 0.22, h * 0.32, h * 0.2); g.addColorStop(0, '#fde68a'); g.addColorStop(1, '#c2410c'); c.fillStyle = g; c.beginPath(); c.arc(w * 0.22, h * 0.32, h * 0.17, 0, 7); c.fill(); c.strokeStyle = 'rgba(253,230,138,.8)'; c.lineWidth = 3; c.beginPath(); c.ellipse(w * 0.22, h * 0.32, h * 0.3, h * 0.06, -0.3, 0, 7); c.stroke();
    c.fillStyle = '#7dd3fc'; c.beginPath(); c.arc(w * 0.84, h * 0.72, h * 0.08, 0, 7); c.fill();
    c.save(); c.translate(w * 0.58, h * 0.48); c.rotate(-0.6); c.fillStyle = '#fb923c'; c.beginPath(); c.moveTo(-9, 34); c.lineTo(0, 78); c.lineTo(9, 34); c.fill(); c.fillStyle = '#f8fafc'; c.beginPath(); c.moveTo(0, -52); c.bezierCurveTo(22, -20, 20, 20, 14, 36); c.lineTo(-14, 36); c.bezierCurveTo(-20, 20, -22, -20, 0, -52); c.fill(); c.fillStyle = '#d0262d'; c.beginPath(); c.moveTo(0, -52); c.bezierCurveTo(10, -38, 13, -30, 14, -24); c.lineTo(-14, -24); c.bezierCurveTo(-13, -30, -10, -38, 0, -52); c.fill(); [-1, 1].forEach((s) => { c.beginPath(); c.moveTo(s * 14, 14); c.lineTo(s * 30, 40); c.lineTo(s * 14, 36); c.fill(); }); c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(0, -4, 7, 0, 7); c.fill(); c.restore();
  } else if (scene === 'mansion') {
    sky(c, w, h, ['#1e1b4b', '#5b3a8a', '#e58a8a']); c.fillStyle = '#fef9c3'; c.beginPath(); c.arc(w * 0.76, h * 0.26, h * 0.12, 0, 7); c.fill(); stars(c, w, h, 30, 3);
    hills(c, w, h, G - h * 0.04, 10, '#231942', 1.0);
    const x = w * 0.44; c.fillStyle = '#e8e4ee'; c.fillRect(x - w * 0.17, G - h * 0.34, w * 0.34, h * 0.31); c.fillStyle = '#3b3355'; tri(c, x, G - h * 0.34, w * 0.4, h * 0.13, '#3b3355'); c.fillRect(x - w * 0.02, G - h * 0.56, w * 0.04, h * 0.12);
    c.fillStyle = '#f7f5fb'; for (let i = 0; i < 5; i++) c.fillRect(x - w * 0.15 + i * w * 0.07, G - h * 0.3, w * 0.018, h * 0.27); c.fillStyle = '#fbbf24'; for (let i = 0; i < 4; i++) { c.fillRect(x - w * 0.115 + i * w * 0.07, G - h * 0.25, w * 0.03, h * 0.06); c.fillRect(x - w * 0.115 + i * w * 0.07, G - h * 0.13, w * 0.03, h * 0.06); }
    c.strokeStyle = '#15102a'; c.lineWidth = 4; const tx = w * 0.84; c.beginPath(); c.moveTo(tx, G + 6); c.lineTo(tx - 4, G - h * 0.3); c.stroke(); c.lineWidth = 2; [[-30, -0.42], [26, -0.46], [-14, -0.5], [34, -0.36], [-38, -0.3]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(tx - 3, G - h * 0.22); c.lineTo(tx + dx, G + dy * h); c.stroke(); });
    c.fillStyle = '#15102a'; for (let i = 0; i < 12; i++) c.fillRect(w * 0.04 + i * w * 0.08, G - 6, 2.5, 16); c.fillRect(0, G + 2, w, 2.5);
  } else if (scene === 'street') {
    sky(c, w, h, ['#60a5fa', '#bae6fd', '#fef3c7']); c.fillStyle = '#e7d7bd'; c.fillRect(0, G, w, h - G); c.fillStyle = '#c9b796'; c.beginPath(); c.moveTo(w * 0.42, G); c.lineTo(w * 0.58, G); c.lineTo(w * 0.8, h); c.lineTo(w * 0.2, h); c.fill();
    const cols = ['#f9a8d4', '#fde68a', '#a7f3d0', '#bfdbfe', '#fecaca', '#ddd6fe'];
    for (let i = 0; i < 6; i++) { const left = i < 3, k = left ? i : 5 - i, bx = left ? k * w * 0.13 : w - (k + 1) * w * 0.13, bh = h * (0.42 - k * 0.07), by = G - bh; c.fillStyle = cols[i]; c.fillRect(bx, by, w * 0.13, bh); c.fillStyle = '#7c2d12'; c.fillRect(bx, by - 7, w * 0.13, 8); c.fillStyle = '#fff'; for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) c.fillRect(bx + w * 0.022 + q * w * 0.055, by + 12 + r * bh * 0.3, w * 0.03, bh * 0.16); c.fillStyle = ['#d0262d', '#1d4ed8'][i % 2]; c.beginPath(); c.moveTo(bx, G - bh * 0.3); c.lineTo(bx + w * 0.13, G - bh * 0.3); c.lineTo(bx + w * 0.14, G - bh * 0.22); c.lineTo(bx - w * 0.01, G - bh * 0.22); c.fill(); }
    c.fillStyle = '#f3e9f5'; c.fillRect(w * 0.46, G - h * 0.24, w * 0.08, h * 0.24); tri(c, w * 0.5, G - h * 0.24, w * 0.1, h * 0.12, '#3b5fc4'); tri(c, w * 0.455, G - h * 0.1, w * 0.04, h * 0.1, '#3b5fc4'); tri(c, w * 0.545, G - h * 0.1, w * 0.04, h * 0.1, '#3b5fc4');
    [0.3, 0.7].forEach((x) => { c.fillStyle = '#1f2937'; c.fillRect(x * w - 1.5, G - h * 0.2, 3, h * 0.24); c.fillStyle = '#fef08a'; c.beginPath(); c.arc(x * w, G - h * 0.21, 6, 0, 7); c.fill(); });
  } else if (scene === 'monorail') {
    sky(c, w, h, ['#38bdf8', '#bae6fd', '#fef9c3']); hills(c, w, h, G, 8, '#4d9a63', 0.6); tree(c, w * 0.14, G + 8, 54, '#2f7d4a'); tree(c, w * 0.9, G + 10, 46, '#3a8f55');
    c.fillStyle = '#cbd5e1'; c.fillRect(0, h * 0.56, w, 7); for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(i * w / 4 - 9, G + 4); c.lineTo(i * w / 4 - 4, h * 0.56); c.lineTo(i * w / 4 + 4, h * 0.56); c.lineTo(i * w / 4 + 9, G + 4); c.fill(); }
    c.fillStyle = '#f8fafc'; c.beginPath(); c.moveTo(w * 0.16, h * 0.56); c.lineTo(w * 0.2, h * 0.44); c.quadraticCurveTo(w * 0.24, h * 0.4, w * 0.3, h * 0.4); c.lineTo(w * 0.86, h * 0.4); c.lineTo(w * 0.86, h * 0.56); c.fill(); c.fillStyle = '#d0262d'; c.fillRect(w * 0.18, h * 0.515, w * 0.68, 5); c.fillStyle = '#1e3a5f'; for (let i = 0; i < 7; i++) { c.beginPath(); c.roundRect(w * 0.27 + i * w * 0.083, h * 0.43, w * 0.062, h * 0.065, 3); c.fill(); } c.beginPath(); c.moveTo(w * 0.205, h * 0.455); c.lineTo(w * 0.25, h * 0.43); c.lineTo(w * 0.25, h * 0.495); c.lineTo(w * 0.195, h * 0.495); c.fill();
  } else {   // 'plan': a park as its designers first drew it — a hub, and the lands around it like spokes
    c.fillStyle = '#efe3c4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a5a3a'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(w / 2, h * 0.54, w * 0.4, h * 0.36, 0, 0, 7); c.stroke(); c.setLineDash([5, 5]); c.beginPath(); c.ellipse(w / 2, h * 0.54, w * 0.44, h * 0.41, 0, 0, 7); c.stroke(); c.setLineDash([]);
    const col = ['#f9a8d4', '#86c98f', '#f6c56b', '#93c5fd', '#c4b5fd']; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566, x = w / 2 + Math.cos(a) * w * 0.24, y = h * 0.54 + Math.sin(a) * h * 0.21; c.strokeStyle = '#7a5a3a'; c.beginPath(); c.moveTo(w / 2, h * 0.54); c.lineTo(x, y); c.stroke(); c.fillStyle = col[i]; c.beginPath(); c.ellipse(x, y, w * 0.095, h * 0.085, a, 0, 7); c.fill(); c.stroke(); }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(w / 2, h * 0.54, 13, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#3b5fc4'; tri(c, w / 2, h * 0.3, 16, 24, '#3b5fc4'); c.fillStyle = '#7a5a3a'; c.fillRect(w / 2 - 14, h * 0.88, 28, 8);
  }
}
