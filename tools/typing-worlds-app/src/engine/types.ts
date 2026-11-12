/**
 * Typing Worlds — shared contracts.
 *
 * Golden rule: the text model (TextInputEngine) is the single source of truth.
 * Worlds only *mirror* text visually; they can lag, skip or fail without ever
 * affecting what the user typed.
 */
import type * as THREE from 'three';
import type { GlyphEngine } from './glyphs/glyph-engine';
import type { AudioEngine } from './audio';
import type { TempoTracker } from './tempo';
import type { WorldRenderer } from './renderer';
import type { Layout, Slot } from './layout';

export type Tempo = 'slow' | 'normal' | 'fast';
export type Quality = 0 | 1 | 2;

export type WorldSeries =
  | 'physics'
  | 'characters'
  | 'ocean'
  | 'writing'
  | 'craft'
  | 'nature'
  | 'science'
  | 'sky'
  | 'blocks'
  | 'magic';

/** A character as tracked by the stage: stable id survives reflow/insertion. */
export interface LetterRef {
  id: number;
  char: string;
  /** current index in the text */
  index: number;
}

export interface InsertEvent extends LetterRef {
  /** position of this char inside a multi-char insert (paste); 0 for single key */
  burstIndex: number;
  burstSize: number;
  /** true when the world is re-creating existing text (world enter / restore) */
  restoring: boolean;
}

export interface DeleteEvent extends LetterRef {
  burstIndex: number;
  burstSize: number;
}

export interface WorldTheme {
  id: string;
  label: string;
  /** small css color/gradient for the swatch */
  swatch: string;
}

export interface SaveOutcome {
  ok: boolean;
  duplicate?: boolean;
  error?: string;
}

/** Everything a world gets from the engine. */
export interface WorldContext {
  THREE: typeof THREE;
  renderer: WorldRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  glyphs: GlyphEngine;
  tempo: TempoTracker;
  audio: AudioEngine;
  layout: Layout;
  quality: Quality;
  reducedMotion: boolean;
  theme: string;
  /** current letters (read-only snapshot accessor) */
  letters: () => readonly LetterRef[];
  /** slot (position/size) of a letter id in the current layout */
  slotOf: (id: number) => Slot | undefined;
  /** keep rendering for at least `ms` (for scripted moments) */
  keepAlive: (ms?: number) => void;
  /** register a timer that is cleared automatically on dispose */
  setTimeout: (fn: () => void, ms: number) => number;
  /** true when running in a gallery preview (cheaper, no audio) */
  preview: boolean;
}

/**
 * World lifecycle (spec PART 1.2).
 * `initializeWorld` is the factory itself (WorldModule.create).
 */
export interface WorldInstance {
  /** world becomes visible; existing text is replayed via onCharacterInput(restoring=true) */
  onWorldEnter?(): void;
  onCharacterInput(ev: InsertEvent): void;
  onCharacterDelete(ev: DeleteEvent): void;
  /** layout changed (insert/delete/resize/cursor edit) — move letters to new slots */
  onLayout?(): void;
  /**
   * Enter pressed. The world takes ownership of the current letter visuals and plays
   * its finale; the stage is logically empty right after this call (new typing starts
   * fresh). `saved` resolves with the real persistence result.
   */
  onWordComplete(word: string, letters: readonly LetterRef[], saved: Promise<SaveOutcome>): void;
  /** text cleared without saving (clear button / select-all delete) */
  onTextClear(letters: readonly LetterRef[]): void;
  /** world about to be torn down — may return a short exit transition */
  onWorldExit?(): Promise<void> | void;
  /** per-frame; return true while anything is still moving */
  updateAnimation(dt: number, time: number): boolean;
  setTheme?(id: string): void;
  /** optional click/tap in the 3D view (e.g. candle in Invisible Ink) */
  onPointer?(ndc: { x: number; y: number }, ray: THREE.Raycaster): boolean | void;
  disposeWorld(): void;
}

export interface WorldModule {
  create(ctx: WorldContext): WorldInstance;
}

export interface WorldDefinition {
  id: string;
  number: number;
  name: string;
  nameZh: string;
  series: WorldSeries;
  /** one-line description of the letter creation mechanism */
  mechanism: string;
  themes?: WorldTheme[];
  defaultTheme?: string;
  /** css gradient used for the card when no poster exists */
  poster: string;
  accent: string;
  /** whether the world wants bloom post-processing */
  bloom?: { strength: number; radius: number; threshold: number };
  /** layout of letters for this world */
  layout?: Partial<import('./layout').LayoutOptions>;
  /** world keeps ambient motion (fish, fireflies) while idle — rendered at a reduced fps */
  ambient?: boolean;
  /** implementation status */
  status: 'ready' | 'planned';
  batch: 1 | 2 | 3 | 4;
  load?: () => Promise<WorldModule>;
}
