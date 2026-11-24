// Minest · 造梦基地 — the control desk on the front of the model table: the world's weather, time of day, light,
// music, fireworks and the boat ride, as things to turn, slide, crank and pull instead of a page of buttons.
// It lives in the engine's scene (table space, metres of the miniature) and writes the same fields 梦工坊's
// "加魔法" page writes: light-track clips (snow / rain / fireworks), env.mood, env.warmth, the music clip, work.ride.
import * as THREE from 'three';

export type Tool = 'route' | 'zone' | 'talk';
type Dev = 'weather' | 'clock' | 'lever' | 'music' | 'cord' | 'ride' | 'undo' | 'pen-route' | 'pen-zone' | 'pen-talk';
const WEATHER = ['clear', 'snow', 'rain'] as const;
const MOODS = ['day', 'dusk', 'night', 'theatre'] as const;
const MUSIC = ['none', 'chime', 'fanfare', 'pad', 'drum'] as const;
const SAY: Record<string, string> = {
  clear: '🌤 晴空万里', snow: '❄️ 飘起雪花', rain: '🌧 下起小雨',
  day: '☀️ 白天', dusk: '🌇 黄昏', night: '🌙 星空夜晚', theatre: '🎭 剧场追光',
  none: '🔕 安静', chime: '🎶 八音盒铃声', fanfare: '🎺 庆典号角', pad: '🎹 温柔星空曲', drum: '🥁 探险鼓',
};
export interface DeskHost {
  E: any; work: any; tool: Tool | null;
  setTool(t: Tool | null): void;
  ray(e: PointerEvent): THREE.Raycaster;
  screen(v: THREE.Vector3): { x: number; y: number };
  save(): void; undo(): void; say(t: string): void; preview(sec: number): void; routeChanged(): void;
}

function tex(w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function faceTex(cols: string[], icons: string[]) {
  return tex(256, 256, (c, w) => {
    const n = cols.length, R = w / 2;
    cols.forEach((col, i) => {
      // sector i is centred on the angle the pointer turns to for it (clockwise from the top)
      const a0 = -Math.PI / 2 + (i - 0.5) * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, am = (a0 + a1) / 2;
      c.fillStyle = col; c.beginPath(); c.moveTo(R, R); c.arc(R, R, R - 4, a0, a1); c.closePath(); c.fill();
      c.font = '54px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icons[i], R + Math.cos(am) * R * 0.6, R + Math.sin(am) * R * 0.6);
    });
    c.strokeStyle = '#d9b25a'; c.lineWidth = 8; c.beginPath(); c.arc(R, R, R - 6, 0, 7); c.stroke();
  });
}
const M = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, ...o });

export class ControlDesk {
  root = new THREE.Group();
  private hits: THREE.Mesh[] = [];
  private act: { dev: Dev; x: number; y: number; moved: boolean; fired?: boolean } | null = null;
  private hand: Record<string, THREE.Object3D> = {};
  private target = { weather: 0, clock: 0, lever: 0.5, music: 0, cord: 0, ride: 0, crank: 0 };
  private pegs: THREE.Mesh[] = [];
  private spin = 0;
  private pens: Record<string, THREE.MeshStandardMaterial> = {};
  private tassel!: THREE.Mesh;
  private leverEnds = [new THREE.Vector3(), new THREE.Vector3()];

