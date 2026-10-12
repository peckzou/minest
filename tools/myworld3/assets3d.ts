/* Minest My World 3.0 · Studio asset runtime (window.MinestAssets3D)
   Studio's procedural asset library (tools/myworld3/studio — vendored unchanged from "Minest — World Island Library")
   + three.js, bundled once. Static first: every asset becomes a cached 2.5D thumbnail (offscreen render → Blob in
   IndexedDB); a live model is built only for Inspect 3D. Assets are skins, never data. */
import * as THREE from 'three';
import { ISLANDS_DATA } from './studio/data/islandsData';
import { DIORAMAS_DATA } from './studio/data/dioramasData';
import { OBJECTS_DATA } from './studio/data/objectsData';
import { CENTER_STYLES } from './studio/data/centerStylesData';
import { buildIslandScene } from './studio/components/island3d/islandMeshBuilders';
import { buildCenterStyleScene } from './studio/components/island3d/centerStyleBuilders';

const VERSION = 'mn3d-v1';
type Kind = 'world' | 'diorama' | 'object' | 'center';
const pick = (a: any) => ({ id: a.id, name: a.name, subtitle: a.subtitle || '', category: a.categoryName || a.category || '', subcategories: a.subcategories || [], theme: a.theme || '', accent: a.accentColor || (a.variants && a.variants.classic && a.variants.classic.accentColor) || (a.palette && a.palette[0] && a.palette[0].hex) || '#7aa2ff', description: a.description || '' });
const CATALOG = {
  world: ISLANDS_DATA.map(pick), diorama: DIORAMAS_DATA.map(pick), object: OBJECTS_DATA.map(pick),
  center: CENTER_STYLES.map((c: any) => ({ id: c.id, name: c.name, subtitle: c.subtitle, theme: c.theme, accent: c.accentColor, description: c.description, palette: c.palette })),
};
const BY: Record<string, any> = {};
[...ISLANDS_DATA, ...DIORAMAS_DATA, ...OBJECTS_DATA].forEach((a: any) => { BY[a.id] = a; });

function kindOf(id: string): Kind { return id.startsWith('center_') ? 'center' : id.startsWith('diorama_') ? 'diorama' : id.startsWith('object_') ? 'object' : 'world'; }
function build(id: string, variant = 'classic'): THREE.Object3D {
  if (kindOf(id) === 'center') return buildCenterStyleScene(id as any);
  const a = BY[id]; if (!a) throw new Error('Unknown asset ' + id);
  return buildIslandScene(a, variant as any);
}
function dispose(o: THREE.Object3D) {
  o.traverse((c: any) => { if (c.geometry) c.geometry.dispose(); const m = c.material; if (Array.isArray(m)) m.forEach((x) => x.dispose && x.dispose()); else if (m && m.dispose) m.dispose(); });
}
function lights(scene: THREE.Scene) {
  const hemi = new THREE.HemisphereLight(0xffffff, 0xdde6ed, 0.75);
  const sun = new THREE.DirectionalLight(0xfff8ee, 1.35); sun.position.set(15, 25, 12);
  const fill = new THREE.DirectionalLight(0xd9e7f5, 0.45); fill.position.set(-15, 10, -10);
  scene.add(hemi, sun, fill);
}
// an isometric orthographic camera fitted to the object's bounds (works for islands, dioramas, objects and centres alike)
function fit(cam: THREE.OrthographicCamera, obj: THREE.Object3D, pad = 1.08) {
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3());
  const dir = new THREE.Vector3(20, 16.33, 20).normalize();
  cam.position.copy(c).addScaledVector(dir, 60); cam.lookAt(c); cam.updateMatrixWorld();
  const inv = cam.matrixWorldInverse, pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z).applyMatrix4(inv));
  let w = 0, h = 0; pts.forEach((p) => { w = Math.max(w, Math.abs(p.x)); h = Math.max(h, Math.abs(p.y)); });
  const half = Math.max(w, h) * pad;
  cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 0.1; cam.far = 200; cam.updateProjectionMatrix();
}

