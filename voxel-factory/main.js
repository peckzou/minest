import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { layoutText } from './glyphs.js';

/* ───────────── Registries (extension points: add kits / templates here) ───────────── */
const SCHEMA = 1;
const STORE_KEY = 'minest3d.world.v1';
const FOUNDRY = { x: -9, z: 0, top: 0.3 };
const SHELF_PITCH = 7.6;

const CRAFT_KITS = {
  'voxel-foundry': {
    id: 'voxel-foundry', name: 'Voxel Foundry', generator: 'voxel-text', animation: 'layer-stack',
    toolRefs: ['printer', 'gantry'], materialSet: ['oak'],
    itemTemplateIds: ['wood-word-block'], recommendedDisplayTemplateIds: ['smart-shelf'],
  },
  'stone-atelier': {
    id: 'stone-atelier', name: 'Stone Atelier', generator: 'engraved-slab', animation: 'chisel-chips',
    toolRefs: ['hammer', 'chisel', 'brush'], materialSet: ['granite'],
    itemTemplateIds: ['rune-slab'], recommendedDisplayTemplateIds: ['stone-pedestal'],
  },
  glassworks: {
    id: 'glassworks', name: 'Glassworks', generator: 'glass-orb', animation: 'none',
    toolRefs: ['furnace', 'blowtorch'], materialSet: ['glass'],
    itemTemplateIds: ['memory-orb', 'crystal-award', 'glass-tube', 'neon-sign'], recommendedDisplayTemplateIds: ['glass-cabinet'],
  },
  woodcraft: {
    id: 'woodcraft', name: 'Woodcraft', generator: 'engraved-plaque', animation: 'none',
    toolRefs: ['chisel', 'mallet'], materialSet: ['oak'],
    itemTemplateIds: ['wood-plaque'], recommendedDisplayTemplateIds: ['plaque-wall'],
  },
  'thread-studio': {
    id: 'thread-studio', name: 'Thread Studio', generator: 'stitched-cloth', animation: 'none',
    toolRefs: ['needle', 'hoop'], materialSet: ['linen'],
    itemTemplateIds: ['stitch-sampler'], recommendedDisplayTemplateIds: ['sewing-rack'],
  },
  'botanical-studio': {
    id: 'botanical-studio', name: 'Botanical Studio', generator: 'pressed-specimen', animation: 'none',
    toolRefs: ['press', 'tweezers'], materialSet: ['paper'],
    itemTemplateIds: ['pressed-flower'], recommendedDisplayTemplateIds: ['herbarium-board'],
  },
  'ceramic-studio': {
    id: 'ceramic-studio', name: 'Ceramic Studio', generator: 'lathe-vessel', animation: 'none',
    toolRefs: ['wheel', 'kiln'], materialSet: ['glaze'],
    itemTemplateIds: ['ceramic-vase'], recommendedDisplayTemplateIds: ['ceramic-shelf'],
  },
  'archive-desk': {
    id: 'archive-desk', name: 'Archive Desk', generator: 'file-folder', animation: 'none',
    toolRefs: ['stamp', 'index'], materialSet: ['manila'],
    itemTemplateIds: ['file-folder'], recommendedDisplayTemplateIds: ['archive-cabinet'],
  },
  'retail-packaging': {
    id: 'retail-packaging', name: 'Retail Packaging', generator: 'product-box', animation: 'none',
    toolRefs: ['carton', 'label-gun'], materialSet: ['cardboard'],
    itemTemplateIds: ['product-box'], recommendedDisplayTemplateIds: ['retail-rack'],
  },
  signworks: {
    id: 'signworks', name: 'Signworks', generator: 'billboard-panel', animation: 'none',
    toolRefs: ['screen', 'frame'], materialSet: ['led'],
    itemTemplateIds: ['billboard-panel'], recommendedDisplayTemplateIds: ['knowledge-billboard'],
  },
  'cube-lab': {
    id: 'cube-lab', name: 'Cube Lab', generator: 'world-cube', animation: 'none',
    toolRefs: ['terraformer'], materialSet: ['glass'],
    itemTemplateIds: ['world-cube'], recommendedDisplayTemplateIds: ['cube-plinth'],
  },
  letterpress: {
    id: 'letterpress', name: 'Letterpress', generator: 'printed-card', animation: 'press',
    toolRefs: ['type-tray', 'press'], materialSet: ['paper'],
    itemTemplateIds: ['flashcard'], recommendedDisplayTemplateIds: ['wall-display'],
  },
};
const ITEM_TEMPLATES = {
  'neon-sign': { id: 'neon-sign', tags: ['neon'], w: 2.4, h: 1.0, d: 0.08, style: 'neon', display: 'neon-wall' },
  'stitch-sampler': { id: 'stitch-sampler', tags: ['fabric'], w: 1.5, h: 1.1, d: 0.06, style: 'thread' },
  'pressed-flower': { id: 'pressed-flower', tags: ['specimen'], w: 1.3, h: 1.7, d: 0.08, style: 'botanical' },
  'ceramic-vase': { id: 'ceramic-vase', tags: ['ceramic'], shape: 'vase', w: 0.9, h: 1.3, d: 0.9 },
  'file-folder': { id: 'file-folder', tags: ['file'], w: 1.6, h: 0.9, d: 0.05, style: 'folder' },
  'product-box': { id: 'product-box', tags: ['product'], w: 1.1, h: 1.5, d: 0.45, style: 'product' },
  'billboard-panel': { id: 'billboard-panel', tags: ['billboard'], w: 5.2, h: 2.4, d: 0.15, style: 'billboard' },
  'glass-tube': { id: 'glass-tube', tags: ['tube'], shape: 'tube', w: 0.52, h: 1.4, d: 0.52, display: 'glass-cabinet' },
  'world-cube': { id: 'world-cube', tags: ['cube'], shape: 'cube', w: 1.3, h: 1.34, d: 1.3 },
  'rune-slab': { id: 'rune-slab', tags: ['stone'], w: 1.2, h: 1.6, d: 0.25, style: 'stone', display: 'stone-pedestal' },
  'crystal-award': { id: 'crystal-award', tags: ['crystal'], shape: 'crystal', w: 0.9, h: 1.4, d: 0.4, display: 'glass-cabinet' },
  'memory-orb': { id: 'memory-orb', tags: ['orb'], shape: 'orb', w: 0.9, h: 1.05, d: 0.9 },
  flashcard: { id: 'flashcard', tags: ['card'], w: 1.4, h: 1.0, d: 0.04, style: 'paper' },
  'wood-plaque': { id: 'wood-plaque', tags: ['plaque'], w: 2.4, h: 0.8, d: 0.1, style: 'wood' },
  'wood-word-block': { id: 'wood-word-block', tags: ['block'], bodyDepth: 0.5, pad: 0.1, maxVoxel: 0.05, fitWidth: 1.8, layers: 2 },
};
const bx = (root, w, h, d, x, y, z, mm, shadow = true) => {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; root.add(o); return o;
};
const gridSlots = (prefix, rows, xs, tags, size, snapRadius, z = 0.1) => rows.flatMap((y, r) => xs.map((x, i) => ({
  id: `${prefix}${r + 1}C${i + 1}`, level: r + 1, local: [x, y, z], size, allowedItemTags: tags, snapRadius,
})));
const DISPLAY_TEMPLATES = {
  'neon-wall': {
    id: 'neon-wall', label: 'Neon Wall', pitch: 7.6,
    slots: () => gridSlots('R', [0.5, 1.9, 3.3], [-1.6, 1.6], ['neon'], [2.6, 1.2, 0.2], 1.2),
    build(root, mat) {
      bx(root, 7.0, 4.8, 0.2, 0, 2.4, -0.1, mat.plinth); bx(root, 7.2, 0.2, 0.4, 0, 0.1, 0, mat.metal); bx(root, 7.2, 0.2, 0.4, 0, 4.9, 0, mat.metal);
    },
  },
  'sewing-rack': {
    id: 'sewing-rack', label: 'Sewing Rack', pitch: 7.6,
    slots: () => gridSlots('R', [0.5, 2.3], [-2.4, 0, 2.4], ['fabric'], [1.6, 1.3, 0.2], 0.95),
    build(root, mat) {
      bx(root, 7.2, 4.0, 0.2, 0, 2.0, -0.1, mat.shelfDark); bx(root, 7.4, 0.2, 0.4, 0, 4.1, 0, mat.shelf); bx(root, 7.4, 0.2, 0.4, 0, 0.1, 0, mat.shelf);
      [0.5, 2.3].forEach((y) => bx(root, 7.0, 0.06, 0.06, 0, y + 1.35, 0.1, mat.metal, false));
    },
  },
  'herbarium-board': {
    id: 'herbarium-board', label: 'Herbarium Board', pitch: 7.6,
    slots: () => gridSlots('R', [0.4, 2.6], [-2.4, 0, 2.4], ['specimen'], [1.5, 1.9, 0.3], 1.0),
    build(root, mat) {
      bx(root, 7.2, 5.0, 0.2, 0, 2.5, -0.1, mat.herb); bx(root, 7.4, 0.2, 0.4, 0, 5.1, 0, mat.shelf); bx(root, 7.4, 0.2, 0.4, 0, 0.1, 0, mat.shelf);
    },
  },
  'ceramic-shelf': {
    id: 'ceramic-shelf', label: 'Ceramic Shelf', pitch: 7.6,
    slots: () => gridSlots('L', [0.2, 2.1], [-2.1, 0, 2.1], ['ceramic'], [1.9, 1.6, 1.4], 1.1, 0.05),
    build(root, mat) {
      bx(root, 0.2, 4.2, 1.2, -3.4, 2.1, 0.05, mat.shelf); bx(root, 0.2, 4.2, 1.2, 3.4, 2.1, 0.05, mat.shelf);
      bx(root, 6.8, 4.2, 0.1, 0, 2.1, -0.5, mat.herb);
      [0.1, 2.0, 3.9].forEach((y) => bx(root, 6.8, 0.2, 1.2, 0, y, 0.05, mat.shelf));
    },
  },
  'archive-cabinet': {
    id: 'archive-cabinet', label: 'Cabinet of Knowledge', pitch: 7.4,
    slots: () => gridSlots('D', [0.25, 1.35, 2.45, 3.55], [-2.0, 0, 2.0], ['file'], [1.8, 0.95, 0.3], 0.9, 0.72),
    build(root, mat) {
      bx(root, 6.4, 4.7, 1.0, 0, 2.35, 0, mat.plinth);
      [0.25, 1.35, 2.45, 3.55].forEach((y) => [-2.0, 0, 2.0].forEach((x) => {
        bx(root, 1.9, 1.0, 0.16, x, y + 0.5, 0.57, mat.oak); bx(root, 0.5, 0.08, 0.1, x, y + 0.2, 0.7, mat.metal, false);
      }));
    },
  },
  'retail-rack': {
    id: 'retail-rack', label: 'Retail Rack', pitch: 7.6,
    slots: () => gridSlots('L', [0.2, 1.9, 3.6], [-2.2, 0, 2.2], ['product'], [1.3, 1.6, 0.8], 1.0, 0.05),
    build(root, mat) {
      bx(root, 0.2, 5.4, 0.8, -3.4, 2.7, 0.05, mat.metal); bx(root, 0.2, 5.4, 0.8, 3.4, 2.7, 0.05, mat.metal);
      bx(root, 6.8, 5.4, 0.1, 0, 2.7, -0.35, mat.wall);
      [0.1, 1.8, 3.5, 5.3].forEach((y) => bx(root, 6.8, 0.2, 0.8, 0, y, 0.05, mat.metal));
      [0.1, 1.8, 3.5].forEach((y) => bx(root, 6.4, 0.12, 0.04, 0, y + 0.08, 0.47, mat.priceStrip, false));
    },
  },
  'knowledge-billboard': {
    id: 'knowledge-billboard', label: 'Knowledge Drive Billboard', pitch: 8.4,
    slots: () => [{ id: 'B1', level: 1, local: [0, 1.8, 0.1], size: [5.4, 2.6, 0.4], allowedItemTags: ['billboard'], snapRadius: 2.2 }],
    build(root, mat) {
      bx(root, 0.3, 1.8, 0.3, -2.3, 0.9, -0.15, mat.metal); bx(root, 0.3, 1.8, 0.3, 2.3, 0.9, -0.15, mat.metal);
      bx(root, 5.6, 2.6, 0.12, 0, 3.1, -0.1, mat.plinth); bx(root, 6.0, 0.2, 1.2, 0, 0.1, 0, mat.stone);
    },
  },
  'cube-plinth': {
    id: 'cube-plinth', label: 'Cube Plinth', pitch: 8,
    slots: () => [-2.4, 0, 2.4].map((x, i) => ({ id: `C${i + 1}`, level: 1, local: [x, 1.0, 0], size: [1.7, 1.5, 1.5], allowedItemTags: ['cube'], snapRadius: 1.0 })),
    build(root, mat) {
      bx(root, 7.2, 0.2, 1.8, 0, 0.1, 0, mat.plinth);
      [-2.4, 0, 2.4].forEach((x) => { bx(root, 1.8, 0.7, 1.5, x, 0.55, 0, mat.plinth); bx(root, 1.9, 0.1, 1.6, x, 0.95, 0, mat.metal); });
    },
  },
  'stone-pedestal': {
    id: 'stone-pedestal', label: 'Stone Pedestal', pitch: 8,
    slots() {
      return [-2.4, 0, 2.4].map((x, i) => ({
        id: `P${i + 1}`, level: 1, local: [x, 1.0, 0], size: [1.7, 1.9, 1.1],
        allowedItemTags: ['stone', 'crystal'], snapRadius: 1.0,
      }));
    },
    build(root, mat) {
      const m = (w, h, d, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat.stone); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; root.add(o); };
      m(7.2, 0.2, 1.8, 0, 0.1, 0);
      [-2.4, 0, 2.4].forEach((x) => { m(1.8, 0.8, 1.3, x, 0.6, 0); m(2.0, 0.1, 1.5, x, 0.95, 0); });
    },
  },
  'glass-cabinet': {
    id: 'glass-cabinet', label: 'Glass Cabinet', pitch: 8.2,
    slots() {
      const out = [];
      [0.25, 2.0].forEach((y, r) => [-2.55, -0.85, 0.85, 2.55].forEach((x, i) => out.push({
        id: `S${r + 1}C${i + 1}`, level: r + 1, local: [x, y, 0], size: [1.5, 1.45, 1.2],
        allowedItemTags: ['orb', 'crystal', 'tube'], snapRadius: 0.95,
      })));
      return out;
    },
    build(root, mat) {
      const m = (w, h, d, x, y, z, mm, shadow = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; root.add(o); };
      m(7.6, 0.2, 1.5, 0, 0.1, 0, mat.shelfDark); m(7.6, 0.2, 1.5, 0, 4.1, 0, mat.shelfDark);
      [-3.7, 3.7].forEach((x) => m(0.2, 4, 1.5, x, 2.1, 0, mat.shelfDark));
      m(7.4, 3.9, 0.08, 0, 2.1, -0.7, mat.backlight, false);
      m(7.2, 0.08, 1.3, 0, 1.85, 0, mat.glass, false);
      m(7.2, 3.9, 0.04, 0, 2.1, 0.72, mat.glass, false);
    },
  },
  'plaque-wall': {
    id: 'plaque-wall', label: 'Plaque Wall', pitch: 7.6,
    slots() {
      const out = [];
      [0.5, 1.9, 3.3].forEach((y, r) => [-1.7, 1.7].forEach((x, i) => out.push({
        id: `R${r + 1}C${i + 1}`, level: r + 1, local: [x, y, 0.1], size: [2.6, 1.2, 0.3],
        allowedItemTags: ['plaque'], snapRadius: 1.2,
      })));
      return out;
    },
    build(root, mat) {
      const m = (w, h, d, x, y, z, mm) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; root.add(o); };
      m(7.2, 4.8, 0.2, 0, 2.4, -0.1, mat.shelfDark);
      m(7.4, 0.2, 0.4, 0, 4.9, 0, mat.shelf); m(7.4, 0.2, 0.4, 0, 0.1, 0, mat.shelf);
    },
  },
  'wall-display': {
    id: 'wall-display', label: 'Wall Display', pitch: 7.6,
    slots() {
      const out = [];
      [0.5, 1.9, 3.3].forEach((y, r) => [-2.4, -0.8, 0.8, 2.4].forEach((x, i) => out.push({
        id: `R${r + 1}C${i + 1}`, level: r + 1, local: [x, y, 0.1], size: [1.5, 1.3, 0.2],
        allowedItemTags: ['card'], snapRadius: 0.95,
      })));
      return out;
    },
    build(root, mat) {
      const m = (w, h, d, x, y, z, mm) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mm); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; root.add(o); };
      m(7.2, 4.8, 0.2, 0, 2.4, -0.1, mat.wall);
      m(7.4, 0.2, 0.4, 0, 4.9, 0, mat.shelf); m(7.4, 0.2, 0.4, 0, 0.1, 0, mat.shelf);
    },
  },
  'smart-shelf': {
    id: 'smart-shelf', label: 'Smart Shelf', pitch: 7.6,
    slots() {
      const out = [];
      [0.2, 1.9, 3.6].forEach((y, level) => [-2.1, 0, 2.1].forEach((x, i) => out.push({
        id: `L${level + 1}S${i + 1}`, level: level + 1, local: [x, y, 0.05], size: [2.04, 1.6, 0.7],
        allowedItemTags: ['block'], snapRadius: 1.15,
      })));
      return out;
    },
    build(root, mat) {
      const box = (w, h, d, x, y, z, m = mat.shelf) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
        mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; root.add(mesh);
      };
      box(0.2, 5.5, 0.8, -3.4, 2.75, 0.05); box(0.2, 5.5, 0.8, 3.4, 2.75, 0.05);
      box(6.8, 5.5, 0.1, 0, 2.75, -0.35, mat.shelfDark);
      [0.1, 1.8, 3.5, 5.4].forEach((y) => box(6.8, 0.2, 0.8, 0, y, 0.05));
    },
  },
};

