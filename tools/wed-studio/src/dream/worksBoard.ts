// Minest · 造梦基地 — the blueprint board behind the model table: every dream work is a blueprint sheet pinned to it
// (tap one and it goes onto the table), the row below is the seeds of new dreams (the theme worlds: tap one to start
// a new work from it), and three round tokens lead on: the passport hall, the park, and 梦工坊's full director's desk.
// It replaces the works panel. It lives in the engine's scene, in the table's space, like the racks and the desk.
import * as THREE from 'three';

export type BoardHit = { type: 'work' | 'tpl' | 'act'; id: string };
function sheet(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d')!; draw(c, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function paper(c: CanvasRenderingContext2D, w: number, h: number, bg: string, gold: boolean) {
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = 1;
  for (let x = 16; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 16; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.strokeStyle = gold ? '#fbbf24' : 'rgba(255,255,255,.75)'; c.lineWidth = gold ? 10 : 3; c.strokeRect(5, 5, w - 10, h - 10);
}
function fit(c: CanvasRenderingContext2D, text: string, max: number) { let t = text; while (t.length > 1 && c.measureText(t).width > max) t = t.slice(0, -1); return t === text ? t : t.slice(0, -1) + '…'; }

export class WorksBoard {
  root = new THREE.Group();
  private tiles: THREE.Mesh[] = [];
  private sheets = new THREE.Group();
  private sig = '';
  constructor(private templates: { id: string; icon: string; name: string }[]) {
    const g = this.root; g.position.set(0, 0, -19.6);
    const cork = new THREE.MeshStandardMaterial({ color: 0x9a6b3f, roughness: 0.95 }), wood = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.7 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(44.6, 9.6, 0.3), cork); back.position.set(0, 8.4, -0.2); g.add(back);
    [[0, 13.3, 45.2, 0.5], [0, 3.5, 45.2, 0.5]].forEach((f) => { const m = new THREE.Mesh(new THREE.BoxGeometry(f[2], f[3], 0.5), wood); m.position.set(f[0], f[1], -0.1); g.add(m); });
    [-20, 20].forEach((x) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 13.4, 0.5), wood); p.position.set(x * 1.115, 6.7, -0.1); g.add(p); });
    // the back of the board, seen from the hallway door: a pinned-up plan, not a blank slab
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(44, 9.2), new THREE.MeshBasicMaterial({ map: sheet(880, 184, (c, w, h) => {
      c.fillStyle = '#1e4a94'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1;
      for (let x = 0; x < w; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(w / 2, h / 2, 190, 74, 0, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 14, 0, 7); c.stroke();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * 150, h / 2 + Math.sin(a) * 58); c.stroke(); c.beginPath(); c.ellipse(w / 2 + Math.cos(a) * 150, h / 2 + Math.sin(a) * 58, 34, 18, 0, 0, 7); c.stroke(); }
      [150, 730].forEach((x) => { c.strokeRect(x - 70, 40, 140, 104); c.beginPath(); c.moveTo(x - 70, 144); c.lineTo(x, 40); c.lineTo(x + 70, 144); c.stroke(); });
    }) })); plan.position.set(0, 8.4, -0.37); plan.rotation.y = Math.PI; g.add(plan);
    g.add(this.sheets);
  }
  /** the sheets, for these works (newest first) — rebuilt only when what they show has changed */
  show(works: { id: string; title?: string; updated?: number; objects?: { x: number; z: number; kind: string }[] }[], activeId: string | null) {
    const list = works.slice(0, 6), sig = list.map((w) => w.id + ':' + (w.title || '') + ':' + (w.objects || []).length + ':' + (w.updated || 0)).join('|') + '#' + activeId;
    if (sig === this.sig) return; this.sig = sig;
    this.sheets.traverse((o: any) => { if (o.material && o.material.map) o.material.map.dispose(); if (o.geometry) o.geometry.dispose(); });
    this.sheets.clear(); this.tiles = [];
    const add = (hit: BoardHit, x: number, y: number, w: number, h: number, map: THREE.Texture, round = false) => {
      const m = new THREE.Mesh(round ? new THREE.CircleGeometry(w / 2, 28) : new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map }));
      m.position.set(x, y, 0); m.userData.hit = hit; this.sheets.add(m); this.tiles.push(m);
      if (!round) { const pin = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc0262d, roughness: 0.3 })); pin.position.set(x, y + h / 2 - 0.3, 0.12); this.sheets.add(pin); }
    };
    list.forEach((w, i) => {
      const on = w.id === activeId;
      add({ type: 'work', id: w.id }, -18.6 + i * 5.3, 10.6, 4.9, 3.6, sheet(320, 236, (c, W, H) => {
        paper(c, W, H, on ? '#1b5fd0' : '#1e4a94', on);
        c.fillStyle = '#fff'; c.font = '700 26px "PingFang SC", sans-serif'; c.textBaseline = 'top'; c.fillText(fit(c, w.title || '未命名的梦', W - 36), 18, 16);
        const cx = W / 2, cy = 138, R = 76; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
        (w.objects || []).forEach((o) => { c.fillStyle = /castle|pyramid|eiffel|pagoda|tajmahal|bigben|liberty|colosseum|parthenon|maya|greatwall/.test(o.kind) ? '#fde68a' : '#bfe0ff'; c.beginPath(); c.arc(cx + o.x / 16 * R, cy + o.z / 16 * R, 4.5, 0, 7); c.fill(); });
      }));
    });
    this.templates.forEach((t, i) => {
      add({ type: 'tpl', id: t.id }, -18.4 + i * 4.6, 6.0, 4.2, 3.0, sheet(280, 200, (c, W, H) => {
        paper(c, W, H, '#f5e9c8', false); c.strokeStyle = '#8a5a35'; c.lineWidth = 4; c.strokeRect(5, 5, W - 10, H - 10);
        c.font = '84px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t.icon, W / 2, 84);
        c.fillStyle = '#3f2716'; c.font = '700 24px "PingFang SC", sans-serif'; c.fillText(fit(c, t.name, W - 30), W / 2, 162);
      }));
    });
    [['hall', '📔'], ['park', '🏰']].forEach(([id, ic], i) => {
      add({ type: 'act', id }, 14.2 + i * 3.1, 10.6, 2.7, 2.7, sheet(128, 128, (c) => {
        c.fillStyle = id === 'hall' || activeId ? '#fbbf24' : '#8b8d8a'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
        c.fillStyle = '#fff7e0'; c.beginPath(); c.arc(64, 64, 50, 0, 7); c.fill();
        c.font = '62px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic, 64, 68);
      }), true);
    });
  }
  pick(ray: THREE.Raycaster): BoardHit | null {
    if (!this.root.visible) return null;
    const h = ray.intersectObjects(this.tiles, false)[0];
    return h ? (h.object.userData.hit as BoardHit) : null;
  }
}