// ---------------------------------------------------------------- the thumbnail cache (IndexedDB → object URLs)
const mem = new Map<string, string>();
let dbp: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  if (dbp) return dbp;
  dbp = new Promise((res) => {
    try { const r = indexedDB.open('minest-assets3d', 1); r.onupgradeneeded = () => r.result.createObjectStore('thumbs'); r.onsuccess = () => res(r.result); r.onerror = () => res(null); } catch (e) { res(null); }
  });
  return dbp;
}
async function getBlob(key: string): Promise<Blob | null> { const d = await db(); if (!d) return null; return new Promise((res) => { try { const q = d.transaction('thumbs').objectStore('thumbs').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
async function putBlob(key: string, b: Blob) { const d = await db(); if (!d) return; try { d.transaction('thumbs', 'readwrite').objectStore('thumbs').put(b, key); } catch (e) {} }

let R: { renderer: THREE.WebGLRenderer; scene: THREE.Scene; cam: THREE.OrthographicCamera } | null = null;
let glFailed = false;
function renderer() {
  if (R || glFailed) return R;
  try {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 384;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(384, 384, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene(); lights(scene);
    R = { renderer, scene, cam: new THREE.OrthographicCamera(-7, 7, 7, -7, 0.1, 200) };
  } catch (e) { glFailed = true; R = null; }
  return R;
}
function toBlob(c: HTMLCanvasElement): Promise<Blob | null> { return new Promise((res) => { try { c.toBlob((b) => res(b), 'image/png'); } catch (e) { res(null); } }); }
const queue: Array<() => Promise<void>> = []; let busy = false;
function pump() {
  if (busy || !queue.length) return; busy = true;
  const job = queue.shift()!;
  job().finally(() => { busy = false; if (document.hidden || !window.requestAnimationFrame) setTimeout(pump, 16); else requestAnimationFrame(() => pump()); });
}
const inflight = new Map<string, Promise<string>>();
// thumb(id) → a URL for <img> ('' when this device cannot draw it: the UI falls back to a plain tile)
function thumb(id: string, variant = 'classic'): Promise<string> {
  const key = VERSION + ':' + id + ':' + variant;
  if (mem.has(key)) return Promise.resolve(mem.get(key)!);
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    const hit = await getBlob(key);
    if (hit) { const u = URL.createObjectURL(hit); mem.set(key, u); return u; }
    return new Promise<string>((res) => {
      queue.push(async () => {
        const r = renderer(); if (!r) return res('');
        let obj: THREE.Object3D | null = null;
        try {
          obj = build(id, variant); r.scene.add(obj); fit(r.cam, obj);
          r.renderer.render(r.scene, r.cam);
          const b = await toBlob(r.renderer.domElement as HTMLCanvasElement);
          r.scene.remove(obj); dispose(obj); obj = null;
          if (!b) return res('');
          putBlob(key, b); const u = URL.createObjectURL(b); mem.set(key, u); res(u);
        } catch (e) { if (obj) { r.scene.remove(obj); dispose(obj); } console.warn('[MinestAssets3D] thumbnail failed', id, e); res(''); }
      });
      pump();
    });
  })();
  inflight.set(key, p); p.finally(() => inflight.delete(key));
  return p;
}
function cached(id: string, variant = 'classic'): string { return mem.get(VERSION + ':' + id + ':' + variant) || ''; }

// ---------------------------------------------------------------- Inspect 3D: one live model, drag to turn, paused when hidden
function mount(el: HTMLElement, id: string, variant = 'classic') {
  let stop = false, raf = 0, visible = true;
  const w = el.clientWidth || 320, h = el.clientHeight || 320;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); lights(scene);
  const cam = new THREE.OrthographicCamera(-7, 7, 7, -7, 0.1, 200);
  let obj: THREE.Object3D;
  try { obj = build(id, variant); } catch (e) { renderer.dispose(); renderer.domElement.remove(); return null; }
  const pivot = new THREE.Group(); pivot.add(obj); scene.add(pivot); fit(cam, obj, 1.18);
  const aspect = w / h; cam.left *= aspect; cam.right *= aspect; cam.updateProjectionMatrix();
  let rotY = 0, vel = 0.004, drag: any = null;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = renderer.domElement; cv.style.touchAction = 'none';
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; vel = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; const d = (e.clientX - drag.x) / 120; vel = d - (rotY - drag.r); rotY = drag.r + d; });
  cv.addEventListener('pointerup', () => { drag = null; vel = Math.max(-0.05, Math.min(0.05, vel * 0.2)); });
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; }) : null; if (io) io.observe(el);
  const tick = () => { if (stop) return; raf = requestAnimationFrame(tick); if (!visible || document.hidden) return; if (!drag) { rotY += reduce ? 0 : vel || 0; if (!reduce && Math.abs(vel) < 0.004) vel += (0.004 - vel) * 0.02; } pivot.rotation.y = rotY; renderer.render(scene, cam); };
  tick();
  return { dispose() { stop = true; cancelAnimationFrame(raf); if (io) io.disconnect(); scene.remove(pivot); dispose(obj); renderer.dispose(); cv.remove(); } };
}