const TEMPLATE_LABEL = { 'wood-word-block': 'Wooden Word Block', flashcard: 'Flashcard', 'wood-plaque': 'Wood Plaque', 'memory-orb': 'Memory Orb', 'crystal-award': 'Crystal Award', 'rune-slab': 'Rune Slab',
  'stitch-sampler': 'Stitch Sampler', 'pressed-flower': 'Pressed Flower', 'ceramic-vase': 'Ceramic Vase', 'file-folder': 'File Folder',
  'product-box': 'Product Box', 'billboard-panel': 'Billboard Panel', 'glass-tube': 'Glass Tube', 'neon-sign': 'Neon Sign', 'world-cube': 'World in a Cube' };

/* ───────────── State: single source of truth; the scene is a projection of it ───────────── */
const fresh = () => ({ schemaVersion: SCHEMA, seq: 0, contents: {}, items: {}, displays: {}, placements: {}, tray: [] });
let state = fresh();
let camState = null;
const undoStack = [];
const redoStack = [];

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (raw && raw.schemaVersion === SCHEMA) { camState = raw.camera || null; delete raw.camera; return raw; }
  } catch (e) { console.warn('load failed', e); }
  return null;
}
function save() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, camera: camState }));
}
function checkpoint() {
  undoStack.push(JSON.stringify(state)); if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
}
const nid = (p) => `${p}-${++state.seq}`;

