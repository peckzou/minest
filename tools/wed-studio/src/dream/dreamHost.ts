// Minest · 造梦基地 — the dream workshop's own engine, living on the studio's model table.
// The studio does not rebuild a work as voxels any more: it loads 梦工坊's scripts (../dw-models.js … ../dw-engine.js, the
// same files dream-workshop/index.html runs) on this page's three.js, starts the Experience Engine in host mode, and
// draws the engine's scene as a second pass through a camera moved into the table's space — so the miniature on the
// table is the real work: the same models, the same show, the same picking. Diving in is the same scene at full size.
import * as THREE from 'three';
import { ControlDesk, Tool } from './controlDesk';
import { WorksBoard } from './worksBoard';
import { PassportHall } from './passportHall';
import { ImagineerBuilding, RoomId } from './building';
import { WalkBuilding } from './walkBuilding';
export type { RoomId } from './building';

const SCRIPTS = ['dw-models.js', 'dw-models-world.js', 'dw-templates.js', 'dw-templates2.js', 'dw-ip-worlds.js', 'dw-engine.js', 'dw-imagineer.js'];
const PFX = 'sh:dw:work:';
export const TABLE_SCALE = 0.15;                                  // the engine's 16 m disc on the 5.1 m deep table
export const TABLE_POS = new THREE.Vector3(0.85, 1.365, 0.35);    // the middle of the felt
const TABLE_R = 16;

export type DreamMode = 'mini' | 'diving' | 'guest' | 'rising' | 'hall' | 'building' | 'room';
/** what the note card shows of the thing in the hand */
export interface Picked { id: string; kind: string; icon: string; name: string; voice: string | null; tap: string | null; text: string | null; fact: string; builtin: { where: string; text: string } | null; color: string | null }
export interface KnowledgeCard { key: string; icon: string; title: string; where: string; text: string; isNew: boolean; found: number; total: number }
export interface DreamEvents {
  onMode?(m: DreamMode): void;
  onMessage?(text: string): void;
  onCard?(c: KnowledgeCard): void;
  onChange?(): void;           // the work on the table was edited here
  onRide?(riding: boolean, done: boolean): void;
  onSelect?(p: Picked | null, focus?: 'voice' | 'tap'): void;
  onTool?(t: Tool | null): void;
  onRoom?(id: RoomId): void;
  onRoomChange?(id: RoomId | null): void;
  onEnterStudio?(at: RoomId | 'door'): void;
  onBuildingView?(v: 'walk' | 'doll'): void;
  onAct?(id: 'park' | 'editor', workId: string): void;
  onPassport?(found: number, total: number, stars: number): void;
}

// 梦工坊's models were written for three r128: light intensities there were π times what the same number means now,
// and canvas textures were taken as sRGB. Hand its scripts a THREE that still behaves that way.
function compatThree(): any {
  const T: any = { ...THREE };
  const legacy = (Base: any) => {
    const C = class extends Base {};
    Object.defineProperty(C.prototype, 'intensity', {
      configurable: true,
      get(this: any) { return this._legacy == null ? 1 : this._legacy; },
      set(this: any, v: number) { this._legacy = v * Math.PI * 0.8; },
    });
    return C;
  };
  ['PointLight', 'SpotLight', 'DirectionalLight', 'HemisphereLight', 'AmbientLight'].forEach((n) => { T[n] = legacy((THREE as any)[n]); });
  T.CanvasTexture = class extends THREE.CanvasTexture {
    constructor(...a: any[]) { super(...(a as [any])); this.colorSpace = THREE.SRGBColorSpace; }
  };
  return T;
}
function loadScript(src: string): Promise<void> {
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = src; s.async = false; s.onload = () => res(); s.onerror = () => rej(new Error('could not load ' + src));
    document.head.appendChild(s);
  });
}
const win = window as any;
function lget<T>(k: string, d: T): T { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
function lset(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } }

export class DreamHost {
  E: any; M: any;
  mode: DreamMode = 'mini';
  work: any = null;
  events: DreamEvents = {};
  private miniCam = new THREE.PerspectiveCamera();
  private inv = new THREE.Matrix4();
  private m4 = new THREE.Matrix4();
  private drag: { o: any; ox: number; oz: number; x: number; y: number; moved: boolean; fresh?: boolean } | null = null;
  private look: { x: number; y: number; lx: number; ly: number; moved: boolean } | null = null;
  private fly: { t: number; dur: number; p0: THREE.Vector3; q0: THREE.Quaternion; p1: THREE.Vector3; q1: THREE.Quaternion } | null = null;
  private gate: THREE.Group;
  private saveT = 0;
  private boardT = 0;