// ---------------------------------------------------------------- Explore Mode: the live archipelago (only when asked for)
// spec: { center: styleId, islands: [{ key, id, x, y, label }] } — x / y are the same stable slot units as the 2D map
function archipelago(el: HTMLElement, spec: any, onPick: (key: string) => void) {
  let stop = false, raf = 0, visible = true;
  const w = el.clientWidth || 360, h = el.clientHeight || 480;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(w, h); renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); lights(scene);
  const world = new THREE.Group(); scene.add(world);
  const built: THREE.Object3D[] = [], labels: Array<{ el: HTMLElement; obj: THREE.Object3D }> = [];
  const UNIT = 13;
  function add(id: string, key: string, x: number, z: number, scale: number, label: string) {
    let o: THREE.Object3D; try { o = build(id); } catch (e) { return; }
    const box = new THREE.Box3().setFromObject(o), size = box.getSize(new THREE.Vector3()), k = (9 * scale) / Math.max(size.x, size.z, 1);
    const g = new THREE.Group(); g.add(o); o.position.sub(box.getCenter(new THREE.Vector3())); g.scale.setScalar(k); g.position.set(x, 0, z);
    g.userData.key = key; g.userData.bob = Math.random() * 6; world.add(g); built.push(o);
    const tag = document.createElement('div'); tag.className = 'uv-x-tag'; tag.textContent = label; el.appendChild(tag); labels.push({ el: tag, obj: g });
  }
  add(spec.center, '@center', 0, 0, 1.5, spec.centerLabel || 'My World');
  (spec.islands || []).forEach((i: any) => add(i.id, i.key, i.x * UNIT, i.y * UNIT, 1, i.label));
  const cam = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  fit(cam, world, 1.12); const aspect = w / h; cam.left *= aspect; cam.right *= aspect; cam.updateProjectionMatrix();
  let rotY = 0, zoom = 1, drag: any = null, moved = 0;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cv = renderer.domElement; cv.style.touchAction = 'none';
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: rotY }; moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; moved = Math.max(moved, Math.abs(e.clientX - drag.x)); rotY = drag.r + (e.clientX - drag.x) / 160; });
  cv.addEventListener('pointerup', (e) => {
    const wasDrag = moved > 6; drag = null; if (wasDrag) return;
    const r = cv.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam); const hit = ray.intersectObjects(world.children, true)[0]; if (!hit) return;
    let o: any = hit.object; while (o && !o.userData.key) o = o.parent; if (o) onPick(o.userData.key);
  });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(.6, Math.min(2.4, zoom * (e.deltaY > 0 ? .92 : 1.08))); cam.zoom = zoom; cam.updateProjectionMatrix(); }, { passive: false });
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { visible = es[0].isIntersecting; }) : null; if (io) io.observe(el);
  const v = new THREE.Vector3(), t0 = performance.now();
  const tick = () => {
    if (stop) return; raf = requestAnimationFrame(tick); if (!visible || document.hidden) return;
    const t = (performance.now() - t0) / 1000;
    world.rotation.y = rotY; if (!reduce) world.children.forEach((g: any) => { g.position.y = Math.sin(t * .8 + g.userData.bob) * .25; });
    renderer.render(scene, cam);
    labels.forEach((l) => { l.obj.getWorldPosition(v); v.y -= 2.6; v.project(cam); l.el.style.transform = 'translate(-50%,0) translate(' + ((v.x + 1) / 2 * w).toFixed(1) + 'px,' + ((1 - v.y) / 2 * h).toFixed(1) + 'px)'; });
  };
  tick();
  return { dispose() { stop = true; cancelAnimationFrame(raf); if (io) io.disconnect(); built.forEach(dispose); labels.forEach((l) => l.el.remove()); renderer.dispose(); cv.remove(); } };
}

(window as any).MinestAssets3D = { version: VERSION, catalog: CATALOG, info: (id: string) => BY[id] || CATALOG.center.find((c: any) => c.id === id) || null, kindOf, thumb, cached, mount, archipelago, webgl: () => !!renderer() };