/* ───────────── Printed card surface (real text drawn on a paper texture) ───────────── */
const CARD_STYLES = {
  paper: { cw: 560, ch: 400, maxW: 460, maxH: 300, size: 72, bg: '#f6efdc', ink: '#2c2a6b', border: '#b89a62', font: 'Georgia, serif' },
  glow: { cw: 512, ch: 256, maxW: 440, maxH: 190, size: 64, bg: null, ink: '#fff6d6', border: null, font: 'Georgia, serif' },
  etch: { cw: 512, ch: 256, maxW: 340, maxH: 170, size: 60, bg: null, ink: '#ffffff', border: null, font: 'Georgia, serif' },
  stone: { cw: 400, ch: 560, maxW: 310, maxH: 400, size: 72, bg: '#8d8f91', ink: '#2a2b2d', border: '#6b6d6f', font: 'Georgia, serif', blankBack: true, side: 0x777a7c },
  neon: { cw: 960, ch: 400, maxW: 820, maxH: 260, size: 120, bg: '#0d0d18', ink: '#ff7ae0', border: '#ff7ae0', font: 'Georgia, serif', blankBack: true, side: 0x1a1a24, glow: '#ff3bd0' },
  thread: {
    cw: 480, ch: 360, maxW: 340, maxH: 200, size: 64, bg: '#e9dcc6', ink: '#b3302f', border: null, font: 'Georgia, serif', blankBack: true, side: 0xc9b48a, stitch: true,
    deco(g, st) {
      g.strokeStyle = '#2f6f8f'; g.lineWidth = 7; g.setLineDash([16, 12]); g.strokeRect(22, 22, st.cw - 44, st.ch - 44); g.setLineDash([]);
      for (let y = 0; y < st.ch; y += 6) { g.fillStyle = 'rgba(120,90,50,.07)'; g.fillRect(0, y, st.cw, 1); }
    },
  },
  botanical: {
    cw: 400, ch: 560, maxW: 320, maxH: 110, size: 52, ty: 470, bg: '#f3ecd6', ink: '#3b4a2a', border: '#9c8a5a', font: 'Georgia, serif', blankBack: true, side: 0xd9cba3,
    deco(g) {
      g.strokeStyle = '#4f7d3a'; g.lineWidth = 8; g.beginPath(); g.moveTo(200, 400); g.quadraticCurveTo(190, 280, 200, 170); g.stroke();
      g.fillStyle = '#6aa04c'; [[170, 330, -0.6], [232, 290, 0.6], [165, 250, -0.5]].forEach(([x, y, r]) => { g.beginPath(); g.ellipse(x, y, 34, 14, r, 0, Math.PI * 2); g.fill(); });
      for (let i = 0; i < 7; i++) { g.save(); g.translate(200, 140); g.rotate((i * Math.PI * 2) / 7); g.fillStyle = '#e48fb0'; g.beginPath(); g.ellipse(0, -42, 20, 38, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(200, 140, 20, 0, Math.PI * 2); g.fill();
    },
  },
  folder: {
    cw: 640, ch: 360, maxW: 480, maxH: 120, size: 60, bg: '#d9b36c', ink: '#222222', border: '#a98440', font: 'Georgia, serif', blankBack: true, side: 0xc49a50,
    deco(g, st) {
      g.fillStyle = '#c49a50'; g.fillRect(30, 0, 200, 46); g.fillStyle = '#fbf6e8'; g.fillRect(70, st.ch / 2 - 80, st.cw - 140, 160);
    },
  },
  product: {
    cw: 400, ch: 520, maxW: 320, maxH: 170, size: 60, ty: 280, bg: '#f4f1ea', ink: '#1d3557', border: null, font: 'Georgia, serif', blankBack: true, side: 0xe9e2d0,
    deco(g, st) {
      g.fillStyle = '#e63946'; g.fillRect(0, 0, st.cw, 110); g.fillStyle = '#1d3557'; g.fillRect(0, st.ch - 30, st.cw, 30);
      g.fillStyle = '#222'; for (let x = 120; x < 280; x += 7) g.fillRect(x, 420, 2 + (x % 3), 56);
    },
  },
  billboard: {
    cw: 1040, ch: 480, maxW: 900, maxH: 270, size: 120, ty: 290, bg: '#0f2a44', ink: '#fff6d6', border: '#4fc3f7', font: 'Georgia, serif', blankBack: true, side: 0x1b1b1b,
    deco(g, st) {
      g.fillStyle = 'rgba(79,195,247,.08)'; for (let y = 0; y < st.ch; y += 8) g.fillRect(0, y, st.cw, 2);
      g.fillStyle = '#ffb347'; g.font = '700 44px Georgia, serif'; g.textAlign = 'center'; g.fillText('K N O W L E D G E   D R I V E', st.cw / 2, 85);
      g.fillRect(st.cw / 2 - 300, 108, 600, 4);
    },
  },
  wood: { cw: 960, ch: 320, maxW: 820, maxH: 200, size: 96, bg: '#b58249', ink: '#3a2110', border: '#7a4e2b', font: 'Georgia, serif' },
};
function wrapCard(text, styleName = 'paper') {
  const st = CARD_STYLES[styleName];
  const c = document.createElement('canvas'); c.width = st.cw; c.height = st.ch; const g = c.getContext('2d');
  const { maxW, maxH } = st; let size = st.size, lines = [];
  for (; size >= 28; size -= 4) {
    g.font = `600 ${size}px ${st.font}`; lines = [];
    for (const para of text.split(/\n/)) {
      let cur = '';
      const tooWide = size > 28 && para.split(/\s+/).some((w) => g.measureText(w).width > maxW);
      if (tooWide) { lines.push(...Array(99).fill('')); break; } // force a smaller font before splitting inside a word
      for (const tok of para.split(/(?<=\s)|(?=[^\x00-\x7f])/)) {
        if (g.measureText((cur + tok).trimEnd()).width > maxW && cur) { lines.push(cur.trimEnd()); cur = ''; }
        if (g.measureText(tok).width > maxW) { for (const ch of tok) { if (g.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ''; } cur += ch; } } else cur += tok;
      }
      lines.push(cur.trimEnd());
    }
    if (lines.length * size * 1.25 <= maxH) break;
  }
  let truncated = false;
  const cap = Math.max(1, Math.floor(maxH / (size * 1.25)));
  if (lines.length > cap) { truncated = true; lines = lines.slice(0, cap); lines[cap - 1] = lines[cap - 1].slice(0, -1) + '…'; }
  if (st.bg) { g.fillStyle = st.bg; g.fillRect(0, 0, st.cw, st.ch); }
  st.deco?.(g, st);
  const cy = st.ty ?? st.ch / 2;
  if (styleName === 'stone') for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '40,40,40' : '210,210,210'},${Math.random() * 0.25})`; g.fillRect(Math.random() * st.cw, Math.random() * st.ch, 3, 3); }
  if (styleName === 'wood') for (let y = 6; y < st.ch; y += 11) { g.fillStyle = `rgba(80,45,15,${0.05 + Math.random() * 0.07})`; g.fillRect(0, y, st.cw, 3); }
  if (st.border) { g.strokeStyle = st.border; g.lineWidth = 6; g.strokeRect(18, 18, st.cw - 36, st.ch - 36); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${size}px ${st.font}`;
  lines.forEach((l, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * size * 1.25;
    if (styleName === 'stone') { g.fillStyle = 'rgba(235,235,235,.5)'; g.fillText(l, st.cw / 2 + 2, y + 3); }
    if (styleName === 'wood') { g.fillStyle = 'rgba(255,230,180,.55)'; g.fillText(l, st.cw / 2 + 2, y + 2); }
    if (styleName === 'glow') { g.shadowColor = '#ffb347'; g.shadowBlur = 18; }
    if (st.glow) { g.shadowColor = st.glow; g.shadowBlur = 28; g.fillText(l, st.cw / 2, y); }
    g.fillStyle = st.ink; g.fillText(l, st.cw / 2, y); g.shadowBlur = 0;
    if (st.stitch) { g.save(); g.setLineDash([7, 5]); g.lineWidth = 2; g.strokeStyle = '#f7ecd8'; g.strokeText(l, st.cw / 2, y); g.restore(); }
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { tex, truncated };
}

/* ───────────── Item geometry metrics ───────────── */
const metricCache = new Map();
function metrics(item) {
  const key = `${item.itemTemplateId}:${item.renderText}`;
  if (metricCache.has(key)) return metricCache.get(key);
  const T = ITEM_TEMPLATES[item.itemTemplateId];
  if (T.shape) {
    const m = { [T.shape]: true, v: 0, w: T.w, h: T.h, d: T.d, bodyD: T.d, face: wrapCard(item.renderText, T.shape === 'orb' ? 'glow' : 'etch') };
    m.truncated = m.face.truncated; metricCache.set(key, m); return m;
  }
  if (T.style) {
    const [front, ...rest] = CARD_STYLES[T.style].blankBack || T.style === 'wood' ? [item.renderText] : item.renderText.split('|');
    const m = { card: true, style: T.style, v: 0, w: T.w, h: T.h, d: T.d, bodyD: T.d, front: front.trim(), back: rest.join('|').trim(), faces: null };
    m.faces = { front: wrapCard(m.front, T.style), back: wrapCard(T.style === 'wood' || CARD_STYLES[T.style].blankBack ? '' : m.back || '↺', T.style) };
    m.truncated = m.faces.front.truncated || m.faces.back.truncated;
    metricCache.set(key, m);
    return m;
  }
  const lay = layoutText(item.renderText);
  const v = Math.min(T.maxVoxel, T.fitWidth / lay.W);
  const m = {
    lay, v, pad: T.pad, layers: T.layers,
    w: lay.W * v + 2 * T.pad, h: lay.H * v + 2 * T.pad, bodyD: T.bodyDepth, d: T.bodyDepth + T.layers * v,
  };
  metricCache.set(key, m);
  return m;
}
const footprint = (item) => {
  const m = metrics(item);
  return item.rot % 2 ? { w: m.d, h: m.h, d: m.w } : { w: m.w, h: m.h, d: m.d };
};
const fits = (item, slot) => {
  const f = footprint(item);
  return f.w <= slot.size[0] + 1e-6 && f.h <= slot.size[1] && f.d <= slot.size[2] && slot.allowedItemTags.some((t) => ITEM_TEMPLATES[item.itemTemplateId].tags.includes(t));
};

/* ───────────── Display / slot queries (derived, never stored twice) ───────────── */
function allSlots() {
  const out = [];
  for (const d of Object.values(state.displays)) {
    for (const s of DISPLAY_TEMPLATES[d.templateId].slots()) {
      out.push({ ...s, displayId: d.id, world: new THREE.Vector3(d.x + s.local[0], s.local[1], d.z + s.local[2]) });
    }
  }
  return out;
}
const occupant = (displayId, slotId) => Object.values(state.placements).find((p) => p.displayId === displayId && p.slotId === slotId)?.itemId;

function addDisplay(templateId) {
  const last = Object.values(state.displays).sort((a, b) => a.x - b.x).pop();
  const pitch = DISPLAY_TEMPLATES[templateId].pitch;
  const x = last ? last.x + (DISPLAY_TEMPLATES[last.templateId].pitch + pitch) / 2 : 0;
  const id = nid('display');
  state.displays[id] = { id, templateId, x, z: 0 };
  return id;
}
const displayFor = (item) => ITEM_TEMPLATES[item.itemTemplateId].display || CRAFT_KITS[item.craftTemplateId].recommendedDisplayTemplateIds[0];
// Suggest: prefer eye-level (middle) shelf, then others; add a shelf when nothing fits.
function suggestSlot(item, createIfNeeded = false) {
  const free = allSlots().filter((s) => !occupant(s.displayId, s.id) && fits(item, s));
  const best = free.sort((a, b) => Math.abs(a.level - 2) - Math.abs(b.level - 2) || a.world.x - b.world.x)[0];
  if (best) return best;
  if (!createIfNeeded) return null;
  const did = addDisplay(displayFor(item));
  return allSlots().find((s) => s.displayId === did && fits(item, s));
}

/* ───────────── Mutations (each checkpoints for undo, saves, resyncs) ───────────── */
function createItem(text, kit = 'voxel-foundry', tpl = CRAFT_KITS[kit].itemTemplateIds[0]) {
  const cid = nid('content'); state.contents[cid] = { id: cid, type: 'text', text };
  const iid = nid('item');
  state.items[iid] = {
    id: iid, contentId: cid, craftTemplateId: kit, itemTemplateId: tpl,
    style: { material: CRAFT_KITS[kit].materialSet[0] }, renderText: text, rot: 0, schemaVersion: SCHEMA,
  };
  state.tray.push(iid);
  return iid;
}
function place(itemId, slot) {
  state.tray = state.tray.filter((i) => i !== itemId);
  state.placements[itemId] = { itemId, displayId: slot.displayId, slotId: slot.id };
}
function unplace(itemId) {
  if (state.placements[itemId]) { delete state.placements[itemId]; state.tray.push(itemId); }
}
function commit() { save(); sync(); refreshUI(); }

/* ───────────── Three.js scene ───────────── */
const canvas = document.createElement('canvas'); document.body.prepend(canvas);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfe6f5); scene.fog = new THREE.Fog(0xcfe6f5, 40, 90);
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 4; controls.maxDistance = 90;
scene.add(new THREE.HemisphereLight(0xffffff, 0xb59a70, 2.4));
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2); sun.position.set(-6, 14, 12); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -30, right: 40, top: 12, bottom: -8, near: 1, far: 50 });
sun.shadow.mapSize.set(4096, 4096); scene.add(sun, sun.target);

