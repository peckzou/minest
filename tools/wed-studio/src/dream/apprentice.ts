// Minest · 造梦基地 — the Imagineer's apprenticeship: six things done with one's own hands in the building, one after
// another, each shown by a beam of light where it is done and a small card that says what:
//   1 say a dream to the bulb in the Show Designers' studio → 2 set three models on the model table → 3 draw the
//   guests' route with the yellow pencil → 4 give a character something to do, at MAPO → 5 shrink and walk into the
//   work → 6 the badge. Kept on this device ('dw.apprentice'); the park (if this page is inside it) is told.
import * as THREE from 'three';
import type { DreamHost } from './dreamHost';

const STEPS: { icon: string; name: string; say: string; at: [number, number] | null }[] = [
  { icon: '💡', name: '对灯泡说出一个梦', say: '学徒的第一课：到演出设计室，点一下桌上发光的灯泡，说出你想造的世界。', at: [-15.2, 16.9] },
  { icon: '🧸', name: '摆上三件模型', say: '世界有了。到模型车间的沙盘前，从两边的架子上拖三件模型放上去。', at: [0.85, 5.6] },
  { icon: '✏️', name: '画一条游览路线', say: '客人从哪里走？拿起笔筒里的黄铅笔，在沙盘上画一条路线。', at: [0.85, 5.6] },
  { icon: '🤖', name: '让一个角色动起来', say: '去 MAPO。在工作台上选一个角色，点亮横杆上的一个动作圆牌。', at: [17.5, 4.4] },
  { icon: '🚪', name: '走进你的世界', say: '最后一课：回到沙盘，点发光的小拱门，缩小走进你自己造的世界。', at: [0.85, 5.6] },
  { icon: '🎩', name: '小小 Imagineer', say: '', at: null },
];
const count = (w: any, f: (c: any) => boolean) => (w && w.timeline && w.timeline.clips ? w.timeline.clips.filter(f).length : 0);

export class Apprentice {
  step = 0;
  private base: { n: number; route: string; acts: number } = { n: 0, route: '', acts: 0 };
  private dreamt = false; private wasGuest = false; private t = 0;
  private card: HTMLDivElement; private beam = new THREE.Group();
  constructor(root: THREE.Group, private host: DreamHost) {
    try { this.step = Math.max(0, Math.min(5, +(localStorage.getItem('dw.apprentice') || 0))); } catch (e) { /* from the start */ }
    const glow = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false });
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3.4, 16, 1, true), glow); col.position.y = 1.7; this.beam.add(col);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 4), new THREE.MeshBasicMaterial({ color: 0xfde047 })); tip.rotation.x = Math.PI; this.beam.add(tip); root.add(this.beam);
    const dream0 = host.dreamFromIdea.bind(host); host.dreamFromIdea = async (idea: string) => { const ok = await dream0(idea); if (ok) this.dreamt = true; return ok; };
    this.card = document.createElement('div');
    this.card.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:45;display:flex;align-items:center;gap:10px;padding:8px 16px;border-radius:999px;background:rgba(13,19,31,.88);border:1.5px solid rgba(253,224,71,.7);color:#fde68a;font:700 14px -apple-system,"PingFang SC",sans-serif;pointer-events:auto;cursor:pointer';
    this.card.onclick = () => this.speak(); document.body.appendChild(this.card);
    this.enter(false);
  }
  private speak() { const s = STEPS[this.step]; if (!s.say) return; this.host.events.onMessage?.(s.icon + ' ' + s.say); try { const ss = window.speechSynthesis; ss.cancel(); const u = new SpeechSynthesisUtterance(s.say); u.lang = 'zh-CN'; ss.speak(u); } catch (e) { /* silent */ } }
  private enter(tell: boolean) {
    const w = this.host.work, s = STEPS[this.step];
    this.base = { n: w ? w.objects.length : 0, route: JSON.stringify((w && w.route) || []), acts: count(w, (c) => c.track === 'action') }; this.dreamt = false;
    const dots = STEPS.slice(0, 5).map((_, i) => '<i style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 2px;background:' + (i < this.step ? '#4ade80' : i === this.step ? '#fde047' : 'rgba(255,255,255,.25)') + '"></i>').join('');
    this.card.innerHTML = '<span style="font-size:22px">' + s.icon + '</span><span>' + s.name + '</span><span>' + (this.step < 5 ? dots : '') + '</span>';
    try { localStorage.setItem('dw.apprentice', String(this.step)); } catch (e) { /* not kept */ }
    try { if (window.parent !== window) window.parent.postMessage({ type: 'minest-apprentice', step: this.step, done: this.step >= 5 }, '*'); } catch (e) { /* alone */ }
    if (tell) this.speak();
  }
  private next() {
    this.step++; this.enter(this.step < 5);
    if (this.step === 5) { const m = '🎩 恭喜！你完成了学徒的五课，现在是一名小小 Imagineer。点蓝图板上的 🏰，把你的世界放进乐园吧。'; this.host.events.onMessage?.(m); try { const u = new SpeechSynthesisUtterance(m.slice(2)); u.lang = 'zh-CN'; window.speechSynthesis.speak(u); } catch (e) { /* silent */ } }
  }
  /** each frame: whether the step in hand has been done; the beam where it is done */
  frame(dt: number, walking: boolean) {
    this.t += dt; const h = this.host, w = h.work, s = STEPS[this.step], guest = h.mode === 'guest' || h.mode === 'diving';
    this.card.style.display = h.mode === 'mini' ? 'flex' : 'none';
    this.beam.visible = walking && !!s.at; if (s.at) { this.beam.position.set(s.at[0], 0, s.at[1]); this.beam.children[1].position.y = 2.6 + Math.abs(Math.sin(this.t * 3)) * 0.3; this.beam.children[1].rotation.y = this.t * 2; }
    if (this.step >= 5) return;
    let done = false;
    if (this.step === 0) done = this.dreamt;
    else if (this.step === 1) done = !!w && w.objects.length >= this.base.n + 3;
    else if (this.step === 2) done = !!w && (w.route || []).length > 1 && JSON.stringify(w.route) !== this.base.route;
    else if (this.step === 3) done = count(w, (c) => c.track === 'action') !== this.base.acts;
    else if (this.step === 4) { if (guest) this.wasGuest = true; done = this.wasGuest && h.mode === 'mini'; }
    if (w && this.step === 1 && w.objects.length < this.base.n) this.base.n = w.objects.length;
    if (done) this.next();
  }
}
