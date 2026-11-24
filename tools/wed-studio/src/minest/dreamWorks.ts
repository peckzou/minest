// Minest · WED 工作坊 ⇄ Imagineer 4.0 (梦工坊 dream-workshop/).
// The studio only reads the dream works Imagineer 4.0 saved ('sh:dw:work:<id>' in Minest's home store, the same keys
// dw-app.js writes); it never changes them. A work goes onto the model table as voxels, and from there back to the
// workshop (edit / play) or into the Disney park (theme-park-island), the same way dw-app.js sends it there.
import type { CustomVoxelBlock, VoxelBrushType } from '../types/studio';

export interface DreamWork {
  id: string;
  title?: string;
  updated?: number;
  created?: number;
  deleted?: boolean;
  shelf?: boolean;
  objects?: { id: string; kind: string; name?: string; x: number; z: number; y?: number; s?: number; color?: string }[];
}

const PFX = 'sh:dw:work:';
// paths from dream-workshop/wed-studio/index.html
export const WORKSHOP = '../index.html';
export const PARK = '../../theme-park-island/theme-park.html';

type Store = { get(k: string): any; keys(p: string): string[]; onChange?(fn: () => void): void };
const store = (): Store | null => ((window as any).MinestHomeStore as Store) || null;

function lsWorks(): DreamWork[] {
  const out: DreamWork[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      if (k.indexOf(PFX) === 0) out.push(JSON.parse(localStorage.getItem(k) || 'null'));
    }
  } catch (e) { /* storage blocked */ }
  return out;
}

export function readWorks(): DreamWork[] {
  const S = store();
  let list: DreamWork[] = [];
  try { list = S ? S.keys(PFX).map((k) => S.get(k)) : lsWorks(); } catch (e) { list = lsWorks(); }
  return list.filter((w) => w && w.id && !w.deleted).sort((a, b) => (b.updated || 0) - (a.updated || 0));
}

export function onWorksChange(fn: () => void): void {
  const S = store();
  try { if (S && S.onChange) S.onChange(fn); } catch (e) { /* ignore */ }
  window.addEventListener('storage', fn);
}

// ------------------------------------------------------------------ a work as voxels on the model table
// Imagineer's table is a disc of radius 16; the studio table grid is ±22 × ±15 cells.
const TALL = /castle|tower|rocket|ferris|palace|城堡|塔|火箭|摩天轮|宫/i;
const MID = /princess|wizard|astronaut|robot|dino|unicorn|lincoln|character|tree|carousel|公主|魔法师|宇航员|机器人|恐龙|独角兽|树|木马/i;
const LOW = /stage|plaza|water|lake|river|path|bridge|rainbow|舞台|水|湖|河|路|桥|彩虹/i;
const PALETTE = [0xf4acb7, 0x2563eb, 0xf59e0b, 0x16a34a, 0x0ea5e9, 0xdc2626, 0xa855f7, 0xf97316];
const BRUSHES: Exclude<VoxelBrushType, 'erase'>[] = ['castle-pink', 'royal-blue', 'gold-spire', 'emerald-tree', 'water-moat', 'red-brick'];

function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function colorOf(o: { kind: string; color?: string }): number {
  if (o.color && /^#[0-9a-f]{6}$/i.test(o.color)) return parseInt(o.color.slice(1), 16);
  return PALETTE[hash(o.kind) % PALETTE.length];
}
function heightOf(o: { kind: string; name?: string; s?: number }): number {
  const t = o.kind + ' ' + (o.name || '');
  const base = TALL.test(t) ? 10 : LOW.test(t) ? 1 : MID.test(t) ? 4 : 3;
  return Math.max(1, Math.min(14, Math.round(base * Math.max(0.6, Math.min(2, o.s || 1)))));
}

export function workToVoxels(w: DreamWork): CustomVoxelBlock[] {
  const out: CustomVoxelBlock[] = [], seen = new Set<string>();
  (w.objects || []).forEach((o) => {
    if (!o || o.kind === 'portrait' || o.kind === 'spot') return;
    const gx = Math.max(-21, Math.min(21, Math.round(o.x * 1.3)));
    const gz = Math.max(-14, Math.min(14, Math.round(o.z * 0.9)));
    const col = colorOf(o), t = o.kind + ' ' + (o.name || '');
    const tall = TALL.test(t), low = !tall && LOW.test(t);
    const h = heightOf(o);
    // a little stepped tower: tall things stand on a 5×5 base, people and props on 3×3, flat things are a 5×5 pad
    const r = tall || low ? 2 : 1;
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const ring = Math.max(Math.abs(dx), Math.abs(dz));
        if (!low && r === 2 && Math.abs(dx) + Math.abs(dz) > 3) continue; // round off the corners
        const hh = low ? 1 : Math.max(1, h - ring * (tall ? 2 : 1));
        const x = gx + dx, z = gz + dz;
        if (Math.abs(x) > 22 || Math.abs(z) > 15) continue;
        for (let gy = 1; gy <= hh; gy++) {
          const key = x + ',' + gy + ',' + z;
          if (seen.has(key)) continue;
          seen.add(key);
          const tip = tall && ring === 0 && gy === hh; // a gold spire on top
          const roof = !tip && !low && gy === hh && ring === 0 && !tall;
          out.push({ gx: x, gy, gz: z, colorHex: tip ? 0xf59e0b : roof ? 0x2563eb : col, type: tip ? 'gold-spire' : roof ? 'royal-blue' : BRUSHES[hash(o.kind) % BRUSHES.length] });
        }
      }
    }
  });
  // build bottom-up, so the making-of grows from the table
  return out.sort((a, b) => a.gy - b.gy || a.gx - b.gx || a.gz - b.gz);
}

// ------------------------------------------------------------------ leaving the studio
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
export function openInWorkshop(id: string, play = false) {
  location.href = WORKSHOP + '?' + (play ? 'play=' : 'open=') + encodeURIComponent(id) + '&from=wed';
}
export function placeInPark(id: string) {
  lsSet('tp.pendingPlaceWork', id);
  location.href = PARK + '?place=' + encodeURIComponent(id);
}
export function newWork(template = 'ice_kingdom') { location.href = WORKSHOP + '?open=' + template + '&from=wed'; }
export function wantedWork(): string | null {
  const m = /[?&]work=([A-Za-z0-9_-]+)/.exec(location.search);
  return m ? m[1] : null;
}