const mat = {
  stone: new THREE.MeshStandardMaterial({ color: 0x8d8f91, roughness: 1 }),
  plinth: new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 0.7 }),
  herb: new THREE.MeshStandardMaterial({ color: 0x8a7a55, roughness: 1 }),
  priceStrip: new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.6 }),
  backlight: new THREE.MeshBasicMaterial({ color: 0x1c2a44 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.16, roughness: 0.05, depthWrite: false }),
  wall: new THREE.MeshStandardMaterial({ color: 0xd9c7a3, roughness: 1 }),
  shelf: new THREE.MeshStandardMaterial({ color: 0x7a4e2b, roughness: 0.9 }),
  shelfDark: new THREE.MeshStandardMaterial({ color: 0x4f321b, roughness: 0.95 }),
  oak: new THREE.MeshStandardMaterial({ color: 0xc89b5c, roughness: 0.85 }),
  ink: new THREE.MeshStandardMaterial({ color: 0x3a2312, roughness: 0.8 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x8a949c, roughness: 0.4, metalness: 0.6 }),
  nozzle: new THREE.MeshStandardMaterial({ color: 0xf08a24, emissive: 0x552200 }),
};
const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 60), new THREE.MeshStandardMaterial({ color: 0x8fbf72, roughness: 1 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

// Foundry (static set dressing + animated nozzle)
{
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  add(new THREE.BoxGeometry(5.4, 0.3, 7), mat.metal, FOUNDRY.x, 0.15, FOUNDRY.z);
  add(new THREE.BoxGeometry(0.25, 4.2, 0.25), mat.metal, FOUNDRY.x - 2.9, 2.1, -3.4);
  add(new THREE.BoxGeometry(0.25, 4.2, 0.25), mat.metal, FOUNDRY.x - 2.9, 2.1, 3.4);
  add(new THREE.BoxGeometry(0.25, 0.25, 7), mat.metal, FOUNDRY.x - 2.9, 4.2, 0);
  scene.add(g);
}
const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.16), mat.nozzle); nozzle.visible = false; scene.add(nozzle);