  static async create(canvas: HTMLCanvasElement): Promise<DreamHost | null> {
    try {
      win.THREE = compatThree();
      await Promise.all(SCRIPTS.map((f) => loadScript('../' + f + '?v=23')));
      if (!win.DWEngine || !win.DWModels) return null;
      return (win.MinestDream = new DreamHost(canvas));
    } catch (e) {
      console.warn('[dream] 梦工坊 engine not available here', e);
      return null;
    }
  }
  private constructor(private canvas: HTMLCanvasElement) {
    const self = this;
    this.E = win.DWEngine; this.M = win.DWModels;
    this.E.init(canvas, { light: 0.3 });
    this.E.showHelpers(true);   // the route and the trigger zones are drawn on the table, so they are shown on it
    this.E.useCamera(this.miniCam);
    this.inv.compose(TABLE_POS, new THREE.Quaternion(), new THREE.Vector3(TABLE_SCALE, TABLE_SCALE, TABLE_SCALE)).invert();
    this.E.on.guest = (t: string) => this.events.onMessage?.(t);
    this.E.on.rideEnd = () => this.events.onRide?.(true, true);
    // the way in: a little glowing gate where the guest's route starts — tap it to shrink and walk in
    this.gate = new THREE.Group();
    const gold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xf59e0b, emissiveIntensity: 1.6, roughness: 0.4 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.13, 10, 28, Math.PI), gold);
    [-1.1, 1.1].forEach((x) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.2, 10), gold); p.position.set(x, 0.6, 0); this.gate.add(p); });
    arch.position.y = 1.2; this.gate.add(arch);
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.0, 24), new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    glow.position.y = 1.0; this.gate.add(glow);
    this.gate.visible = false; this.E.scene().add(this.gate);
    this.buildRacks();
    this.desk = new ControlDesk({
      E: this.E, get work() { return self.work; }, get tool() { return self.tool; }, setTool: (t) => this.setTool(t),
      ray: (e) => this.rayAt(e),
      screen: (v) => { const r = this.canvas.getBoundingClientRect(); v.applyMatrix4(this.miniCam.matrixWorldInverse).applyMatrix4(this.miniCam.projectionMatrix); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
      save: () => this.save(), undo: () => { this.deskUndo = true; }, say: (t) => this.events.onMessage?.(t), preview: (s) => this.preview(s), routeChanged: () => this.placeGate(),
    });
    this.desk.root.visible = false; this.E.scene().add(this.desk.root);
    const TP = win.DWTemplates, ip = TP.list.filter((t: any) => t.ip).slice(0, 8), blank = TP.list.find((t: any) => t.id === 'blank');
    this.board = new WorksBoard(ip.concat(blank ? [blank] : []).map((t: any) => ({ id: t.id, icon: t.icon, name: t.name })));
    this.E.scene().add(this.board.root);
    this.hall = new PassportHall(this.M);
    this.building = new ImagineerBuilding(this.M);
    this.walk = new WalkBuilding(this.M);
    this.refreshBoard();
  }
  // ---------------------------------------------------------------- drawing on the table
  // Take a pencil from the cup on the desk, then draw on the disc: a line is the guest's route (the canal, on a boat
  // ride), a ring is a trigger zone (a dot on a zone rubs it out), and a stroke that starts on a character opens its line.
  tool: Tool | null = null;
  private stroke: { pts: { x: number; z: number }[]; line: THREE.Line } | null = null;
  private static INK: Record<Tool, number> = { route: 0xfbbf24, zone: 0x34d399, talk: 0xf472b6 };
  setTool(t: Tool | null) {
    this.tool = t; this.select(null); this.canvas.style.cursor = t ? 'crosshair' : '';
    this.events.onTool?.(t);
    if (t) this.events.onMessage?.(t === 'route' ? '🟡 在沙盘上画一条线：观众的游览路线' : t === 'zone' ? '🟢 画一个圈：观众走进去，演出就开始' : '🩷 从一个角色身上画出来：给它写台词');
  }
  private strokeStart(e: PointerEvent): boolean {
    const g = this.E.groundAt(e.clientX, e.clientY, 0); if (!g || Math.hypot(g.x, g.z) > TABLE_R + 1) return false;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(600 * 3), 3)); geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: DreamHost.INK[this.tool as Tool], depthTest: false, transparent: true })); line.frustumCulled = false; line.renderOrder = 20;
    this.E.scene().add(line); this.stroke = { pts: [], line }; this.strokeAdd(g);
    return true;
  }
  private strokeAdd(g: { x: number; z: number }) {
    const s = this.stroke; if (!s || s.pts.length >= 600) return;
    const c = this.E.clampToTable(g.x, g.z), last = s.pts[s.pts.length - 1];
    if (last && Math.hypot(c.x - last.x, c.z - last.z) < 0.15) return;
    s.pts.push({ x: c.x, z: c.z });
    const a = s.line.geometry.attributes.position as THREE.BufferAttribute; a.setXYZ(s.pts.length - 1, c.x, 0.14, c.z); a.needsUpdate = true; s.line.geometry.setDrawRange(0, s.pts.length);
  }
  private strokeEnd() {
    const s = this.stroke, tool = this.tool as Tool; if (!s) return; this.stroke = null;
    this.E.scene().remove(s.line); s.line.geometry.dispose();
    const pts = s.pts, w = this.work, uid = win.DWTemplates.uid; let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
    this.setTool(null);
    if (tool === 'talk') {
      const p0 = pts[0]; let best: any = null, bd = 2.6;
      w.objects.forEach((o: any) => { if (!this.M.canLive(o.kind)) return; const d = Math.hypot(o.x - p0.x, o.z - p0.z); if (d < bd) { bd = d; best = o; } });
      if (!best) { this.events.onMessage?.('从一个会说话的角色身上开始画'); return; }
      this.selId = best.id; this.E.select({ type: 'obj', id: best.id });
      this.events.onSelect?.(this.picked(best), this.M.isFigure(best.kind) || best.kind === 'portrait' ? 'voice' : 'tap');
      return;
    }
    this.begin();
    if (tool === 'route') {
      if (len < 3) { this.undoStack.pop(); this.events.onMessage?.('路线再画长一点'); return; }
      const out = [pts[0]]; pts.forEach((p) => { const l = out[out.length - 1]; if (Math.hypot(p.x - l.x, p.z - l.z) >= Math.max(1.8, len / 13)) out.push(p); });
      const end = pts[pts.length - 1], l = out[out.length - 1]; if (Math.hypot(end.x - l.x, end.z - l.z) > 0.6) out.push(end);
      w.route = out.map((p) => ({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }));
      this.events.onMessage?.('🚶 路线画好了 · 小拱门是入口');
    } else {
      w.zones = w.zones || [];
      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cz = pts.reduce((a, p) => a + p.z, 0) / pts.length;
      if (len < 1.5) {   // a dot: on a zone it rubs the zone out, anywhere else it leaves a zone of the usual size
        const hit = w.zones.find((q: any) => Math.hypot(q.x - cx, q.z - cz) <= q.r);
        if (hit) { w.zones = w.zones.filter((q: any) => q !== hit); this.events.onMessage?.('擦掉了「' + (hit.name || '触发区') + '」'); }
        else { w.zones.push({ id: uid('z'), name: '触发区 ' + (w.zones.length + 1), x: +cx.toFixed(2), z: +cz.toFixed(2), r: 3.5, enter: 'play', exit: 'fade' }); this.events.onMessage?.('⚡ 放下一个触发区'); }
      } else {
        const r = Math.max(1.5, Math.min(8, pts.reduce((a, p) => a + Math.hypot(p.x - cx, p.z - cz), 0) / pts.length));
        w.zones.push({ id: uid('z'), name: '触发区 ' + (w.zones.length + 1), x: +cx.toFixed(2), z: +cz.toFixed(2), r: +r.toFixed(1), enter: 'play', exit: 'fade' });
        this.events.onMessage?.('⚡ 圈出一个触发区 · 观众走进去演出就开始');
      }
    }
    this.E.sync(); this.placeGate(); this.save();
  }

  // ---------------------------------------------------------------- the Minest Imagineer Building (the way in)
  private building!: ImagineerBuilding;
  private hallFrom: DreamMode = 'mini';
  // ---------------------------------------------------------------- the rooms (rooms.ts): each department its own place
  roomId: RoomId | null = null;
  private refreshRoom() { /* the departments' things are refreshed by the studio (stations.ts) */ }
  /** the model table is never bare: with no work open, the newest one goes onto it (or a first one is made) */
  ensureWork() {
    if (this.work) return;
    const w = this.works()[0];
    if (w) this.open(w.id); else this.createFrom('ice_kingdom');
    this.events.onChange?.();
  }
  /** to 模型车间, the room with the model table */
  goShop() { this.ensureWork(); this.roomId = null; this.setMode('mini'); this.events.onRoomChange?.(null); this.events.onEnterStudio?.('model-table'); }
  renderRoom(_r: THREE.WebGLRenderer, _dt: number, _aspect: number) { /* no separate rooms any more */ }

  // the building is seen two ways: walked through (walkBuilding.ts, the way in) or as a doll's house (building.ts, the overview)
  private walk!: WalkBuilding;
  buildingView: 'walk' | 'doll' = 'walk';
  setBuildingView(v: 'walk' | 'doll') {
    this.buildingView = v; this.walk.active = v === 'walk' && this.mode === 'building'; this.building.reset(); this.canvas.style.cursor = '';
    this.events.onBuildingView?.(v);
    if (this.mode === 'building') this.events.onMessage?.(v === 'walk' ? '🚪 走进大门，沿着走廊看看每个房间' : '🏢 点一个房间，从那里开始造梦');
  }
  buildingJoy(x: number, y: number) { this.walk.setJoy(x, y); }
  /** into the workshop (the studio): at the doors, or at one of its departments; the Passport Hall is its own room */
  private intoRoom(id: RoomId | 'door') {
    this.walk.active = false; this.canvas.style.cursor = '';
    if (id === 'hall') { this.enterHall(); return; }
    this.ensureWork();
    this.roomId = null; this.setMode('mini'); this.events.onRoomChange?.(null); this.events.onEnterStudio?.(id);
  }

  enterBuilding() {
    if (this.mode !== 'mini' && this.mode !== 'hall' && this.mode !== 'room') return;
    this.walk.reset(null);
    this.walk.active = this.buildingView === 'walk';
    this.roomId = null; this.events.onRoomChange?.(null);
    this.tool = null; this.canvas.style.cursor = ''; this.select(null); this.E.stop();
    this.building.reset(); this.setMode('building'); this.events.onMessage?.(this.buildingView === 'walk' ? '🚪 走进大门，沿着走廊看看每个房间' : '🏢 点一个房间，从那里开始造梦');
  }
  /** arriving already inside (the guest walked in through the building's doors in the park): the lobby */
  enterStudio() { if (this.mode === 'building' || this.mode === 'mini') this.intoRoom('door'); }
  /** the very first arrival: on the plaza in front of the doors */
  arriveAtBuilding() { this.enterBuilding(); this.walk.reset(null); }
  renderBuilding(renderer: THREE.WebGLRenderer, dt: number, aspect: number) {
    if (this.buildingView === 'walk') {
      const into = this.walk.frame(dt, aspect);
      renderer.render(this.walk.scene, this.walk.cam);
      if (into === 'overview') this.setBuildingView('doll'); else if (into === 'inside') this.intoRoom('door'); else if (into) this.intoRoom(into);
      return;
    }
    this.building.frame(dt, aspect); renderer.render(this.building.scene, this.building.cam);
  }
  /** the pointer over the building, when nothing is pressed: the room under it lights up */
  hoverBuilding(e: PointerEvent) { if (this.mode === 'building' && this.buildingView === 'doll') this.canvas.style.cursor = this.building.point(e, this.canvas.getBoundingClientRect()) ? 'pointer' : ''; }

  private board!: WorksBoard;
  private hall!: PassportHall;

  // ---------------------------------------------------------------- the works (the blueprint board shows them)
  works(): any[] {
    const S = this.store(); let list: any[] = [];
    try {
      if (S) list = S.keys(PFX).map((k: string) => S.get(k));
      else for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ''; if (k.indexOf(PFX) === 0) list.push(JSON.parse(localStorage.getItem(k) || 'null')); }
    } catch (e) { /* ignore */ }
    return list.filter((w) => w && w.id && !w.deleted).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }
  refreshBoard() { this.board.show(this.works(), this.work ? this.work.id : null); }
  /** a new work from one of 梦工坊's theme worlds, straight onto the table */
  private createFrom(tid: string) {
    const t = win.DWTemplates.list.find((x: any) => x.id === tid); if (!t) return;
    const w = t.make(); w.id = win.DWTemplates.uid('w'); w.created = w.updated = Date.now(); w.shelf = true;
    const S = this.store(); try { if (S) S.set(PFX + w.id, w); else localStorage.setItem(PFX + w.id, JSON.stringify(w)); } catch (e) { /* ignore */ }
    this.open(w.id); this.events.onMessage?.('✨ 新的梦：' + (w.title || t.name)); this.events.onChange?.();
  }

  // ---------------------------------------------------------------- undo, and the thing in the hand
  private undoStack: string[] = [];
  /** call before a change; settle() after it drops the step again if nothing changed */
  begin() { if (!this.work) return; this.undoStack.push(JSON.stringify(this.work)); if (this.undoStack.length > 60) this.undoStack.shift(); }
  private settle() { const u = this.undoStack; if (u.length && this.work && u[u.length - 1] === JSON.stringify(this.work)) u.pop(); }
  get canUndo() { return this.undoStack.length > 0; }
  undo() {
    if (this.mode !== 'mini' || !this.undoStack.length) { if (this.mode === 'mini') this.events.onMessage?.('没有可以撤销的了'); return; }
    const selId = this.selId;
    this.work = JSON.parse(this.undoStack.pop() as string);
    this.E.setWork(this.work); this.placeGate(); this.desk.sync();
    this.select(this.work.objects.find((o: any) => o.id === selId) || null);
    this.save(); this.events.onMessage?.('↶ 回到上一步');
  }
  private selId: string | null = null;
  private select(o: any | null) {
    this.selId = o ? o.id : null;
    this.E.select(o ? { type: 'obj', id: o.id } : null);
    this.events.onSelect?.(o ? this.picked(o) : null);
  }
  private picked(o: any): Picked {
    const K = this.M.KINDS[o.kind] || {}, alive = this.M.canLive(o.kind), talks = this.M.isFigure(o.kind) || o.kind === 'portrait';
    return {
      id: o.id, kind: o.kind, icon: K.icon || '✨', name: o.name || K.name || '',
      voice: alive && talks ? ((o.life && o.life.voice && o.life.voice.text) || '') : null,
      tap: alive ? ((o.life && o.life.tap && o.life.tap.text) || '') : null,
      text: K.text != null ? (o.text || '') : null, fact: o.fact || '',
      builtin: K.fact ? { where: K.fact.where, text: K.fact.text } : null, color: K.color ? (o.color || K.color) : null,
    };
  }
  private selected(): any | null { return this.work && this.selId ? this.work.objects.find((o: any) => o.id === this.selId) || null : null; }
  /** the note card's fields: name, voice (what it says as the guest comes near), tap (its answer), text, fact, color */
  setField(field: 'name' | 'voice' | 'tap' | 'text' | 'fact' | 'color', v: string) {
    const o = this.selected(); if (!o) return;
    if (field === 'voice' || field === 'tap') {
      o.life = o.life || { on: true, voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1.08 }, lookAtGuest: true, lipSync: true, idle: true, tap: { text: '', op: this.M.actions(o.kind)[0] || 'openArms' } };
      o.life.on = true;
      if (field === 'tap') { o.life.tap = o.life.tap || {}; o.life.tap.text = v; }
      else {   // the same bookkeeping 梦工坊 does: its line on the voice track is as long as the line takes to say
        o.life.voice = o.life.voice || { lang: 'zh-CN', rate: 1, pitch: 1.08 }; o.life.voice.text = v;
        const tl = this.work.timeline, dur = this.E.sayTime(o.life.voice), vc = tl.clips.find((c: any) => c.track === 'voice' && c.target === o.id);
        if (v.trim()) { if (vc) { delete vc.text; vc.t1 = +(vc.t0 + dur).toFixed(1); } else tl.clips.push({ id: win.DWTemplates.uid('c'), track: 'voice', op: 'speak', t0: 1, t1: +(1 + dur).toFixed(1), target: o.id }); }
        if (dur + 2 > tl.len) tl.len = Math.ceil(dur + 3);
      }
    } else if (field === 'fact') { if (v.trim()) o.fact = v.slice(0, 300); else delete o.fact; }
    else o[field] = v;
    this.E.sync(); this.save();
  }
  /** the note card's hands: turn, grow, shrink, put away, hear its line */
  act(what: 'left' | 'right' | 'bigger' | 'smaller' | 'remove' | 'listen') {
    const o = this.selected(); if (!o) return;
    if (what === 'listen') { const t = (o.life && o.life.voice && o.life.voice.text) || (o.life && o.life.tap && o.life.tap.text) || ''; this.E.unlock(); if (t) this.E.speak(t.slice(0, 240), o.life.voice || {}); return; }
    this.begin();
    if (what === 'left' || what === 'right') o.ry = (o.ry || 0) + (what === 'left' ? 1 : -1) * Math.PI / 8;
    else if (what === 'bigger' || what === 'smaller') { o.s = Math.max(0.4, Math.min(2.8, +((o.s || 1) * (what === 'bigger' ? 1.15 : 0.87)).toFixed(2))); if (o.kind !== 'portrait') o.y = this.E.surfaceY(o.x, o.z, o.id); }
    else { this.work.objects = this.work.objects.filter((q: any) => q.id !== o.id); this.work.timeline.clips = this.work.timeline.clips.filter((c: any) => c.target !== o.id); this.select(null); this.events.onMessage?.('「' + (o.name || '') + '」收起来了'); }
    this.E.sync(); this.save();
  }

  // ---------------------------------------------------------------- the departments' own work (components/DeptPanel.tsx)
  /** Walt's Office: one sentence becomes a new world (Minest's AI Imagineer when signed in, else a local draft) */
  async dreamFromIdea(idea: string): Promise<boolean> {
    const I = win.DWImagineer; if (!I || !I.createFromIdea) return false;
    const res = await I.createFromIdea(idea, [], 0), w = res && res.work; if (!w || !w.objects) return false;
    w.id = win.DWTemplates.uid('w'); w.created = w.updated = Date.now(); w.shelf = true;
    const S = this.store(); try { if (S) S.set(PFX + w.id, w); else localStorage.setItem(PFX + w.id, JSON.stringify(w)); } catch (e) { /* ignore */ }
    if (!this.open(w.id)) return false;
    this.work.objects.forEach((o: any) => { if (o.kind !== 'portrait') o.y = this.E.surfaceY(o.x, o.z, o.id); });
    this.E.sync(); this.save(true); this.events.onMessage?.('✨ 新的梦：' + (w.title || '')); this.events.onChange?.();
    return true;
  }
  /** Story Dept.: the show's lines in the order they are said */
  beats(): { id: string; icon: string; name: string; text: string; t0: number }[] {
    if (!this.work) return [];
    return this.work.timeline.clips.filter((c: any) => c.track === 'voice').sort((a: any, b: any) => a.t0 - b.t0).map((c: any) => {
      const o = this.work.objects.find((q: any) => q.id === c.target) || {}, K = this.M.KINDS[o.kind] || {};
      return { id: c.id, icon: K.icon || '🗣', name: o.name || K.name || '', text: c.text || (o.life && o.life.voice && o.life.voice.text) || '', t0: c.t0 };
    });
  }
  /** the lines one after another in this order; what a speaker does during its line moves with the line */
  private pack(ids: string[]) {
    const tl = this.work.timeline; let t = 1;
    ids.forEach((id) => {
      const c = tl.clips.find((q: any) => q.id === id); if (!c) return;
      const o = this.work.objects.find((q: any) => q.id === c.target), v = (o && o.life && o.life.voice) || {};
      const dur = this.E.sayTime({ text: c.text || v.text || '', rate: v.rate }), d = t - c.t0;
      tl.clips.forEach((a: any) => { if (a.track === 'action' && a.target === c.target && a.t0 >= c.t0 - 0.6 && a.t0 <= c.t1 && a.op !== 'spin') { a.t0 = +(a.t0 + d).toFixed(1); a.t1 = +(a.t1 + d).toFixed(1); } });
      c.t0 = +t.toFixed(1); c.t1 = +(t + dur).toFixed(1); t = c.t1 + 0.6;
    });
    if (t + 1 > tl.len) tl.len = Math.ceil(t + 2);
  }
  reorderBeats(ids: string[]) { if (!this.work) return; this.begin(); this.pack(ids); this.settle(); this.save(); }
  setBeatText(id: string, text: string) {
    const c = this.work && this.work.timeline.clips.find((q: any) => q.id === id); if (!c) return;
    c.text = text.slice(0, 600); this.pack(this.beats().map((b) => b.id)); this.save();
  }
  /** Audio-Animatronics: who can act, and what each does in the show */
  cast(): { id: string; icon: string; name: string; acts: { op: string; on: boolean }[] }[] {
    if (!this.work) return [];
    return this.work.objects.filter((o: any) => this.M.isFigure(o.kind) || o.kind === 'portrait').map((o: any) => {
      const K = this.M.KINDS[o.kind] || {};
      return { id: o.id, icon: K.icon || '🧍', name: o.name || K.name, acts: (this.M.actions(o.kind) as string[]).map((op) => ({ op, on: this.work.timeline.clips.some((c: any) => c.track === 'action' && c.target === o.id && c.op === op) })) };
    });
  }
  toggleAction(objId: string, op: string) {
    const tl = this.work.timeline, o = this.work.objects.find((q: any) => q.id === objId); if (!o) return;
    this.begin();
    const had = tl.clips.some((c: any) => c.track === 'action' && c.target === objId && c.op === op);
    if (had) tl.clips = tl.clips.filter((c: any) => !(c.track === 'action' && c.target === objId && c.op === op));
    else {   // during its line if it has one, after what it already does
      const v = tl.clips.find((c: any) => c.track === 'voice' && c.target === objId), mine = tl.clips.filter((c: any) => c.track === 'action' && c.target === objId);
      const t0 = Math.max(v ? v.t0 : 1, mine.reduce((m: number, c: any) => Math.max(m, c.t1), 0)), dur = op === 'stroll' ? 10 : op === 'turnHead' ? 6 : op === 'wink' ? 1.5 : 3.5;
      tl.clips.push({ id: win.DWTemplates.uid('c'), track: 'action', op, t0: +t0.toFixed(1), t1: +(t0 + dur).toFixed(1), target: objId });
      if (t0 + dur + 1 > tl.len) tl.len = Math.ceil(t0 + dur + 2);
      o.life = o.life || { voice: { text: '', lang: 'zh-CN', rate: 1, pitch: 1.08 }, lookAtGuest: true, lipSync: true, idle: true }; o.life.on = true;
    }
    this.save();
  }
  /** Machine Shop: the boat's speed, and which rides run through the whole show */
  rides(): { boat: boolean; speed: number; things: { id: string; icon: string; name: string; on: boolean }[] } {
    const w = this.work; if (!w) return { boat: false, speed: 1.35, things: [] };
    return {
      boat: !!(w.ride && w.ride.mode === 'boat'), speed: (w.ride && w.ride.speed) || 1.35,
      things: w.objects.filter((o: any) => this.M.isProp(o.kind) && (this.M.actions(o.kind) as string[]).indexOf('spin') >= 0).map((o: any) => {
        const K = this.M.KINDS[o.kind] || {};
        return { id: o.id, icon: K.icon || '⚙️', name: o.name || K.name, on: w.timeline.clips.some((c: any) => c.track === 'action' && c.target === o.id && c.op === 'spin') };
      }),
    };
  }
  setBoatSpeed(v: number) { const w = this.work; if (!w) return; w.ride = w.ride || { mode: 'walk', speed: 1.35 }; w.ride.speed = Math.max(0.5, Math.min(3, +v.toFixed(2))); this.save(); }
  toggleSpin(objId: string) {
    const tl = this.work.timeline, o = this.work.objects.find((q: any) => q.id === objId); if (!o) return;
    this.begin();
    const had = tl.clips.some((c: any) => c.track === 'action' && c.target === objId && c.op === 'spin');
    tl.clips = tl.clips.filter((c: any) => !(c.track === 'action' && c.target === objId && c.op === 'spin'));
    if (!had) { tl.clips.push({ id: win.DWTemplates.uid('c'), track: 'action', op: 'spin', t0: 0, t1: tl.len, target: objId }); o.life = o.life || {}; o.life.on = true; }
    this.save();
  }

  // ---------------------------------------------------------------- the Passport Hall (the second room)
  private passport() { return lget<Record<string, number>>('dw.passport', {}); }
  private tellPassport() { const KINDS = this.M.KINDS, all = Object.keys(KINDS).filter((k) => KINDS[k].fact), p = this.passport(); this.events.onPassport?.(all.filter((k) => p[k]).length, all.length, lget<number>('dw.stars', 0)); }
  enterHall() { if (this.mode !== 'mini' && this.mode !== 'building') return; this.hallFrom = this.mode; this.select(null); this.hall.refresh(this.passport()); this.tellPassport(); this.setMode('hall'); this.events.onMessage?.('📔 护照馆 · 拖动转身，点一点展台'); }
  leaveHall() { if (this.mode !== 'hall') return; if (this.hallFrom === 'building') this.enterBuilding(); else this.setMode('mini'); }
  renderHall(renderer: THREE.WebGLRenderer, aspect: number) { this.hall.frame(aspect); renderer.render(this.hall.scene, this.hall.cam); }
  /** five questions about what is already in the passport (梦工坊's quiz) */
  quiz(): { kind: string; icon: string; name: string; ask: string; options: string[]; right: string; text: string }[] {
    const KINDS = this.M.KINDS, p = this.passport();
    return Object.keys(KINDS).filter((k) => p[k] && KINDS[k].fact && KINDS[k].fact.q).sort(() => Math.random() - 0.5).slice(0, 5).map((k) => {
      const f = KINDS[k].fact; return { kind: k, icon: KINDS[k].icon, name: KINDS[k].name, ask: f.q[0], options: f.q[1].slice().sort(() => Math.random() - 0.5), right: f.q[1][f.q[2]], text: f.text };
    });
  }
  addStars(n: number) { lset('dw.stars', lget<number>('dw.stars', 0) + n); this.tellPassport(); if (n >= 5) { this.E.unlock(); } }
  private desk!: ControlDesk;
  private deskTook = false;
  private deskUndo = false;
  private previewT = 0;
  /** play the show on the miniature for a few seconds, so a change (snow, a tune) is seen and heard at once */
  preview(sec: number) {
    if (this.mode !== 'mini' || !this.work) return;
    this.E.unlock(); this.E.stop(); this.E.play();
    window.clearTimeout(this.previewT);
    this.previewT = window.setTimeout(() => { if (this.mode === 'mini') this.E.stop(); }, sec * 1000);
  }
  private rayAt(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), this.miniCam);
    return this.ray;
  }

  // ---------------------------------------------------------------- the toy racks: the model library, as things to pick up
  // Two stepped stands on the table, left and right of the disc, with one miniature of every kind (grouped by family).
  // Press one and carry it onto the disc: that is how a thing is added. No list, no button.
  private racks = new THREE.Group();
  private minis: THREE.Object3D[] = [];
  private ray = new THREE.Raycaster();
  private buildRacks() {
    const KINDS = this.M.KINDS as Record<string, any>;
    const order = ['character', 'people', 'animal', 'landmark', 'castle', 'ride', 'vehicle', 'magic', 'nature'];
    const kinds = Object.keys(KINDS).sort((a, b) => order.indexOf(KINDS[a].kidCat) - order.indexOf(KINDS[b].kidCat));
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a35, roughness: 0.8 }), edge = new THREE.MeshStandardMaterial({ color: 0xd9b25a, roughness: 0.4, metalness: 0.4 });
    const TIERS = 4, PER = 10, CELL = 2.4, Z0 = -13;
    [-1, 1].forEach((side) => {
      for (let t = 0; t < TIERS; t++) {
        const x = side * (17.3 + t * 1.5), h = 0.2 + t * 0.9;
        const step = new THREE.Mesh(new THREE.BoxGeometry(1.5, h, PER * CELL + 0.4), wood); step.position.set(x, h / 2, Z0 + (PER - 1) * CELL / 2); this.racks.add(step);
        const lip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, PER * CELL + 0.4), edge); lip.position.set(x - side * 0.72, h + 0.05, Z0 + (PER - 1) * CELL / 2); this.racks.add(lip);
      }
    });
    const hitGeo = new THREE.BoxGeometry(1.4, 1.6, 2.2), hitMat = new THREE.MeshBasicMaterial({ visible: false });
    const box = new THREE.Box3(), size = new THREE.Vector3(), mid = new THREE.Vector3();
    kinds.forEach((kind, n) => {
      const K = KINDS[kind], side = n < TIERS * PER ? -1 : 1, m = n % (TIERS * PER), t = m % TIERS, i = Math.floor(m / TIERS);
      let g: THREE.Object3D;
      try { g = this.M.build({ kind, color: K.color, text: K.text }); } catch (e) { return; }
      g.traverse((o: any) => { if (o.isLight) o.visible = false; });
      box.setFromObject(g); box.getSize(size); box.getCenter(mid);
      const k = Math.min(1.9 / Math.max(size.x, size.z, 0.01), 2.3 / Math.max(size.y, 0.01), 1.6);
      g.scale.setScalar(k); g.position.set(-mid.x * k, -box.min.y * k, -mid.z * k);
      const holder = new THREE.Group(); holder.add(g);
      const grip = new THREE.Mesh(hitGeo, hitMat); grip.position.y = 0.8; holder.add(grip);   // easy to catch with a finger
      holder.position.set(side * (17.3 + t * 1.5), 0.2 + t * 0.9, Z0 + i * CELL); holder.rotation.y = -side * Math.PI / 2;
      holder.userData.kind = kind;
      this.racks.add(holder); this.minis.push(holder);
    });
    this.racks.visible = false; this.E.scene().add(this.racks);
  }
  private rackKind(e: PointerEvent): string | null {
    const hit = this.rayAt(e).intersectObjects(this.minis, true)[0]; if (!hit) return null;
    let o: THREE.Object3D | null = hit.object; while (o && !o.userData.kind) o = o.parent;
    return o ? (o.userData.kind as string) : null;
  }
  /** a new thing of this kind, the way 梦工坊's shelf makes one: alive, with its own line, and a first show if there is none */
  private make(kind: string, x: number, z: number): any {
    const K = this.M.KINDS[kind], w = this.work, uid = win.DWTemplates.uid;
    const o: any = { id: uid(), kind, name: K.name, x: +x.toFixed(2), y: 0, z: +z.toFixed(2), ry: 0, s: 1 };
    if (K.color) o.color = K.color; if (K.text) o.text = K.text;
    if (this.M.canLive(kind)) {
      const isChar = this.M.isFigure(kind) || kind === 'portrait', act = this.M.actions(kind)[0] || 'openArms';
      o.life = {
        on: true, voice: { text: isChar ? '嗨！欢迎来到我的世界，我是' + K.name + '！' : '', lang: 'zh-CN', rate: 1, pitch: kind === 'dino' ? 0.9 : 1.08 },
        lookAtGuest: true, lipSync: true, idle: true,
        tap: { text: K.say ? K.say : isChar ? '你好呀小梦想家！我是' + K.name + '，祝你玩得开心！' : '', op: act },
      };
      if (isChar && !w.timeline.clips.some((c: any) => c.track === 'voice')) {
        w.timeline.clips.push({ id: uid('c'), track: 'voice', op: 'speak', t0: 1, t1: +(1 + this.E.sayTime(o.life.voice)).toFixed(1), target: o.id });
        w.timeline.clips.push({ id: uid('c'), track: 'action', op: act, t0: 1, t1: 4.5, target: o.id });
      } else if (kind === 'carousel' || kind === 'ferris' || kind === 'gears') {
        w.timeline.clips.push({ id: uid('c'), track: 'action', op: 'spin', t0: 0, t1: w.timeline.len, target: o.id });
      }
    }
    if (!w.zones || !w.zones.length) w.zones = [{ id: uid('z'), name: '欢迎区', x: 0, z: 2, r: 5.0, enter: 'play', exit: 'none' }];
    if (!w.route || w.route.length < 2) w.route = [{ x: 0, z: 9.2 }, { x: 0, z: 2.0 }];
    return o;
  }

  // ---------------------------------------------------------------- the work on the table
  private store(): any { return win.MinestHomeStore || null; }
  read(id: string): any {
    const S = this.store();
    try { return S ? S.get(PFX + id) : JSON.parse(localStorage.getItem(PFX + id) || 'null'); } catch (e) { return null; }
  }
  open(id: string): boolean {
    const w = this.read(id); if (!w || !w.objects) return false;
    this.work = JSON.parse(JSON.stringify(w));
    this.work.timeline = this.work.timeline || { len: 30, clips: [] };
    this.work.env = this.work.env || { mood: 'day' };
    this.E.setWork(this.work); this.placeGate(); this.desk.sync();
    this.undoStack = []; this.select(null); this.refreshBoard();
    return true;
  }
  close() { if (this.mode !== 'mini') this.leave(null); this.work = null; this.undoStack = []; this.select(null); this.gate.visible = false; this.E.setWork(null); this.refreshBoard(); }
  get active() { return !!this.work; }
  save(now = false) {
    if (!this.work) return;
    this.work.updated = Date.now();
    window.clearTimeout(this.saveT);
    const put = () => { const S = this.store(); try { if (S) S.set(PFX + this.work.id, this.work); else localStorage.setItem(PFX + this.work.id, JSON.stringify(this.work)); } catch (e) { /* ignore */ } };
    if (now) put(); else this.saveT = window.setTimeout(put, 400);
    window.clearTimeout(this.boardT); this.boardT = window.setTimeout(() => { this.refreshBoard(); this.refreshRoom(); }, 700);
    this.events.onChange?.();
  }
  private start() { const r = (this.work && this.work.route) || []; return { p0: r[0] || { x: 0, z: 10 }, p1: r[1] || { x: 0, z: 0 } }; }
  private placeGate() {
    if (!this.work) { this.gate.visible = false; return; }
    const { p0, p1 } = this.start();
    this.gate.position.set(p0.x, 0, p0.z); this.gate.rotation.y = Math.atan2(p1.x - p0.x, p1.z - p0.z); this.gate.visible = this.mode === 'mini';
  }

  // ---------------------------------------------------------------- each frame
  /** returns true while the dream owns the studio camera (diving in, inside, or coming back) */
  frame(dt: number, cam: THREE.PerspectiveCamera): boolean {
    if (this.fly) {
      const f = this.fly; f.t = Math.min(1, f.t + dt / f.dur);
      const k = f.t < 0.5 ? 4 * f.t * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 3) / 2;
      cam.position.lerpVectors(f.p0, f.p1, k); cam.quaternion.slerpQuaternions(f.q0, f.q1, k);
      if (f.t >= 1) { this.fly = null; if (this.mode === 'diving') this.arrive(); else this.setMode('mini'); }
    }
    if (this.mode === 'hall' || this.mode === 'building' || this.mode === 'room') return true;
    if (this.mode !== 'guest') {
      cam.updateMatrixWorld();
      this.miniCam.copy(cam, false);
      // the camera, moved into the table's space. three ignores a camera's scale, so the table's scale goes into the
      // projection instead — the depth then matches the studio's, and the room hides the miniature where it should
      this.m4.multiplyMatrices(this.inv, cam.matrixWorld).decompose(this.miniCam.position, this.miniCam.quaternion, this.miniCam.scale);
      this.miniCam.scale.set(1, 1, 1);
      this.miniCam.projectionMatrix.multiply(this.m4.makeScale(TABLE_SCALE, TABLE_SCALE, TABLE_SCALE));
      this.miniCam.projectionMatrixInverse.copy(this.miniCam.projectionMatrix).invert();
      this.miniCam.updateMatrixWorld(true);
      this.gate.visible = !!this.work && this.mode === 'mini';
      this.racks.visible = this.desk.root.visible = this.gate.visible;
      this.board.root.visible = true;
      this.desk.frame(dt);
      if (this.gate.visible) this.gate.children[3].scale.setScalar(1 + 0.12 * Math.sin(performance.now() / 300));
    }
    this.E.frame(dt);
    return this.mode !== 'mini';
  }
  /** after the studio is drawn: the miniature, through the camera moved into the table's space */
  renderMini(renderer: THREE.WebGLRenderer) {
    if (this.mode === 'guest' || this.mode === 'hall' || this.mode === 'building' || this.mode === 'room') return;
    const ac = renderer.autoClear; renderer.autoClear = false;
    renderer.render(this.E.scene(), this.miniCam);
    renderer.autoClear = ac;
  }
  renderGuest(renderer: THREE.WebGLRenderer, aspect: number) {
    const c = this.E.camera(); if (c.aspect !== aspect) { c.aspect = aspect; c.updateProjectionMatrix(); }
    renderer.render(this.E.scene(), c);
  }
  private setMode(m: DreamMode) { this.mode = m; this.placeGate(); this.events.onMode?.(m); }

  // ---------------------------------------------------------------- shrinking in and coming back
  private guestPose() {
    const { p0, p1 } = this.start(), riding = !!(this.work.ride && this.work.ride.mode === 'boat');
    const yaw = Math.atan2(p1.x - p0.x, p1.z - p0.z), eye = riding ? 1.25 : 1.62 + this.E.surfaceY(p0.x, p0.z);
    const pos = new THREE.Vector3(p0.x, eye, p0.z).multiplyScalar(TABLE_SCALE).add(TABLE_POS);
    const o = new THREE.Object3D(); o.position.copy(pos);
    o.lookAt(pos.x - Math.sin(yaw), pos.y + 0.05, pos.z - Math.cos(yaw));   // a camera looks down its −z
    return { pos, quat: o.quaternion.clone() };
  }
  dive(cam: THREE.PerspectiveCamera) {
    if (!this.work || this.mode !== 'mini') return;
    this.E.unlock(); this.select(null);
    const g = this.guestPose();
    this.fly = { t: 0, dur: 2.2, p0: cam.position.clone(), q0: cam.quaternion.clone(), p1: g.pos, q1: g.quat };
    this.back = { p: cam.position.clone(), q: cam.quaternion.clone() };
    this.setMode('diving');
  }
  private back: { p: THREE.Vector3; q: THREE.Quaternion } | null = null;
  private arrive() {
    this.racks.visible = this.desk.root.visible = this.board.root.visible = false;
    this.tool = null; this.canvas.style.cursor = '';
    window.clearTimeout(this.previewT);
    this.E.enterGuest();
    if (!this.work.previewed) { this.work.previewed = true; this.save(); }
    this.setMode('guest');
    this.events.onRide?.(this.E.riding(), false);
  }
  /** leave the world: the camera rises from where the guest stood back to where it was over the table */
  leave(cam: THREE.PerspectiveCamera | null) {
    if (this.mode === 'guest') {
      const gc = this.E.camera(); let p1: THREE.Vector3 | null = null, q1: THREE.Quaternion | null = null;
      if (cam) { p1 = gc.position.clone().multiplyScalar(TABLE_SCALE).add(TABLE_POS); q1 = gc.quaternion.clone(); }
      this.E.hush(); this.E.exitGuest();
      if (cam && p1 && q1 && this.back) {
        cam.position.copy(p1); cam.quaternion.copy(q1);
        this.fly = { t: 0, dur: 1.6, p0: p1, q0: q1, p1: this.back.p, q1: this.back.q };
        this.setMode('rising'); return;
      }
    }
    this.fly = null; this.setMode('mini');
  }
  autoGo() { this.E.unlock(); this.E.guestAuto(true); this.events.onRide?.(this.E.riding(), false); }
  fireworks() { this.E.unlock(); this.E.launchFireworks(6.5); }
  joy(x: number, y: number) { this.E.guestJoy(x, y); }

  // ---------------------------------------------------------------- hands on the table (and inside the world)
  /** pointer down on the canvas; true = the dream took it (the studio's orbit must not) */
  pointerDown(e: PointerEvent): boolean {
    if (this.mode === 'hall' || this.mode === 'building' || this.mode === 'room') { this.look = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }; return true; }
    if (this.mode === 'mini') { const b = this.board.pick(this.rayAt(e)); if (b) { this.boardHit = { hit: b, x: e.clientX, y: e.clientY }; return true; } }
    if (!this.work) return false;
    if (this.mode === 'guest') { this.look = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }; return true; }
    if (this.mode !== 'mini') return true;
    if (this.desk.pointerDown(e)) { this.begin(); this.deskTook = true; return true; }
    if (this.tool) { if (!this.strokeStart(e)) this.setTool(null); return true; }
    const kind = this.rackKind(e);
    if (kind) {   // picked up from the rack: a new one comes away in the hand
      const g0 = this.E.groundAt(e.clientX, e.clientY, 0) || { x: 0, z: 0 }, K = this.M.KINDS[kind];
      this.begin();
      const o = this.make(kind, g0.x, g0.z);
      this.work.objects.push(o); this.E.sync();
      this.drag = { o, ox: 0, oz: 0, x: e.clientX, y: e.clientY, moved: true, fresh: true };
      this.events.onMessage?.((K.icon || '✨') + ' ' + K.name + (K.fact ? ' · ' + K.fact.where : ''));
      return true;
    }
    const h = this.E.pick(e.clientX, e.clientY);
    if (h && h.type === 'obj') {
      const o = this.work.objects.find((q: any) => q.id === h.id); if (!o) return false;
      const g = this.E.groundAt(e.clientX, e.clientY, o.y || 0);
      this.begin();
      this.drag = { o, ox: g ? o.x - g.x : 0, oz: g ? o.z - g.z : 0, x: e.clientX, y: e.clientY, moved: false };
      this.select(o);
      return true;
    }
    if (h && h.type === 'ground') {
      const { p0 } = this.start();
      if (Math.hypot(h.point.x - p0.x, h.point.z - p0.z) < 1.6) { this.pendingGate = { x: e.clientX, y: e.clientY }; return true; }
    }
    this.select(null);
    return false;
  }
  private boardHit: { hit: { type: string; id: string }; x: number; y: number } | null = null;
  private pendingGate: { x: number; y: number } | null = null;
  pointerMove(e: PointerEvent) {
    if (this.look) {
      const l = this.look; if (Math.hypot(e.clientX - l.x, e.clientY - l.y) > 6) l.moved = true;
      if (this.mode === 'building' && this.buildingView === 'walk') this.walk.look(e.clientX - l.lx, e.clientY - l.ly);
      else if (this.mode === 'building') this.building.drag(e.clientX - l.lx);
      else if (this.mode === 'hall') this.hall.look(e.clientX - l.lx, e.clientY - l.ly); else this.E.guestLook(e.clientX - l.lx, e.clientY - l.ly); l.lx = e.clientX; l.ly = e.clientY; return;
    }
    if (this.deskTook) { this.desk.pointerMove(e); return; }
    if (this.stroke) { const g = this.E.groundAt(e.clientX, e.clientY, 0); if (g) this.strokeAdd(g); return; }
    const d = this.drag; if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) return;
    d.moved = true;
    const g = this.E.groundAt(e.clientX, e.clientY, d.o.y || 0); if (!g) return;
    d.o.x = +(g.x + d.ox).toFixed(2); d.o.z = +(g.z + d.oz).toFixed(2);
    if (d.o.kind !== 'portrait') d.o.y = Math.hypot(d.o.x, d.o.z) > TABLE_R ? 0 : this.E.surfaceY(d.o.x, d.o.z, d.o.id);
    this.E.sync();
  }
  /** pointer up; `cam` is the studio camera (a tap on the gate dives in) */
  pointerUp(e: PointerEvent, cam: THREE.PerspectiveCamera) {
    if (this.look) {
      const l = this.look; this.look = null;
      if (l.moved) return;
      if (this.mode === 'building' && this.buildingView === 'walk') {
        const w = this.walk.tap(e, this.canvas.getBoundingClientRect());
        if (w) { this.E.unlock(); this.events.onMessage?.(w.icon + ' ' + w.name); }
        return;
      }
      if (this.mode === 'building') {
        const r = this.building.enter(e, this.canvas.getBoundingClientRect(), (id) => this.intoRoom(id));
        if (r) { this.E.unlock(); this.events.onMessage?.(r.icon + ' ' + r.name); }
        return;
      }
      if (this.mode !== 'hall') { this.tap(e.clientX, e.clientY); return; }
      const kind = this.hall.pick(e, this.canvas.getBoundingClientRect()); if (!kind) return;
      const K = this.M.KINDS[kind], p = this.passport(), all = Object.keys(this.M.KINDS).filter((k) => this.M.KINDS[k].fact);
      if (!p[kind]) { this.events.onMessage?.(K.icon + ' ' + K.name + ' · 还没找到，去世界里点一点它'); return; }
      this.E.unlock(); this.E.speak(K.fact.text, { lang: 'zh-CN', rate: 1, pitch: 1.05 });
      this.events.onCard?.({ key: kind, icon: K.icon, title: K.name, where: K.fact.where, text: K.fact.text, isNew: false, found: all.filter((k) => p[k]).length, total: all.length });
      return;
    }
    if (this.boardHit) {
      const b = this.boardHit; this.boardHit = null;
      if (Math.hypot(e.clientX - b.x, e.clientY - b.y) > 8) return;
      const h = b.hit;
      if (h.type === 'work') { if (!this.work || this.work.id !== h.id) { this.save(true); this.open(h.id); this.events.onChange?.(); } }
      else if (h.type === 'tpl') this.createFrom(h.id);
      else if (h.id === 'hall') this.enterHall();
      else if (this.work) { this.save(true); this.events.onAct?.(h.id as 'park' | 'editor', this.work.id); }
      else this.events.onMessage?.('先从蓝图板上选一件作品');
      return;
    }
    if (this.deskTook) {
      this.deskTook = false; this.desk.pointerUp(); this.settle();
      if (this.deskUndo) { this.deskUndo = false; this.undo(); }   // the rewind key: after this press's own step is dropped
      return;
    }
    if (this.stroke) { this.strokeEnd(); return; }
    if (this.pendingGate) { const p = this.pendingGate; this.pendingGate = null; if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6) this.dive(cam); return; }
    const d = this.drag; if (!d) return; this.drag = null;
    if (!d.moved) { this.settle(); return; }
    if (Math.hypot(d.o.x, d.o.z) > TABLE_R + 0.6) {   // carried off the table: it is put away
      this.work.objects = this.work.objects.filter((q: any) => q.id !== d.o.id);
      this.work.timeline.clips = this.work.timeline.clips.filter((c: any) => c.target !== d.o.id);
      this.select(null); this.E.sync(); if (!d.fresh) this.events.onMessage?.('「' + (d.o.name || '') + '」收起来了');
      if (d.fresh) { this.settle(); return; }   // put back before it ever reached the table: nothing to save
    } else {
      const c = this.E.clampToTable(d.o.x, d.o.z); d.o.x = +c.x.toFixed(2); d.o.z = +c.z.toFixed(2);
      if (d.o.kind !== 'portrait') d.o.y = this.E.surfaceY(d.o.x, d.o.z, d.o.id);
      this.select(d.o); this.E.sync();
      if (d.fresh) this.events.onMessage?.('放好了「' + d.o.name + '」');
    }
    this.save();
  }
  get dragging() { return !!this.drag; }

  // ---------------------------------------------------------------- knowledge cards (the same passport 梦工坊 keeps)
  private cardOf(o: any) {
    const K = (this.M.KINDS[o.kind] || {}) as any;
    if (o.fact && String(o.fact).trim()) return { key: 'o:' + o.id, icon: K.icon || '✨', title: o.name || K.name, where: '小 Imagineer 写的知识卡', text: String(o.fact).trim().slice(0, 300) };
    if (K.fact) return { key: o.kind, icon: K.icon, title: K.name, where: K.fact.where, text: K.fact.text };
    return null;
  }
  private tap(x: number, y: number) {
    const h = this.E.pick(x, y), r = this.E.guestTap(x, y);
    if (!r) return;
    this.events.onMessage?.(r.ok ? '✨ ' + r.name + (r.text ? '：“' + r.text + '”' : '') : r.far ? '再走近一点，就能和「' + r.name + '」说话' : r.name);
    if (r.far || !h || h.type !== 'obj') return;
    const o = this.work.objects.find((q: any) => q.id === h.id), c = o && this.cardOf(o);
    if (!c) return;
    const pass = lget<Record<string, number>>('dw.passport', {}), isNew = !pass[c.key];
    if (isNew) { pass[c.key] = Date.now(); lset('dw.passport', pass); }
    const keys = new Set<string>(); this.work.objects.forEach((q: any) => { const cc = this.cardOf(q); if (cc) keys.add(cc.key); });
    if (!r.text) this.E.speak(c.text, { lang: 'zh-CN', rate: 1, pitch: 1.05 });
    this.events.onCard?.({ ...c, isNew, total: keys.size, found: [...keys].filter((k) => pass[k]).length });
  }
}
