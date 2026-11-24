// Minest · 造梦基地 — what each department does, as things in its room (no panels):
//  · Show Designers' studio — the glowing bulb on the desk: tap it and say your dream; it becomes a new work.
//    The storyboard on the wall is the open work's lines, one card each: tap a card to move it one place earlier.
//  · MAPO — the open work's characters stand on the bench as little figures: tap one to choose it; the row of cams
//    beside them are what it does in the show (a lit cam is on). The big lever is the boat's speed (three notches),
//    and the little rides on the next bench run through the show when they are turning.
import * as THREE from 'three';
import type { DreamHost } from './dreamHost';

const ACTS: [string, string][] = [['raiseHand', '👋'], ['openArms', '🤗'], ['bow', '🙇'], ['smile', '😊'], ['nod', '🙂'], ['turnHead', '👀'], ['point', '👉'], ['stroll', '🚶']];
function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number, lines: number) {
  let line = '', n = 0;
  for (const ch of text) { if (c.measureText(line + ch).width > max) { c.fillText(n === lines - 1 ? line.slice(0, -1) + '…' : line, x, y + n * lh); if (++n >= lines) return; line = ch; } else line += ch; }
  if (line) c.fillText(line, x, y + n * lh);
}
const M = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

export class Stations {
  private dyn = new THREE.Group();
  private hits: THREE.Object3D[] = [];
  private who: string | null = null;
  private lever: THREE.Object3D; private bulb: THREE.Mesh; private spinning: THREE.Object3D[] = []; private busy = false;
  constructor(private root: THREE.Group, private host: DreamHost, private DM: any) {
    root.add(this.dyn);
    const add = (o: THREE.Object3D, x: number, y: number, z: number) => { o.position.set(x, y, z); root.add(o); return o; };
    const grip = (w: number, h: number, d: number, x: number, y: number, z: number, run: () => void) => { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); g.userData.run = run; add(g, x, y, z); this.fixed.push(g); };
    // the idea bulb, on the designers' desk
    this.bulb = add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), M(0xfff4c2, { emissive: 0xffd24a, emissiveIntensity: 1.6 })), -15.2, 1.32, 16.9) as THREE.Mesh;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.26, 12), M(0xd9b25a, { metalness: 0.6 })), -15.2, 0.97, 16.9);
    grip(0.9, 1.0, 0.9, -15.2, 1.3, 16.9, () => this.idea());
    // the boat's speed lever, and the rail the cams hang on
    add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 0.5), M(0x4b5563)), 18.9, 0.5, 8.2);
    add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.3), new THREE.MeshBasicMaterial({ map: tex(180, 60, (c) => { c.fillStyle = '#f5e9c8'; c.fillRect(0, 0, 180, 60); c.font = '40px sans-serif'; c.textBaseline = 'middle'; c.fillText('🐢', 6, 32); c.fillText('⛵', 68, 32); c.fillText('🐇', 130, 32); }) })), 18.9, 1.02, 8.46).rotation.x = -Math.PI / 2;
    this.lever = add(new THREE.Group(), 18.9, 1.0, 8.2);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), M(0xd9b25a, { metalness: 0.6 })); stick.position.y = 0.45; this.lever.add(stick);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), M(0xc0262d, { roughness: 0.3 })); ball.position.y = 0.95; this.lever.add(ball);
    grip(1.1, 1.4, 1.1, 18.9, 1.5, 8.2, () => { const r = host.rides(), next = r.speed < 1 ? 1.35 : r.speed < 2 ? 2.6 : 0.7; host.begin(); host.setBoatSpeed(next); host.events.onMessage?.(next < 1 ? '🐢 游船慢慢开' : next < 2 ? '⛵ 游船不快不慢' : '🐇 游船开得飞快'); this.refresh(); });
    add(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.9), M(0x55606e)), 20.9, 0.9, 8.2); ([[-1.2, -0.4], [1.2, -0.4], [-1.2, 0.4], [1.2, 0.4]] as number[][]).forEach(([a, b]) => add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), M(0x3a3a40)), 20.9 + a, 0.45, 8.2 + b));
    add(new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.06, 0.06), M(0x9aa3ad, { metalness: 0.7 })), 17.5, 1.98, 2.6);
  }
  private fixed: THREE.Object3D[] = [];
  private mini(kind: string, color: string | undefined, size: number): THREE.Object3D {
    const h = new THREE.Group();
    try {
      const p: THREE.Object3D = this.DM.build({ kind, color }); p.traverse((o: any) => { if (o.isLight) o.visible = false; });
      const b = new THREE.Box3().setFromObject(p), s = b.getSize(new THREE.Vector3()), c = b.getCenter(new THREE.Vector3()), k = size / Math.max(s.x, s.y * 0.8, s.z, 0.01);
      p.scale.setScalar(k); p.position.set(-c.x * k, -b.min.y * k, -c.z * k); h.add(p);
    } catch (e) { /* an empty stand */ }
    return h;
  }
  /** set the rooms' things to what the open work holds now */
  refresh() {
    const d = this.dyn, host = this.host; d.traverse((o: any) => { if (o.material && o.material.map) o.material.map.dispose(); }); d.clear(); this.hits = this.fixed.slice(); this.spinning = [];
    const put = (o: THREE.Object3D, x: number, y: number, z: number, run?: () => void) => { o.position.set(x, y, z); d.add(o); if (run) { o.userData.run = run; this.hits.push(o); } return o; };
    const hit = (w: number, h: number, dp: number, x: number, y: number, z: number, run: () => void) => put(new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), new THREE.MeshBasicMaterial({ visible: false })), x, y, z, run);
    // the storyboard
    const beats = host.beats().slice(0, 10), ids = beats.map((b) => b.id);
    beats.forEach((b, i) => {
      const card = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.6), new THREE.MeshBasicMaterial({ map: tex(258, 180, (c, w, h) => {
        c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a5a35'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
        c.fillStyle = '#8a1f2d'; c.beginPath(); c.arc(28, 28, 17, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = '700 21px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 28, 29);
        c.textAlign = 'left'; c.font = '34px sans-serif'; c.fillText(b.icon, 54, 30); c.fillStyle = '#3f2716'; c.font = '21px "PingFang SC", sans-serif'; c.textBaseline = 'top'; wrap(c, b.text, 14, 56, w - 28, 28, 4);
      }) })); card.rotation.y = Math.PI;
      const cx = -6.7 - (i % 5) * 0.96, cy = 2.2 - Math.floor(i / 5) * 0.7;
      // tap the card to rewrite its line; the little arrow on its corner moves it one place earlier
      put(card, cx, cy, 20.2, () => { const t = window.prompt('改这一句台词：', b.text); if (t != null && t.trim()) { host.begin(); host.setBeatText(b.id, t.trim()); this.refresh(); } });
      if (i) { const arrow = new THREE.Mesh(new THREE.CircleGeometry(0.11, 16), new THREE.MeshBasicMaterial({ map: tex(64, 64, (c) => { c.fillStyle = '#fbbf24'; c.beginPath(); c.arc(32, 32, 31, 0, 7); c.fill(); c.fillStyle = '#3f2716'; c.font = '700 40px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('◀', 30, 34); }) })); arrow.rotation.y = Math.PI;
        put(arrow, cx + 0.36, cy + 0.24, 20.17, () => { const a = ids.slice(); a.splice(i - 1, 0, a.splice(i, 1)[0]); host.reorderBeats(a); host.events.onMessage?.('🎞 第 ' + (i + 1) + ' 句挪到了前面'); this.refresh(); }); }
    });
    // the cast on the bench, and the cams of the one that is chosen
    const cast = host.cast().slice(0, 5), cur = cast.find((c) => c.id === this.who) || cast[0]; this.who = cur ? cur.id : null;
    cast.forEach((c, i) => {
      const o = host.work.objects.find((q: any) => q.id === c.id), x = 16.9 + i * 0.45, on = cur && c.id === cur.id;
      put(this.mini(o.kind, o.color, 0.42), x, 0.97, 2.1);
      if (on) { const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24), M(0xfbbf24, { emissive: 0xfbbf24, emissiveIntensity: 1 })); ring.rotation.x = Math.PI / 2; put(ring, x, 0.98, 2.1); }
      hit(0.42, 0.8, 0.6, x, 1.3, 2.1, () => { this.who = c.id; host.events.onMessage?.(c.icon + ' ' + c.name); this.refresh(); });
    });
    if (cur) ACTS.forEach(([op, icon], i) => {
      const a = cur.acts.find((q) => q.op === op); if (!a) return;
      const cam = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ map: tex(96, 96, (c) => { c.fillStyle = a.on ? '#fbbf24' : '#6b7280'; c.beginPath(); c.arc(48, 48, 47, 0, 7); c.fill(); c.fillStyle = a.on ? '#fff7e0' : '#d1d5db'; c.beginPath(); c.arc(48, 48, 38, 0, 7); c.fill(); c.font = '46px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icon, 48, 52); }) }));
      put(cam, 16.25 + i * 0.36, 1.78, 2.6, () => { host.toggleAction(cur.id, op); host.events.onMessage?.(icon + (a.on ? ' 收起来了' : ' 加进演出了')); this.refresh(); });
    });
    // the rides, and the lever
    const r = host.rides(); this.lever.rotation.z = r.speed < 1 ? 0.6 : r.speed < 2 ? 0 : -0.6;
    r.things.slice(0, 5).forEach((t, i) => {
      const o = host.work.objects.find((q: any) => q.id === t.id), x = 19.9 + i * 0.5, m = put(this.mini(o.kind, o.color, 0.42), x, 0.95, 8.2);
      if (t.on) this.spinning.push(m);
      hit(0.46, 0.9, 0.8, x, 1.3, 8.2, () => { host.toggleSpin(t.id); host.events.onMessage?.(t.icon + ' ' + t.name + (t.on ? ' 停下了' : ' 会在演出里一直转')); this.refresh(); });
    });
  }
  private idea() {
    if (this.busy) return; const I = (window as any).DWImagineer, host = this.host;
    const go = async (text: string) => { if (!text || text.trim().length < 2) { this.busy = false; return; } host.events.onMessage?.('✨ 正在把「' + text.slice(0, 16) + '」变成世界…'); try { if (await host.dreamFromIdea(text.trim())) host.goShop(); } catch (e) { host.events.onMessage?.('没变出来，再试一次'); } this.busy = false; };
    this.busy = true;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR && I && I.listenIdea) { host.events.onMessage?.('💡 说出你的梦…'); let got = false; I.listenIdea((t: string) => { if (!got) { got = true; go(t); } }, (st: string) => { if (st !== 'listening' && !got) window.setTimeout(() => { if (!got) { got = true; go(window.prompt('说出或写下你的梦：', '') || ''); } }, 600); }); }
    else go(window.prompt('写下你的梦：冰雪城堡前，独角兽在放烟花…', '') || '');
  }
  frame(dt: number) { this.spinning.forEach((m) => { m.rotation.y += dt * 2; }); (this.bulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + Math.sin(performance.now() / 260) * 0.5; }
  /** a tap while walking: the thing under the pointer does what it does */
  tap(ray: THREE.Raycaster): boolean {
    ray.far = 9; const h = ray.intersectObjects(this.hits, false)[0]; ray.far = Infinity;
    if (!h) return false; (h.object.userData.run as () => void)(); return true;
  }
}