// Premium-material fallback: refraction is costly, so phones / ?lowfx=1 get simple alpha glass.
const LOW_FX = /iPhone|iPad|Android/.test(navigator.userAgent) || new URLSearchParams(location.search).has('lowfx');
const orbGeo = new THREE.SphereGeometry(0.43, 32, 24);
mat.orbHigh = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 1, thickness: 0.6, ior: 1.45, roughness: 0.03, transparent: true });
mat.orbLow = new THREE.MeshStandardMaterial({ color: 0xcfe9f5, transparent: true, opacity: 0.28, roughness: 0.05, depthWrite: false });
mat.crystalHigh = new THREE.MeshPhysicalMaterial({ color: 0xd6efff, transmission: 0.95, thickness: 0.4, ior: 1.5, roughness: 0.02, transparent: true });
mat.crystalLow = new THREE.MeshStandardMaterial({ color: 0xbfe3f7, transparent: true, opacity: 0.35, roughness: 0.05, depthWrite: false });
const displayGroups = new Map();
const itemGroups = new Map(); // itemId -> {group, sig, instMesh, body, outline, target:{pos,rotY}}
const slotMarkers = new THREE.Group(); slotMarkers.visible = false; scene.add(slotMarkers);
const ghost = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.35, depthWrite: false }));
ghost.visible = false; scene.add(ghost);

const hashStr = (str) => { let h = 2166136261; for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rng = (seed) => () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const labelPlane = (m, w, h) => {
  const map = m.face.tex.clone(); map.needsUpdate = true;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
};
// Glaze / liquid / terrain are derived from the text, so the same text always gives the same object.
function buildProp(item, m, group) {
  const hue = (hashStr(item.renderText) % 360) / 360; let tick;
  if (m.vase) {
    const pts = [[0, 0], [0.28, 0], [0.38, 0.2], [0.42, 0.5], [0.36, 0.85], [0.2, 1.05], [0.22, 1.25], [0.3, 1.3]].map(([x, y]) => new THREE.Vector2(x, y));
    const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.5, 0.4), roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide }));
    vase.castShadow = true; const label = labelPlane(m, 0.56, 0.28); label.position.set(0, 0.6, 0.43); group.add(vase, label);
    return finishProp(group, item, m, vase, tick);
  }
  if (m.tube) {
    const cap = (y) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 24), mat.metal); c.position.y = y; c.castShadow = true; return c; };
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.2, 28, 1, true), LOW_FX ? mat.crystalLow : mat.crystalHigh); glass.position.y = 0.7;
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.8, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(hue, 0.7, 0.55), emissive: new THREE.Color().setHSL(hue, 0.8, 0.25), roughness: 0.2 }));
    liquid.position.y = 0.5;
    const label = labelPlane(m, 0.8, 0.4); label.rotation.z = Math.PI / 2; label.position.set(0, 0.7, 0.23);
    group.add(cap(0.05), cap(1.35), liquid, glass, label);
    tick = (t) => { liquid.scale.y = 1 + 0.03 * Math.sin(t / 500); liquid.position.y = 0.1 + 0.4 * liquid.scale.y; };
    return finishProp(group, item, m, glass, tick);
  }
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.14, 1.3), mat.shelfDark); base.position.y = 0.07; base.castShadow = true;
  const cube = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), LOW_FX ? mat.crystalLow : mat.crystalHigh); cube.position.y = 0.74;
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(cube.geometry), new THREE.LineBasicMaterial({ color: 0xffffff })); wire.position.copy(cube.position);
  const N = 8, u = 0.09, r = rng(hashStr(item.renderText)); const a = r() * 6, b = r() * 6;
  const terrain = new THREE.InstancedMesh(new THREE.BoxGeometry(u, 1, u), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), N * N);
  const d = new THREE.Object3D(); const col = new THREE.Color(); let i = 0;
  for (let x = 0; x < N; x++) for (let z = 0; z < N; z++) {
    const h = Math.max(1, Math.floor(1 + 4.5 * (0.5 + 0.5 * Math.sin(x * 0.8 + a) * Math.cos(z * 0.7 + b)) + r() * 0.9));
    d.position.set((x - (N - 1) / 2) * u, (h * 0.07) / 2, (z - (N - 1) / 2) * u); d.scale.set(1, h * 0.07, 1); d.updateMatrix();
    terrain.setMatrixAt(i, d.matrix); terrain.setColorAt(i, col.set(h <= 2 ? 0x3f7fbf : h <= 4 ? 0x5fa84a : h === 5 ? 0x8d8f91 : 0xf4f4f4)); i++;
  }
  const spin = new THREE.Group(); spin.position.y = 0.2; spin.add(terrain);
  const label = labelPlane(m, 0.9, 0.45); label.position.set(0, 1.1, 0.62);
  group.add(base, spin, cube, wire, label);
  tick = (t) => { spin.rotation.y = t / 3500; };
  return finishProp(group, item, m, base, tick);
}
function finishProp(group, item, m, body, tick) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 0.08, m.h + 0.08, m.d + 0.08)), new THREE.LineBasicMaterial({ color: 0x1e88e5 }));
  edges.position.y = m.h / 2; edges.visible = false; group.add(edges); scene.add(group);
  return { group, sig: item.itemTemplateId + item.renderText, inst: null, body, outline: edges, locals: [], target: { pos: new THREE.Vector3(), rotY: 0 }, fresh: true, tick };
}