  constructor(private host: DeskHost) {
    const g = this.root, wood = M(0x5a3a22), brass = M(0xd9b25a, { metalness: 0.6, roughness: 0.3 }), dark = M(0x1f2430);
    g.position.set(0, 0.2, 19.4); g.rotation.x = 0.28;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(31.6, 0.4, 4.4), wood));
    const trim = new THREE.Mesh(new THREE.BoxGeometry(31.8, 0.12, 0.14), brass); trim.position.set(0, 0.2, 2.2); g.add(trim);
    [-11, 11].forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 3.2), wood); b.position.set(x, -0.5, -1.6); b.rotation.x = -0.5; g.add(b); });
    const hit = (dev: Dev, x: number, w: number, h: number, d: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
      m.position.set(x, 0.2 + h / 2, 0); m.userData.dev = dev; g.add(m); this.hits.push(m);
    };
    const plaque = (x: number, icon: string) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: tex(96, 96, (c) => { c.fillStyle = '#f5e9c8'; c.fillRect(0, 0, 96, 96); c.font = '60px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(icon, 48, 52); }) }));
      p.rotation.x = -Math.PI / 2; p.position.set(x, 0.215, 1.72); g.add(p);
    };
    const dial = (dev: 'weather' | 'clock', x: number, cols: string[], icons: string[]) => {
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.22, 36), brass); base.position.set(x, 0.31, -0.1); g.add(base);
      const face = new THREE.Mesh(new THREE.CircleGeometry(1.42, 36), new THREE.MeshBasicMaterial({ map: faceTex(cols, icons) })); face.rotation.x = -Math.PI / 2; face.position.set(x, 0.425, -0.1); g.add(face);
      const h = new THREE.Group(); h.position.set(x, 0.46, -0.1); g.add(h);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 1.15), M(0xc0262d)); arm.position.z = -0.5; h.add(arm);
      const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.3, 16), dark); knob.position.y = 0.1; h.add(knob);
      this.hand[dev] = h; hit(dev, x, 3.2, 0.9, 3.4);
    };
    dial('weather', -10.5, ['#8fd0ff', '#e8f3ff', '#7f93b8'], ['☀️', '❄️', '🌧']); plaque(-10.5, '☁️');
    dial('clock', -6.3, ['#8fd0ff', '#f0a070', '#1c2550', '#3a2a40'], ['☀️', '🌇', '🌙', '🎭']); plaque(-6.3, '🕰');

    // the light lever: slide it from cool to warm
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 2.8), new THREE.MeshBasicMaterial({ map: tex(16, 128, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffae5c'); gr.addColorStop(0.5, '#fff1cf'); gr.addColorStop(1, '#9fc4ff'); c.fillStyle = gr; c.fillRect(0, 0, w, h); }) }));
    strip.rotation.x = -Math.PI / 2; strip.position.set(-2.9, 0.215, -0.1); g.add(strip);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 2.8), dark); slot.position.set(-2.2, 0.22, -0.1); g.add(slot);
    const lv = new THREE.Group(); lv.position.set(-2.2, 0.22, -0.1); g.add(lv);
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 10), brass); stick.position.y = 0.65; lv.add(stick);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), M(0xc0262d, { roughness: 0.3 })); ball.position.y = 1.4; lv.add(ball);
    this.hand.lever = lv; hit('lever', -2.5, 1.9, 1.9, 3.6); plaque(-2.5, '💡');

    // the music box: every turn of the crank is the next tune
    const mb = new THREE.Group(); mb.position.set(2.2, 0.2, -0.2); g.add(mb);
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 1.7), M(0x7a2f3a)); body.position.y = 0.55; mb.add(body);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 1.8), brass); lid.position.y = 1.16; mb.add(lid);
    ['#64748b', '#fbbf24', '#f472b6', '#38bdf8', '#34d399'].forEach((col, i) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12), M(parseInt(col.slice(1), 16), { emissive: parseInt(col.slice(1), 16), emissiveIntensity: 0 }));
      p.position.set(-0.84 + i * 0.42, 1.3, 0); mb.add(p); this.pegs.push(p);
    });
    const crank = new THREE.Group(); crank.position.set(1.25, 0.6, 0); mb.add(crank);
    const ax = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), brass); ax.rotation.z = Math.PI / 2; ax.position.x = 0.15; crank.add(ax);
    const ar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), brass); ar.position.set(0.36, 0.3, 0); crank.add(ar);
    const gr = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), dark); gr.position.set(0.5, 0.6, 0); crank.add(gr);
    this.hand.crank = crank; hit('music', 2.4, 3.6, 1.8, 3.2); plaque(2.2, '🎵');

    // the fireworks cord: pull it down
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 3.2, 10), brass); post.position.set(6.6, 1.8, -0.9); g.add(post);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.5), brass); arm2.position.set(6.6, 3.35, -0.2); g.add(arm2);
    const cord = new THREE.Group(); cord.position.set(6.6, 3.3, 0.45); g.add(cord);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 6), M(0xf5e9c8)); rope.position.y = -0.75; cord.add(rope);
    this.tassel = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 12), M(0x94a3b8, { emissive: 0xf472b6, emissiveIntensity: 0 })); this.tassel.position.y = -1.7; cord.add(this.tassel);
    this.hand.cord = cord; hit('cord', 6.6, 2.4, 3.6, 3.0); plaque(6.6, '🎆');

    // walk or boat: slide the little boat along its rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.1, 0.5), M(0x2f7fa8, { emissive: 0x0c3550, emissiveIntensity: 0.5 })); rail.position.set(10.6, 0.25, -0.1); g.add(rail);
    [['🚶', 9.1], ['⛵', 12.1]].forEach(([ic, x]) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ transparent: true, map: tex(96, 96, (c) => { c.font = '64px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ic as string, 48, 52); }) }));
      p.rotation.x = -Math.PI / 2; p.position.set(x as number, 0.23, -1.0); g.add(p);
    });
    const puck = new THREE.Group(); puck.position.set(10.6, 0.3, -0.1); g.add(puck);
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.6), M(0x8a5a35)); hull.position.y = 0.18; puck.add(hull);
    const sail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), M(0xfff7ed)); sail.position.y = 0.8; puck.add(sail);
    this.hand.ride = puck; hit('ride', 10.6, 4.0, 1.6, 2.6); plaque(10.6, '🧭');

    // the rewind key: one step back
    const key = new THREE.Group(); key.position.set(-13.4, 0.2, -0.1); g.add(key);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.5, 20), brass); drum.position.y = 0.25; key.add(drum);
    const wing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.1, 8, 20), M(0xc0262d, { roughness: 0.3 })); wing.position.y = 1.0; key.add(wing);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), brass); stem.position.y = 0.6; key.add(stem);
    this.hand.undo = key; hit('undo', -13.4, 2.2, 1.6, 2.6); plaque(-13.4, '↩️');

    // the pencil cup: yellow draws the guest's route, green rings a trigger zone, pink gives a character its line
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 0.95, 0.9, 18), M(0x3f6b8a)); cup.position.set(14.0, 0.65, -0.3); g.add(cup);
    ([['route', 0xfbbf24, -0.85], ['zone', 0x34d399, 0], ['talk', 0xf472b6, 0.85]] as [Tool, number, number][]).forEach(([tool, col, dx]) => {
      const pen = new THREE.Group(); pen.position.set(14.0 + dx, 0.9, -0.3); pen.rotation.z = -dx * 0.3; g.add(pen);
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.9, 8), M(col, { emissive: col, emissiveIntensity: 0 })); shaft.position.y = 0.95; pen.add(shaft);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), M(0xf5e9c8)); tip.position.y = 2.05; pen.add(tip);
      this.hand['pen-' + tool] = pen; this.pens[tool] = shaft.material as THREE.MeshStandardMaterial;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.2, 0.5), new THREE.MeshBasicMaterial({ visible: false }));
      m.position.set(14.0 + dx * 1.25, 2.0, -0.3); m.userData.dev = 'pen-' + tool; g.add(m); this.hits.push(m);
    });
    plaque(14.0, '✏️');

    lv.updateMatrixWorld(true);
  }

  // ---------------------------------------------------------------- what the work says now
  private clips(): any[] { return this.host.work.timeline.clips; }
  private weather() { const cs = this.clips(); return cs.some((c) => c.op === 'snow') ? 1 : cs.some((c) => c.op === 'rain') ? 2 : 0; }
  private music() { const m = this.clips().find((c) => c.track === 'music'); return Math.max(0, MUSIC.indexOf(m ? m.op : 'none')); }
  private fireworks() { return this.clips().some((c) => c.op === 'fireworks'); }
  sync() {
    const w = this.host.work; if (!w) return;
    this.target.weather = this.weather();
    this.target.clock = Math.max(0, MOODS.indexOf((w.env || {}).mood));
    this.target.lever = (w.env || {}).warmth == null ? 0.5 : +w.env.warmth;
    this.target.music = this.music();
    this.target.ride = w.ride && w.ride.mode === 'boat' ? 1 : 0;
  }

  // ---------------------------------------------------------------- what a turn of each thing does
  private uid(): string { return (window as any).DWTemplates.uid('c'); }
  private setWeather(i: number) {
    const w = this.host.work, wt = WEATHER[i];
    w.timeline.clips = this.clips().filter((c) => !(c.track === 'light' && (c.op === 'snow' || c.op === 'rain' || c.op === 'clear')));
    if (wt !== 'clear') w.timeline.clips.push({ id: this.uid(), track: 'light', op: wt, t0: 0, t1: Math.min(4, w.timeline.len) });
    this.done(SAY[wt]); this.host.preview(7);
  }
  private setMood(i: number) { const w = this.host.work; w.env = w.env || {}; w.env.mood = MOODS[i]; this.host.E.sync(); this.done(SAY[MOODS[i]]); }
  private setMusic(i: number) {
    const w = this.host.work, op = MUSIC[i];
    w.timeline.clips = this.clips().filter((c) => c.track !== 'music');
    if (op !== 'none') w.timeline.clips.push({ id: this.uid(), track: 'music', op, t0: 0, t1: w.timeline.len, target: null });
    this.done(SAY[op]); if (op !== 'none') this.host.preview(6);
  }
  private toggleFireworks() {
    const w = this.host.work, had = this.fireworks();
    w.timeline.clips = this.clips().filter((c) => c.op !== 'fireworks');
    if (!had) w.timeline.clips.push({ id: this.uid(), track: 'light', op: 'fireworks', t0: 0.5, t1: w.timeline.len });
    this.host.E.unlock(); if (!had) this.host.E.launchFireworks(6);
    this.done(had ? '烟花收起来了' : '🎆 演出里会放烟花');
  }
  private setRide(boat: boolean) {
    const w = this.host.work;
    w.ride = { mode: boat ? 'boat' : 'walk', speed: 1.35 };
    if (boat && (w.route || []).length < 4) w.route = [{ x: -8.5, z: 9.8 }, { x: -7, z: 2.5 }, { x: 0, z: 0.8 }, { x: 7, z: 2.5 }, { x: 8.5, z: 8.0 }];
    this.host.E.sync(); this.host.routeChanged(); this.done(boat ? '⛵ 坐小船游览' : '🚶 走路游览');
  }
  private done(msg: string) { this.sync(); this.host.save(); this.host.say(msg); }

  // ---------------------------------------------------------------- hands
  private centre(dev: Dev) { const o = this.hand[dev === 'music' ? 'crank' : dev]; return this.host.screen(o.getWorldPosition(new THREE.Vector3())); }
  pointerDown(e: PointerEvent): boolean {
    if (!this.host.work || !this.root.visible) return false;
    const h = this.host.ray(e).intersectObjects(this.hits, false)[0]; if (!h) return false;
    this.act = { dev: h.object.userData.dev as Dev, x: e.clientX, y: e.clientY, moved: false };
    return true;
  }
  pointerMove(e: PointerEvent) {
    const a = this.act; if (!a) return;
    if (!a.moved && Math.hypot(e.clientX - a.x, e.clientY - a.y) < 6) return;
    a.moved = true;
    if (a.dev === 'weather' || a.dev === 'clock') {   // turn the pointer to where the finger is
      const c = this.centre(a.dev), n = a.dev === 'weather' ? 3 : 4;
      let ang = Math.atan2(e.clientX - c.x, -(e.clientY - c.y)); if (ang < 0) ang += Math.PI * 2;
      const i = Math.round(ang / (2 * Math.PI / n)) % n;
      if (i !== this.target[a.dev]) { if (a.dev === 'weather') this.setWeather(i); else this.setMood(i); }
    } else if (a.dev === 'lever') {
      const p0 = this.host.screen(this.root.localToWorld(this.leverEnds[0].set(-2.2, 0.9, -1.4))), p1 = this.host.screen(this.root.localToWorld(this.leverEnds[1].set(-2.2, 0.9, 1.2)));
      const dx = p1.x - p0.x, dy = p1.y - p0.y, t = Math.max(0, Math.min(1, ((e.clientX - p0.x) * dx + (e.clientY - p0.y) * dy) / (dx * dx + dy * dy)));
      const w = this.host.work; w.env = w.env || {}; w.env.warmth = +(1 - t).toFixed(2); this.target.lever = w.env.warmth;   // towards the table = warm
    } else if (a.dev === 'cord' && !a.fired && e.clientY - a.y > 26) { a.fired = true; this.target.cord = 1; this.toggleFireworks(); }
    else if (a.dev === 'ride' && !a.fired && Math.abs(e.clientX - a.x) > 22) { a.fired = true; this.setRide(e.clientX > a.x); }
  }
  pointerUp() {
    const a = this.act; if (!a) return; this.act = null;
    if (a.dev === 'lever') { if (a.moved) this.done('💡 灯光' + (this.target.lever > 0.6 ? '暖一点' : this.target.lever < 0.4 ? '冷一点' : '不冷不暖')); return; }
    if (a.moved && a.dev !== 'music') return;
    // a tap: the next position
    if (a.dev === 'pen-route' || a.dev === 'pen-zone' || a.dev === 'pen-talk') { const t = a.dev.slice(4) as Tool; this.host.setTool(this.host.tool === t ? null : t); }
    else if (a.dev === 'undo') { this.spin += Math.PI * 2; this.host.undo(); }
    else if (a.dev === 'weather') this.setWeather((this.target.weather + 1) % 3);
    else if (a.dev === 'clock') this.setMood((this.target.clock + 1) % 4);
    else if (a.dev === 'music') { this.target.crank += Math.PI * 2; this.setMusic((this.target.music + 1) % MUSIC.length); }
    else if (a.dev === 'cord') { this.target.cord = 1; this.toggleFireworks(); }
    else if (a.dev === 'ride') this.setRide(!this.target.ride);
  }

  frame(dt: number) {
    if (!this.root.visible) return;
    const k = Math.min(1, dt * 9), T = this.target, H = this.hand;
    const turn = (o: THREE.Object3D, to: number) => { o.rotation.y += Math.atan2(Math.sin(to - o.rotation.y), Math.cos(to - o.rotation.y)) * k; };
    turn(H.weather, -T.weather * 2 * Math.PI / 3); turn(H.clock, -T.clock * Math.PI / 2);
    H.lever.position.z += ((-1.3 + (1 - T.lever) * 2.4) - 0.1 - H.lever.position.z) * k; H.lever.rotation.x = (0.5 - T.lever) * 0.5;
    H.crank.rotation.x += (T.crank - H.crank.rotation.x) * Math.min(1, dt * 5);
    this.pegs.forEach((p, i) => { const on = i === T.music; p.position.y += ((on ? 1.55 : 1.3) - p.position.y) * k; (p.material as THREE.MeshStandardMaterial).emissiveIntensity = on ? 1.2 : 0; });
    T.cord = Math.max(0, T.cord - dt * 2.2); H.cord.position.y = 3.3 - Math.sin(Math.min(1, T.cord) * Math.PI) * 0.6;
    (this.tassel.material as THREE.MeshStandardMaterial).emissiveIntensity = this.host.work && this.fireworks() ? 1.4 : 0;
    H.ride.position.x += ((T.ride ? 11.7 : 9.5) - H.ride.position.x) * k;
    H.undo.rotation.y += (-this.spin - H.undo.rotation.y) * Math.min(1, dt * 6);
    (['route', 'zone', 'talk'] as Tool[]).forEach((t) => { const on = this.host.tool === t, pen = H['pen-' + t]; pen.position.y += ((on ? 1.9 : 0.9) - pen.position.y) * k; this.pens[t].emissiveIntensity = on ? 0.9 + 0.4 * Math.sin(performance.now() / 180) : 0; });
  }
}
