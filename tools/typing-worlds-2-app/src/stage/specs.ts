/**
 * The 2.0 staging of each of the 23 worlds: grade, backdrop, air, light and camera.
 * Keys are the 1.0 world ids (tools/typing-worlds-app/src/engine/registry.ts).
 */
import type { MoteSpec } from './kit';
import type { StageSpec } from './director';
import { woodDesk, skyline } from './sets';

type V3 = [number, number, number];
type Box = [V3, V3];

/** volume in front of and around an upright (xy) stage seen from z ≈ 11 */
const WALL: Box = [[-11, -3.5, -6], [11, 6.5, 6.5]];
/** volume above a table (xz) stage seen from above */
const TABLE: Box = [[-9, 0.15, -6], [9, 4.5, 6]];

const dust = (color: string, over: Partial<MoteSpec> = {}): MoteSpec => ({
  count: 150, box: WALL, color, size: 0.05, opacity: 0.42, vel: [0.03, 0.02, 0], wobble: 0.6, twinkle: 0.6, ...over,
});
const bokeh = (color: string, color2: string, over: Partial<MoteSpec> = {}): MoteSpec => ({
  count: 26, box: [[-12, -4, -9], [12, 7, -2]], color, color2, size: 0.55, opacity: 0.1, vel: [0.02, 0.01, 0], wobble: 0.8, twinkle: 0.35, ...over,
});