function buildItem(item) {
  const m = metrics(item); const group = new THREE.Group(); group.userData.itemId = item.id;
  if (m.vase || m.tube || m.cube) return buildProp(item, m, group);
  if (m.crystal) {
    const shape = new THREE.Shape(); [[-0.4, 0], [0.4, 0], [0.4, 1.0], [0.2, 1.25], [-0.2, 1.25], [-0.4, 1.0]].forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 }); geo.translate(0, 0, -0.1);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.4), mat.shelfDark); base.position.y = 0.07; base.castShadow = true;
    const gem = new THREE.Mesh(geo, LOW_FX ? mat.crystalLow : mat.crystalHigh); gem.position.y = 0.14;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.33), new THREE.MeshBasicMaterial({ map: m.face.tex.clone(), transparent: true, depthWrite: false }));
    label.material.map.needsUpdate = true; label.position.set(0, 0.14 + 0.62, 0.14);
    group.add(base, gem, label);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 0.08, m.h + 0.08, m.d + 0.08)), new THREE.LineBasicMaterial({ color: 0x1e88e5 }));
    edges.position.y = m.h / 2; edges.visible = false; group.add(edges); scene.add(group);
    return { group, sig: item.itemTemplateId + item.renderText, inst: null, body: base, outline: edges, locals: [], target: { pos: new THREE.Vector3(), rotY: 0 }, fresh: true };
  }
  if (m.orb) {
    const g1 = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.14, 24), mat.shelfDark); base.position.y = 0.07; base.castShadow = true;
    const glassMat = LOW_FX ? mat.orbLow : mat.orbHigh;
    const ball = new THREE.Mesh(orbGeo, glassMat); ball.position.y = 0.14 + 0.43;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: m.face.tex.clone(), transparent: true, depthWrite: false, depthTest: false }));
    label.material.map.needsUpdate = true; label.scale.set(0.7, 0.35, 1); label.position.copy(ball.position); label.renderOrder = 5;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffc766 })); core.position.copy(ball.position).add(new THREE.Vector3(0, -0.2, 0));
    group.add(base, core, ball, label);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 0.08, m.h + 0.08, m.d + 0.08)), new THREE.LineBasicMaterial({ color: 0x1e88e5 }));
    edges.position.y = m.h / 2; edges.visible = false; group.add(edges); scene.add(group);
    return { group, sig: item.itemTemplateId + item.renderText, inst: null, body: base, outline: edges, locals: [], target: { pos: new THREE.Vector3(), rotY: 0 }, fresh: true, tick: (t) => core.scale.setScalar(1 + 0.15 * Math.sin(t / 400)) };
  }
  if (m.card) {
    const side = new THREE.MeshStandardMaterial({ color: m.style === 'wood' ? 0x8a5a2e : CARD_STYLES[m.style].side || 0xe8dcc0 });
    const face = (t) => new THREE.MeshStandardMaterial({ map: t.tex, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(m.w, m.h, m.d), [side, side, side, side, face(m.faces.front), face(m.faces.back)]);
    body.position.y = m.h / 2; body.castShadow = body.receiveShadow = true; group.add(body);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 0.08, m.h + 0.08, m.d + 0.08)), new THREE.LineBasicMaterial({ color: 0x1e88e5 }));
    edges.position.y = m.h / 2; edges.visible = false; group.add(edges); scene.add(group);
    return { group, sig: item.itemTemplateId + item.renderText, inst: null, body, outline: edges, locals: [], target: { pos: new THREE.Vector3(), rotY: 0 }, fresh: true };
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(m.w, m.h, m.bodyD), mat.oak);
  body.position.y = m.h / 2; body.castShadow = body.receiveShadow = true; group.add(body);
  const vox = m.lay.voxels;
  const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(m.v, m.v, m.v), mat.ink, vox.length * m.layers);
  const dummy = new THREE.Object3D(); const col = new THREE.Color(); let i = 0;
  const order = vox.slice().sort((a, b) => a.y - b.y || a.x - b.x); // bottom-up print order, per layer
  const locals = [];
  for (let l = 0; l < m.layers; l++) {
    for (const p of order) {
      dummy.position.set((p.x + 0.5) * m.v - (m.lay.W * m.v) / 2, m.pad + (p.y + 0.5) * m.v, m.bodyD / 2 + (l + 0.5) * m.v);
      dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
      col.setScalar(0.85 + Math.random() * 0.3); inst.setColorAt(i, col);
      locals.push(dummy.position.clone()); i++;
    }
  }
  inst.castShadow = true; group.add(inst);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(m.w + 0.08, m.h + 0.08, m.d + 0.08)), new THREE.LineBasicMaterial({ color: 0x1e88e5 }));
  edges.position.set(0, m.h / 2, m.v); edges.visible = false; group.add(edges);
  scene.add(group);
  return { group, sig: item.itemTemplateId + item.renderText, inst, body, outline: edges, locals, target: { pos: new THREE.Vector3(), rotY: 0 }, fresh: true };
}

function trayPos(idx) {
  return new THREE.Vector3(FOUNDRY.x, FOUNDRY.top + Math.floor(idx / 6) * 0.9, -2.4 + (idx % 6) * 0.95);
}

let selected = null;
let dragging = null;
let anim = null;

function sync() {
  for (const d of Object.values(state.displays)) {
    if (displayGroups.has(d.id)) continue;
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z); DISPLAY_TEMPLATES[d.templateId].build(g, mat); scene.add(g); displayGroups.set(d.id, g);
  }
  const xs = Object.values(state.displays).map((d) => d.x); const lo = Math.min(FOUNDRY.x, ...xs) - 8, hi = Math.max(0, ...xs) + 8;
  floor.position.x = (lo + hi) / 2;
  sun.target.position.set((lo + hi) / 2, 0, 0); sun.position.set((lo + hi) / 2 - 6, 14, 12);
  Object.assign(sun.shadow.camera, { left: -(hi - lo) / 2, right: (hi - lo) / 2 });
  sun.shadow.camera.updateProjectionMatrix();
  slotMarkers.clear();
  for (const s of allSlots()) {
    const mk = new THREE.Mesh(new THREE.PlaneGeometry(s.size[0] - 0.1, s.size[2] - 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false }));
    mk.rotation.x = -Math.PI / 2; mk.position.copy(s.world).setY(s.world.y + 0.01); slotMarkers.add(mk);
  }
  for (const [id, rec] of itemGroups) {
    if (!state.items[id]) { scene.remove(rec.group); itemGroups.delete(id); if (selected === id) selected = null; }
  }
  const slots = new Map(allSlots().map((s) => [`${s.displayId}/${s.id}`, s]));
  for (const item of Object.values(state.items)) {
    let rec = itemGroups.get(item.id);
    if (rec && rec.sig !== item.itemTemplateId + item.renderText) { scene.remove(rec.group); rec = null; }
    if (!rec) { rec = buildItem(item); itemGroups.set(item.id, rec); }
    const pl = state.placements[item.id];
    if (pl) rec.target.pos.copy(slots.get(`${pl.displayId}/${pl.slotId}`).world);
    else rec.target.pos.copy(trayPos(state.tray.indexOf(item.id)));
    rec.target.rotY = item.rot * Math.PI / 2;
    if (rec.fresh) { rec.group.position.copy(rec.target.pos); rec.group.rotation.y = rec.target.rotY; rec.fresh = false; }
    rec.outline.visible = selected === item.id;
  }
}

/* ───────────── Craft + animation ───────────── */
function craft() {
  const raw = $('text').value;
  if (!raw.trim()) return setStatus('Type some text first.', true);
  checkpoint();
  const texts = $('bulk').checked ? raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : [raw.trim()];
  const [kit, tpl] = $('kit').value.split(':'); const ids = texts.map((t) => createItem(t, kit, tpl));
  const notes = [];
  let added = false;
  for (const id of ids) {
    const tid = displayFor(state.items[id]);
    if (!Object.values(state.displays).some((d) => d.templateId === tid)) { addDisplay(tid); added = true; }
  }
  if (added) { sync(); fitView(); }
  if (texts.length > 1 || state.tray.length > 6) {
    ids.forEach((id) => place(id, suggestSlot(state.items[id], true)));
    sync(); fitView();
  }
  for (const id of ids) {
    const m = metrics(state.items[id]);
    if (m.lay?.truncated || m.truncated) notes.push(`"${state.contents[state.items[id].contentId].text.slice(0, 20)}…" is too long for the block face — full text is kept in Read mode.`);
    if (m.lay?.approximated) notes.push('Some characters were approximated on the block; the original text is unchanged.');
  }
  commit();
  if (ids.length === 1 && !state.placements[ids[0]] && !$('instant').checked) {
    if (kit === 'voxel-foundry') startAnim(ids[0]); else if (kit === 'stone-atelier') chipBurst(itemGroups.get(ids[0]).group.position);
    else if (kit === 'woodcraft') chipBurst(itemGroups.get(ids[0]).group.position, mat.oak);
    else if (kit === 'letterpress') itemGroups.get(ids[0]).group.position.y += 1.6; // press: the card drops onto the tray
  }
  select(ids[ids.length - 1]);
  setStatus(`Crafted ${ids.length} ${TEMPLATE_LABEL[state.items[ids[0]].itemTemplateId]}${ids.length > 1 ? 's' : ''}.` + (notes.length ? '\n' + [...new Set(notes)].join('\n') : ''), notes.length > 0);
  updateSuggestion();
}
// Stone Atelier feedback: debris flies off where the chisel strikes.
const chips = [];
function chipBurst(at, material = mat.stone) {
  for (let i = 0; i < 28; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), material);
    c.position.set(at.x + (Math.random() - 0.5) * 1.0, at.y + 0.6 + Math.random() * 0.8, at.z + 0.2);
    c.userData = { v: new THREE.Vector3((Math.random() - 0.5) * 2.5, Math.random() * 2.5, Math.random() * 2), life: 1.1 };
    scene.add(c); chips.push(c);
  }
}
function stepChips(dt) {
  for (let i = chips.length - 1; i >= 0; i--) {
    const c = chips[i]; c.userData.v.y -= 9 * dt; c.position.addScaledVector(c.userData.v, dt); c.rotation.x += dt * 8;
    if (c.position.y < 0.05) { c.position.y = 0.05; c.userData.v.set(0, 0, 0); }
    if ((c.userData.life -= dt) <= 0) { scene.remove(c); c.geometry.dispose(); chips.splice(i, 1); }
  }
}
function startAnim(itemId) {
  const rec = itemGroups.get(itemId); const total = rec.inst.count;
  anim = { itemId, t0: performance.now(), dur: 900 + total * 6, total };
  rec.inst.count = 0; rec.body.scale.y = 0.001; rec.body.position.y = 0.001;
  $('make').textContent = 'Skip animation'; nozzle.visible = true;
}
function stepAnim(now) {
  if (!anim) return;
  const rec = itemGroups.get(anim.itemId);
  if (!rec) return endAnim();
  const f = Math.min(1, (now - anim.t0) / anim.dur); const m = metrics(state.items[anim.itemId]);
  const bodyF = Math.min(1, f / 0.2); const voxF = Math.max(0, (f - 0.2) / 0.8);
  rec.body.scale.y = Math.max(0.001, bodyF); rec.body.position.y = (m.h * bodyF) / 2;
  const n = Math.floor(voxF * anim.total); rec.inst.count = n;
  const p = n > 0 ? rec.locals[n - 1] : new THREE.Vector3(0, m.h, 0);
  nozzle.position.copy(rec.group.position).add(p).add(new THREE.Vector3(0, 0.3, 0));
  if (f >= 1) endAnim();
}
function endAnim() {
  const rec = anim && itemGroups.get(anim.itemId);
  if (rec) { rec.inst.count = rec.locals.length; rec.body.scale.y = 1; rec.body.position.y = metrics(state.items[anim.itemId]).h / 2; }
  anim = null; nozzle.visible = false; $('make').textContent = 'Craft';
}

/* ───────────── Interaction ───────────── */
const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2();
const LIFT_Z = 1.5; const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -LIFT_Z);
function setNdc(e) { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
function pickItem(e) {
  setNdc(e);
  const hit = ray.intersectObjects([...itemGroups.values()].map((r) => r.group), true)[0];
  let o = hit?.object; while (o && !o.userData.itemId) o = o.parent;
  return o?.userData.itemId;
}
function select(id) { selected = id; for (const [k, r] of itemGroups) r.outline.visible = k === id; refreshUI(); }

canvas.addEventListener('pointerdown', (e) => {
  if (anim) endAnim();
  const id = pickItem(e);
  if (!id) { select(null); return; }
  select(id); controls.enabled = false; canvas.setPointerCapture(e.pointerId);
  const rec = itemGroups.get(id);
  dragging = { id, rec, off: new THREE.Vector3(0, -metrics(state.items[id]).h / 2, 0), moved: false, sx: e.clientX, sy: e.clientY, cand: null };
  slotMarkers.visible = true;
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  if (!dragging.moved && Math.hypot(e.clientX - dragging.sx, e.clientY - dragging.sy) < 5) return;
  dragging.moved = true; setNdc(e);
  const hit = new THREE.Vector3(); if (!ray.ray.intersectPlane(dragPlane, hit)) return;
  const p = hit.add(dragging.off); p.y = Math.max(FOUNDRY.top, p.y); p.z = LIFT_Z;
  dragging.rec.group.position.copy(p); dragging.rec.target.pos.copy(p);
  const item = state.items[dragging.id]; const f = footprint(item);
  let best = null, bd = Infinity;
  for (const s of allSlots()) {
    const d = Math.hypot(p.x - s.world.x, p.y - s.world.y);
    if (d < s.snapRadius && d < bd) { best = s; bd = d; }
  }
  dragging.cand = null;
  if (best) {
    const ok = fits(item, best) && (!occupant(best.displayId, best.id) || occupant(best.displayId, best.id) === item.id);
    dragging.cand = { slot: best, ok };
    ghost.visible = true; ghost.scale.set(f.w, f.h, f.d); ghost.position.set(best.world.x, best.world.y + f.h / 2, best.world.z);
    ghost.material.color.set(ok ? 0x2e9e4f : 0xd32f2f);
  } else ghost.visible = false;
});
const endDrag = (e) => {
  if (!dragging) return;
  const { id, moved, cand, rec } = dragging; dragging = null; controls.enabled = true;
  slotMarkers.visible = false; ghost.visible = false;
  if (!moved) { sync(); return; }
  const p = rec.group.position;
  if (cand?.ok) {
    checkpoint(); place(id, cand.slot); commit(); setStatus(`Placed on ${DISPLAY_TEMPLATES[state.displays[cand.slot.displayId].templateId].label} · level ${cand.slot.level}, slot ${cand.slot.id}.`);
  } else if (cand && !cand.ok) {
    sync(); setStatus(occupant(cand.slot.displayId, cand.slot.id) ? 'That slot is occupied.' : 'This block does not fit that slot.', true);
  } else if (p.x < FOUNDRY.x + 3 && state.placements[id]) {
    checkpoint(); unplace(id); commit(); setStatus('Returned to the foundry tray.');
  } else { sync(); setStatus('No slot nearby — block returned.', true); }
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('dblclick', (e) => { const id = pickItem(e); if (id) openRead(id); });

function rotateSel(turns) {
  const item = state.items[selected]; if (!item) return;
  if (metrics(item).card && turns % 2) return setStatus('Cards and plaques only turn front/back — use Flip.', true);
  const old = item.rot; item.rot = (old + turns) % 4;
  const pl = state.placements[item.id];
  if (pl) {
    const slot = allSlots().find((s) => s.displayId === pl.displayId && s.id === pl.slotId);
    if (!fits(item, slot)) { item.rot = old; return setStatus('Rotating that way would not fit the shelf slot (blocks must face front or back).', true); }
  }
  item.rot = old; checkpoint(); item.rot = (old + turns) % 4; commit();
}
$('rot').onclick = () => rotateSel(1);
$('flip').onclick = () => rotateSel(2);
$('open').onclick = () => selected && openRead(selected);
$('del').onclick = () => {
  const item = state.items[selected]; if (!item) return;
  checkpoint(); delete state.items[item.id]; delete state.placements[item.id]; state.tray = state.tray.filter((i) => i !== item.id);
  // Content is independent of Item: keep it if anything else references it, otherwise it stays as an orphan for restore/reuse.
  selected = null; commit(); setStatus('Block deleted (Undo restores it).');
};
$('make').onclick = () => (anim ? endAnim() : craft());
$('auto').onclick = () => {
  const item = state.items[selected]; if (!item) return setStatus('Select a block first.', true);
  checkpoint(); place(item.id, suggestSlot(item, true)); commit(); fitView(); setStatus('Placed on the suggested slot.');
};
function restore(json) { state = JSON.parse(json); metricCache.clear(); for (const r of itemGroups.values()) scene.remove(r.group); itemGroups.clear(); for (const g of displayGroups.values()) scene.remove(g); displayGroups.clear(); if (!state.items[selected]) selected = null; save(); sync(); refreshUI(); }
$('undo').onclick = () => { if (!undoStack.length) return; redoStack.push(JSON.stringify(state)); restore(undoStack.pop()); };
$('redo').onclick = () => { if (!redoStack.length) return; undoStack.push(JSON.stringify(state)); restore(redoStack.pop()); };
$('reset').onclick = () => { if (confirm('Delete everything in this world?')) { checkpoint(); restore(JSON.stringify(fresh())); addInitial(); commit(); } };
addEventListener('keydown', (e) => {
  if (/TEXTAREA|INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'r' || e.key === 'R') rotateSel(1);
  if (e.key === 'Delete' || e.key === 'Backspace') $('del').click();
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); (e.shiftKey ? $('redo') : $('undo')).click(); }
});