export const STAGES: Record<string, StageSpec> = {
  /* 1 */ 'magnetic-jelly': {
    look: { exposure: 1.12, saturation: 1.14, bloom: { strength: 0.26, threshold: 0.86 }, shadow: [1.0, 0.96, 1.08] },
    backdrop: { top: '#0d0818', mid: '#170b22', bot: '#060309', glow: '#ff5fa2', glowPower: 0.16, glowSize: 3, haze: '#6e5bff', hazePower: 0.07, noise: 0.6 },
    motes: [bokeh('#ff9ec4', '#ffd36e'), dust('#ffe9f3', { count: 90, opacity: 0.3 })],
    lights: [{ type: 'point', color: '#ff7ab8', intensity: 3.6, at: [-8, 5, 5], distance: 30 }, { type: 'point', color: '#7aa8ff', intensity: 2.5, at: [8, -2, 5], distance: 30 }],
    camera: { follow: 0.12, intimacy: 0 },
    key: { sparks: 6, light: 1.6 },
    themes: { crystal: { accent: '#b7a8ff' }, glass: { accent: '#cfe6ee' }, rubber: { accent: '#4ecdc4' }, chrome: { accent: '#dfe6f0' }, clay: { accent: '#e9a77a' } },
  },
  /* 2 */ 'living-alphabet': {
    look: { exposure: 1.15, saturation: 1.12, bloom: { strength: 0.22, threshold: 0.88 } },
    backdrop: { top: '#06101a', mid: '#0b1a1c', bot: '#040806', glow: '#ffb27a', glowPower: 0.2, glowSize: 3.2, haze: '#4fae7a', hazePower: 0.08, noise: 0.5 },
    motes: [dust('#fff0c8', { count: 110, opacity: 0.4 }), { count: 34, box: [[-9, -0.5, -5], [9, 4, 4]], color: '#d8ff8a', color2: '#ffe27a', size: 0.11, opacity: 0.8, wobble: 1.4, twinkle: 0.95, vel: [0.04, 0.01, 0] }],
    pools: [{ at: [0, -0.48, 0.4], radius: 7.5, color: '#ffc58a', opacity: 0.16, rings: 0.25 }],
    lights: [{ type: 'point', color: '#ffb070', intensity: 4.2, at: [-6, 5, 4], distance: 26 }, { type: 'point', color: '#7fd9ff', intensity: 2.2, at: [7, 3, -3], distance: 26 }],
    key: { sparks: 7 },
  },
  /* 3 */ lightsaber: {
    look: { exposure: 1.05, bloom: { strength: 1.05, radius: 0.6, threshold: 0.22 }, shadow: [0.94, 1.0, 1.12], fringe: 0.02 },
    backdrop: { top: '#03050d', mid: '#060b1c', bot: '#020308', glow: '#2a66ff', glowPower: 0.18, glowSize: 2.6, haze: '#1a3a8a', hazePower: 0.12, noise: 0.7, stars: 0.35 },
    motes: [dust('#8fd0ff', { count: 170, opacity: 0.5, size: 0.04 })],
    pools: [{ at: [0, -1.58, 0.2], radius: 8, color: '#3a8cff', opacity: 0.22, rings: 0.5 }],
    key: { sparks: 9, light: 0, gravity: 0.4 },
  },
  /* 4 */ 'underwater-bubbles': {
    look: { exposure: 1.2, saturation: 1.1, bloom: { strength: 0.42, threshold: 0.7 }, shadow: [0.9, 1.02, 1.12], tint: [0.96, 1.02, 1.05] },
    backdrop: { top: '#0b3a55', mid: '#062236', bot: '#020a14', glow: '#2fb4e8', glowPower: 0.16, glowSize: 2.2, glowAt: [0, 14, -10], haze: '#1c7fa8', hazePower: 0.1, noise: 0.8, bands: 0.5 },
    motes: [
      dust('#bfeaff', { count: 220, opacity: 0.38, size: 0.04, vel: [0.05, 0.015, 0], wobble: 0.9 }),
      { count: 46, box: [[-10, -4, -5], [10, 7, 5]], color: '#d8f4ff', size: 0.16, opacity: 0.5, vel: [0, 0.42, 0], wobble: 0.35, twinkle: 0.2, shape: 'ring' },
    ],
    shafts: [{ from: [-3, 13, -4], to: [1, -5, -2], color: '#7fd8ff', count: 6, spread: 16, width: 2.6, opacity: 0.085 }],
    key: { sparks: 0, light: 1.4 },
  },
  /* 5 */ 'fish-formation': {
    look: { exposure: 1.2, bloom: { strength: 0.36, threshold: 0.72 }, shadow: [0.9, 1.02, 1.12] },
    backdrop: { top: '#0a3350', mid: '#061f33', bot: '#020911', glow: '#3fc1ee', glowPower: 0.14, glowSize: 2.2, glowAt: [0, 14, -10], haze: '#1a739c', hazePower: 0.09, noise: 0.8, bands: 0.45 },
    motes: [dust('#c9efff', { count: 200, opacity: 0.34, size: 0.04, vel: [0.06, 0.012, 0], wobble: 0.9 })],
    shafts: [{ from: [-4, 13, -5], to: [0, -5, -3], color: '#8fe0ff', count: 6, spread: 18, width: 2.8, opacity: 0.075 }],
    camera: { follow: 0.15 },
    key: { sparks: 0, light: 1.2 },
    themes: { tropical: { accent: '#ff9a5a' }, luminous: { accent: '#7dffd6', look: { bloom: { strength: 0.6, threshold: 0.5 } } } },
  },
  /* 6 */ 'chalk-flow': {
    look: { exposure: 1.18, bloom: { strength: 0.18, threshold: 0.9 }, tint: [1.03, 1.0, 0.95], vignette: 0.5 },
    backdrop: { top: '#0b0a08', mid: '#14110c', bot: '#050403', glow: '#ffd9a0', glowPower: 0.1, glowSize: 2.5, noise: 0.3 },
    motes: [dust('#fffaf0', { count: 150, box: [[-9, -4, 0.3], [9, 5, 6.5]], opacity: 0.4, size: 0.04, vel: [0.02, -0.035, 0] })],
    shafts: [{ from: [-11, 9, 4], to: [1, -4, 0.4], color: '#fff0d0', count: 3, spread: 9, width: 3.4, opacity: 0.035 }],
    lights: [{ type: 'spot', color: '#ffe6c0', intensity: 8.4, at: [-7, 7, 8], to: [0, 0.2, 0], distance: 34, angle: 0.55 }],
    camera: { maxYaw: 16, maxPitch: 8 },
    key: { sparks: 5, light: 0.8, gravity: 2.4 },
  },
  /* 7 */ 'signature-quill': {
    look: { exposure: 1.22, bloom: { strength: 0.24, threshold: 0.85 }, tint: [1.05, 1.0, 0.92], shadow: [1.04, 0.98, 0.94] },
    backdrop: { top: '#120b07', mid: '#1a0f08', bot: '#080503', glow: '#ff9d4a', glowPower: 0.14, glowSize: 2, noise: 0.5 },
    motes: [dust('#ffe2b0', { count: 120, box: TABLE, opacity: 0.45, size: 0.045 })],
    shafts: [{ from: [-9, 9, -6], to: [0, 0, 0.5], color: '#ffd9a0', count: 4, spread: 8, width: 2.2, opacity: 0.07 }],
    lights: [{ type: 'point', color: '#ffb060', intensity: 4.8, at: [-4.5, 3.2, -1.5], distance: 20 }],
    key: { sparks: 0, light: 1.2 },
    build: (scene) => void woodDesk(scene, 0.01),
  },
  /* 8 */ 'stone-carve': {
    look: { exposure: 1.22, contrast: 1.1, saturation: 0.96, bloom: { strength: 0.16, threshold: 0.9 }, shadow: [0.97, 1.0, 1.05] },
    backdrop: { top: '#0b0c0e', mid: '#121315', bot: '#050505', glow: '#c8d2e0', glowPower: 0.08, glowSize: 2.4, noise: 0.5 },
    motes: [dust('#e6e0d6', { count: 170, box: [[-9, -4, 0.4], [9, 5, 6.5]], opacity: 0.45, size: 0.04, vel: [0.03, -0.02, 0] })],
    shafts: [{ from: [-10, 10, 5], to: [0.5, -3.5, 0.5], color: '#fff3dc', count: 5, spread: 10, width: 2.2, opacity: 0.07 }],
    lights: [{ type: 'spot', color: '#ffe9c8', intensity: 11.2, at: [-8, 7, 7], to: [0, 0, 0], distance: 36, angle: 0.5 }],
    camera: { maxYaw: 18, maxPitch: 9 },
    key: { sparks: 8, light: 0.9, gravity: 3 },
  },
  /* 9 */ woodcarve: {
    look: { exposure: 1.15, saturation: 1.08, bloom: { strength: 0.16, threshold: 0.9 }, tint: [1.04, 1.0, 0.94] },
    backdrop: { top: '#120a05', mid: '#1b0f07', bot: '#070402', glow: '#ffa24d', glowPower: 0.12, glowSize: 2.2, noise: 0.5 },
    motes: [dust('#ffd9a8', { count: 170, box: [[-9, -4, 0.4], [9, 5, 6.5]], opacity: 0.5, size: 0.045, vel: [0.03, -0.03, 0] })],
    shafts: [{ from: [10, 10, 5], to: [-0.5, -3.5, 0.5], color: '#ffd9a0', count: 5, spread: 10, width: 2.2, opacity: 0.065 }],
    lights: [{ type: 'spot', color: '#ffd8a8', intensity: 8.4, at: [8, 7, 7], to: [0, 0, 0], distance: 36, angle: 0.5 }],
    camera: { maxYaw: 18, maxPitch: 9 },
    key: { sparks: 8, light: 0.9, gravity: 3 },
  },
  /* 10 */ 'white-sand': {
    look: { exposure: 1.28, bloom: { strength: 0.2, threshold: 0.88 }, tint: [1.04, 1.0, 0.94] },
    backdrop: { top: '#100b07', mid: '#180f08', bot: '#070503', glow: '#ffc27a', glowPower: 0.12, glowSize: 2, noise: 0.4 },
    motes: [dust('#fff1d2', { count: 130, box: TABLE, opacity: 0.4, size: 0.04, vel: [0.08, 0, 0.02] })],
    shafts: [{ from: [9, 9, -6], to: [0, 0, 0], color: '#ffe2b0', count: 4, spread: 8, width: 2.4, opacity: 0.07 }],
    lights: [{ type: 'spot', color: '#ffe0b0', intensity: 9.8, at: [7, 8, -3], to: [0, 0, 0], distance: 30, angle: 0.6 }],
    key: { sparks: 6, light: 0.8, gravity: 3 },
  },
  /* 11 */ 'genesis-lab': {
    look: { exposure: 1.12, saturation: 1.0, bloom: { strength: 0.3, threshold: 0.82 }, shadow: [0.95, 1.0, 1.08] },
    backdrop: { top: '#06080c', mid: '#0b0f16', bot: '#030405', glow: '#9fc4ff', glowPower: 0.12, glowSize: 2.4, haze: '#3a5a8a', hazePower: 0.1, noise: 0.4 },
    motes: [dust('#dfeaff', { count: 110, opacity: 0.32, size: 0.035 })],
    shafts: [{ from: [0, 11, -1], to: [0, -1.2, 0.4], color: '#cfe2ff', count: 3, spread: 7, width: 3.2, opacity: 0.05 }],
    key: { sparks: 6, light: 1.4, gravity: 0.6 },
  },
  /* 12 */ fireworks: {
    look: { exposure: 1.1, saturation: 1.15, bloom: { strength: 0.8, radius: 0.7, threshold: 0.3 } },
    backdrop: { top: '#03040e', mid: '#080a1e', bot: '#04040a', glow: '#3a2a7a', glowPower: 0.22, glowSize: 2, haze: '#ff8a4d', hazePower: 0.09, noise: 0.6, stars: 0.9 },
    motes: [dust('#ffd9a0', { count: 90, opacity: 0.3, size: 0.04, vel: [0.05, -0.03, 0] })],
    camera: { sweep: 6 },
    key: { sparks: 0, light: 0 },
    build: (scene) => void skyline(scene, { z: -34, y: -17, width: 130, height: 13, window: '#b8bcd8' }),
  },
  /* 13 */ skywriting: {
    look: { exposure: 1.15, bloom: { strength: 0.3, threshold: 0.8 }, shadow: [0.95, 0.98, 1.1] },
    backdrop: { top: '#040818', mid: '#101a3c', bot: '#05060c', glow: '#ff8a5a', glowPower: 0.16, glowSize: 1.6, glowAt: [0, -30, -160], haze: '#c0507a', hazePower: 0.14, noise: 0.75, stars: 0.8 },
    camera: { follow: 0.1, intimacy: 0, maxPitch: 8 },
    key: { sparks: 0, light: 0 },
  },
  /* 14 */ 'topiary-garden': {
    look: { exposure: 1.25, saturation: 1.12, bloom: { strength: 0.24, threshold: 0.85 }, tint: [1.03, 1.02, 0.95] },
    backdrop: { top: '#061018', mid: '#0c1c1a', bot: '#030604', glow: '#ffc27a', glowPower: 0.2, glowSize: 2.4, glowAt: [-9, 5, -20], haze: '#3f8a4a', hazePower: 0.1, noise: 0.55 },
    motes: [
      dust('#fff2c0', { count: 110, opacity: 0.38 }),
      { count: 40, box: [[-9, -0.4, -5], [9, 4, 4.5]], color: '#e6ff9a', color2: '#fff0a0', size: 0.11, opacity: 0.85, wobble: 1.5, twinkle: 0.95, vel: [0.03, 0.01, 0] },
    ],
    shafts: [{ from: [-11, 10, -3], to: [0, 0, 1], color: '#ffe2a0', count: 5, spread: 11, width: 2.4, opacity: 0.07 }],
    lights: [{ type: 'spot', color: '#ffdf9a', intensity: 12.6, at: [-8, 8, 5], to: [0, 0.6, 0], distance: 36, angle: 0.55 }, { type: 'hemi', color: '#8fb8ff', ground: '#243a1c', intensity: 0.5 }],
    key: { sparks: 8, gravity: 2.2 },
  },
  /* 15 */ ferrofluid: {
    look: { exposure: 1.2, saturation: 1.02, bloom: { strength: 0.3, threshold: 0.8 }, shadow: [0.94, 1.0, 1.1] },
    backdrop: { top: '#05070b', mid: '#0a0e16', bot: '#030304', glow: '#5f8cff', glowPower: 0.14, glowSize: 2.4, haze: '#7a4dff', hazePower: 0.08, noise: 0.5 },
    motes: [dust('#cfe0ff', { count: 100, opacity: 0.3, size: 0.035 })],
    lights: [{ type: 'point', color: '#6f9cff', intensity: 5.6, at: [-7, 4, 5], distance: 28 }, { type: 'point', color: '#ff7ad0', intensity: 3.1, at: [7, 2, 4], distance: 28 }],
    key: { sparks: 0, light: 1.8 },
  },
  /* 16 */ 'frost-bloom': {
    look: { exposure: 1.15, bloom: { strength: 0.34, threshold: 0.8 }, shadow: [0.92, 1.0, 1.12], tint: [0.97, 1.01, 1.05] },
    backdrop: { top: '#04101e', mid: '#08182c', bot: '#02050b', glow: '#6fd0ff', glowPower: 0.16, glowSize: 2.2, haze: '#4dffc4', hazePower: 0.1, noise: 0.8, bands: 0.5, stars: 0.4 },
    motes: [
      { count: 190, box: WALL, color: '#f2fbff', size: 0.07, opacity: 0.7, vel: [0.12, -0.34, 0], wobble: 0.6, twinkle: 0.4, shape: 'flake', blend: 'normal' },
      dust('#bfe9ff', { count: 80, opacity: 0.5, size: 0.035, twinkle: 0.9 }),
    ],
    pools: [{ at: [0, -2.28, 0.3], radius: 8.5, color: '#7fd4ff', opacity: 0.2, rings: 0.3 }],
    key: { sparks: 7, gravity: 0.5 },
  },
  /* 17 */ 'noble-gas-neon': {
    look: { exposure: 1.05, saturation: 1.15, bloom: { strength: 1.0, radius: 0.62, threshold: 0.22 }, fringe: 0.022, grain: 0.045 },
    backdrop: { top: '#070410', mid: '#10071a', bot: '#040206', glow: '#ff3d6e', glowPower: 0.13, glowSize: 2.2, haze: '#3d5aff', hazePower: 0.1, noise: 0.7 },
    motes: [dust('#ffd0e0', { count: 140, opacity: 0.36, size: 0.04, vel: [0.03, -0.02, 0] }), bokeh('#ff5a8a', '#5a8aff', { opacity: 0.08 })],
    pools: [{ at: [0, -1.28, 0.6], radius: 7, color: 'accent', opacity: 0.3 }],
    key: { sparks: 6, light: 0, gravity: 1.8 },
    themes: { argon: { accent: '#9b6bff' }, helium: { accent: '#ffb347' }, xenon: { accent: '#7fd8ff' } },
  },
  /* 18 */ 'block-builder': {
    look: { exposure: 1.2, saturation: 1.12, bloom: { strength: 0.3, threshold: 0.8 } },
    backdrop: { top: '#04101a', mid: '#081a22', bot: '#020506', glow: '#3fd0c9', glowPower: 0.15, glowSize: 2.4, haze: '#3f7fd0', hazePower: 0.09, noise: 0.5, stars: 0.25 },
    motes: [{ count: 120, box: WALL, color: '#9ff5ee', color2: '#ffe27a', size: 0.06, opacity: 0.5, vel: [0, 0.06, 0], wobble: 0.3, twinkle: 0.7, shape: 'flake' }],
    lights: [{ type: 'point', color: '#7ff0e8', intensity: 3.6, at: [-7, 5, 5], distance: 28 }, { type: 'point', color: '#ffc27a', intensity: 2.8, at: [7, 3, 5], distance: 28 }],
    key: { sparks: 8, gravity: 3 },
    themes: { gold: { accent: '#ffd24d' }, emerald: { accent: '#4de08a' }, stone: { accent: '#c8ccd2' } },
  },
  /* 19 */ 'magic-wand': {
    look: { exposure: 1.08, saturation: 1.15, bloom: { strength: 0.9, radius: 0.66, threshold: 0.26 } },
    backdrop: { top: '#070518', mid: '#120a2a', bot: '#04030a', glow: '#8a5aff', glowPower: 0.2, glowSize: 2, haze: '#3fc8ff', hazePower: 0.1, noise: 0.85, stars: 0.7 },
    motes: [{ count: 150, box: WALL, color: '#c8f2ff', color2: '#ffd9ff', size: 0.06, opacity: 0.7, vel: [0.02, 0.05, 0], wobble: 0.9, twinkle: 0.95, shape: 'spark' }],
    key: { sparks: 10, light: 0, gravity: 0.3 },
    themes: { gold: { accent: '#ffd27a' }, rainbow: { accent: '#ff8ad8' } },
  },
  /* 20 */ 'enchanted-book': {
    look: { exposure: 1.1, bloom: { strength: 0.3, threshold: 0.85 }, tint: [1.05, 1.0, 0.93], shadow: [1.03, 0.98, 0.96] },
    backdrop: { top: '#0d0806', mid: '#160d08', bot: '#060403', glow: '#ffb24d', glowPower: 0.18, glowSize: 2.2, haze: '#7a3dff', hazePower: 0.06, noise: 0.6 },
    motes: [{ count: 150, box: [[-9, -1, -5], [9, 6, 5]], color: '#ffe2a0', color2: '#ffb85a', size: 0.06, opacity: 0.7, vel: [0.01, 0.12, 0], wobble: 0.7, twinkle: 0.9, shape: 'spark' }],
    shafts: [{ from: [0, 10, -2], to: [0, 0, 0.5], color: '#ffd28a', count: 4, spread: 7, width: 2.6, opacity: 0.07 }],
    lights: [{ type: 'point', color: '#ffb866', intensity: 4.2, at: [0, 3.5, 3.5], distance: 20 }],
    key: { sparks: 9, gravity: 0.3 },
  },
  /* 21 */ 'rune-forge': {
    look: { exposure: 1.1, bloom: { strength: 0.3, threshold: 0.86 }, shadow: [1.04, 0.98, 0.96] },
    backdrop: { top: '#070608', mid: '#120a08', bot: '#080403', glow: '#ff6a2a', glowPower: 0.2, glowSize: 2, glowAt: [0, -6, -8], haze: '#3fa8ff', hazePower: 0.07, noise: 0.7 },
    motes: [
      { count: 110, box: [[-9, -3, -4], [9, 6, 5]], color: '#ffb05a', color2: '#ff5a2a', size: 0.07, opacity: 0.85, vel: [0.04, 0.5, 0], wobble: 0.6, twinkle: 0.8, shape: 'spark' },
      dust('#ffd8b0', { count: 80, opacity: 0.25 }),
    ],
    key: { sparks: 10, gravity: 2.4 },
  },
  /* 22 */ 'invisible-ink': {
    look: { exposure: 1.2, bloom: { strength: 0.22, threshold: 0.88 }, tint: [1.05, 1.0, 0.92], shadow: [1.04, 0.98, 0.94], vignette: 0.5 },
    backdrop: { top: '#120b06', mid: '#1c1008', bot: '#090503', glow: '#ffa040', glowPower: 0.16, glowSize: 1.8, noise: 0.5 },
    motes: [dust('#ffe2b0', { count: 140, box: TABLE, opacity: 0.5, size: 0.045 })],
    shafts: [{ from: [-9, 10, -7], to: [0, 0, 0], color: '#ffd9a0', count: 4, spread: 8, width: 2.4, opacity: 0.065 }],
    lights: [{ type: 'hemi', color: '#ffd9a8', ground: '#3a2414', intensity: 0.35 }],
    key: { sparks: 0, light: 1.0 },
    build: (scene) => void woodDesk(scene, -0.01),
    themes: {
      blue: { accent: '#6fb0ff', backdrop: { glow: '#3a7aff' } },
      bronze: { accent: '#d08a4a' },
      fluorescent: { accent: '#b8ff5a', backdrop: { glow: '#7a4dff' } },
    },
  },
  /* 23 */ alphablocks: {
    look: { exposure: 1.18, saturation: 1.14, bloom: { strength: 0.24, threshold: 0.86 } },
    backdrop: { top: '#080a1c', mid: '#101230', bot: '#05050c', glow: '#ff8a5a', glowPower: 0.18, glowSize: 2.4, haze: '#5a7aff', hazePower: 0.1, noise: 0.5 },
    motes: [bokeh('#ff9a7a', '#7ad0ff', { opacity: 0.12 }), { count: 90, box: WALL, color: '#ffd27a', color2: '#7affc8', size: 0.06, opacity: 0.5, vel: [0.02, -0.05, 0], wobble: 0.8, twinkle: 0.6, shape: 'flake' }],
    lights: [{ type: 'point', color: '#ffc08a', intensity: 4.2, at: [-8, 6, 7], distance: 30 }],
    camera: { follow: 0.12, intimacy: 0 },
    key: { sparks: 8, gravity: 3 },
    themes: { pastel: { accent: '#ffb8d8' }, wood: { accent: '#e0a86a' } },
  },
};

export const FALLBACK_STAGE: StageSpec = {
  backdrop: { top: '#06080e', mid: '#0b0e18', bot: '#030305', glow: '#7a9cff', glowPower: 0.12, glowSize: 2.4, noise: 0.5 },
  motes: [dust('#dfe6ff')],
};