/* Read mode: real, selectable, editable text — independent from the 3D block */
let reading = null;
function openRead(id) {
  const item = state.items[id]; if (!item) return;
  reading = id; $('readText').value = state.contents[item.contentId].text; $('readId').textContent = `${item.contentId} · ${item.id}`;
  $('readSync').checked = true; $('read').style.display = 'flex';
}
$('readClose').onclick = () => { $('read').style.display = 'none'; reading = null; };
$('readSave').onclick = () => {
  const item = state.items[reading]; const text = $('readText').value; if (!item || !text.trim()) return;
  checkpoint(); state.contents[item.contentId].text = text;
  if ($('readSync').checked) {
    item.renderText = text;
    const pl = state.placements[item.id];
    if (pl) { const s = allSlots().find((x) => x.displayId === pl.displayId && x.id === pl.slotId); if (!fits(item, s)) { unplace(item.id); setStatus('Updated block no longer fits its slot — moved to the tray.', true); } }
  }
  $('readClose').click(); commit();
};

/* ───────────── UI helpers ───────────── */
function $(id) { return document.getElementById(id); }
function setStatus(msg, warn) { const s = $('status'); s.textContent = msg; s.classList.toggle('warn', !!warn); }
function updateSuggestion() {
  const item = state.items[selected]; const el = $('suggest');
  if (!item) { el.textContent = ''; return; }
  const s = suggestSlot(item); const m = metrics(item);
  el.textContent = `Suggested: ${DISPLAY_TEMPLATES[s ? state.displays[s.displayId].templateId : displayFor(item)].label} · ${s ? `level ${s.level}, slot ${s.id}` : 'new shelf (all slots full)'} — ${m.w.toFixed(2)}×${m.h.toFixed(2)} fits.`;
}
function refreshUI() {
  const has = !!state.items[selected];
  ['rot', 'flip', 'open', 'del'].forEach((b) => ($(b).disabled = !has));
  $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length;
  updateSuggestion();
}
function fitView() {
  const xs = Object.values(state.displays).map((d) => d.x);
  const cx = (FOUNDRY.x + Math.max(0, ...xs)) / 2;
  const span = Math.max(...xs, 0) - FOUNDRY.x + 8;
  controls.target.set(cx, 2.4, 0); camera.position.set(cx, 4.5, Math.max(15, span * 0.85));
}
function addInitial() { if (!Object.keys(state.displays).length) { addDisplay('smart-shelf'); addDisplay('wall-display'); addDisplay('plaque-wall'); addDisplay('glass-cabinet'); addDisplay('stone-pedestal'); } }

function resize() { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

/* ───────────── Boot ───────────── */
const loaded = load();
if (loaded) state = loaded;
addInitial();
sync();
if (camState) { camera.position.fromArray(camState.p); controls.target.fromArray(camState.t); } else fitView();
controls.addEventListener('end', () => { camState = { p: camera.position.toArray(), t: controls.target.toArray() }; save(); });
save(); refreshUI();
setStatus(loaded ? 'Restored saved world.' : 'Type DISCOVER and press Craft, then drag the block onto the shelf (try level 2).');

// Hand-off from the host app: ?kit=glassworks:memory-orb&items=one%0Atwo (one item per line, auto-placed).
{
  const q = new URLSearchParams(location.search); let lines = (q.get('items') || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  let handoff = null;
  try { handoff = JSON.parse(localStorage.getItem('minest3d.handoff') || 'null'); localStorage.removeItem('minest3d.handoff'); } catch (e) { /* ignore bad hand-off */ }
  if (handoff && Array.isArray(handoff.items)) { lines = handoff.items.map((x) => String(x).trim()).filter(Boolean); if (handoff.kit) q.set('kit', handoff.kit); }
  const have = new Set(Object.values(state.items).map((i) => i.itemTemplateId + '\n' + i.renderText));
  const kitTpl = (q.get('kit') && CRAFT_KITS[q.get('kit').split(':')[0]] ? q.get('kit') : 'voxel-foundry').split(':');
  lines = lines.filter((t) => !have.has((ITEM_TEMPLATES[kitTpl[1] || CRAFT_KITS[kitTpl[0]].itemTemplateIds[0]].id) + '\n' + t));
  if (lines.length) {
    const [kit, tpl] = (q.get('kit') && CRAFT_KITS[q.get('kit').split(':')[0]] ? q.get('kit') : 'voxel-foundry').split(':');
    checkpoint(); const ids = lines.map((t) => createItem(t, kit, tpl));
    ids.forEach((id) => { const tid = displayFor(state.items[id]); if (!Object.values(state.displays).some((d) => d.templateId === tid)) addDisplay(tid); });
    ids.forEach((id) => place(id, suggestSlot(state.items[id], true)));
    sync(); fitView(); commit(); setStatus(`Imported ${ids.length} item(s) from the host app.`);
    history.replaceState(null, '', location.pathname);
  }
}

let last = performance.now();
renderer.setAnimationLoop(() => {
  const now = performance.now(); const dt = Math.min((now - last) / 1000, 0.05); last = now; const k = 1 - Math.pow(0.0005, dt);
  stepAnim(now);
  for (const [id, r] of itemGroups) {
    if (dragging?.id === id && dragging.moved) { r.group.rotation.y += (r.target.rotY - r.group.rotation.y) * k; continue; }
    r.group.position.lerp(r.target.pos, k); r.group.rotation.y += (r.target.rotY - r.group.rotation.y) * k;
  }
  stepChips(dt);
  for (const r of itemGroups.values()) r.tick?.(now);
  controls.update(); renderer.render(scene, camera); perfTick(now);
});

$('export').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' }));
  a.download = 'minest3d-world.json'; a.click(); setStatus('World exported — import it on another device to sync.');
};
$('import').onchange = async (e) => {
  try {
    const raw = JSON.parse(await e.target.files[0].text());
    if (raw.schemaVersion !== SCHEMA || !raw.items || !raw.displays) throw new Error('not a Minest 3D world');
    checkpoint(); restore(JSON.stringify(raw)); fitView(); setStatus('World imported (Undo restores the previous one).');
  } catch (err) { setStatus(`Import failed: ${err.message}`, true); }
  e.target.value = '';
};
const perf = { fps: 0 }; let fN = 0, fT = performance.now();
const perfTick = (now) => { fN++; if (now - fT >= 1000) { perf.fps = fN * 1000 / (now - fT); fN = 0; fT = now; } };
window.__app = { perf, renderer, controls, get state() { return state; }, itemGroups, camera, metrics, allSlots, place, commit, checkpoint, suggestSlot, createItem };
