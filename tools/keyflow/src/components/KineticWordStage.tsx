import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Sparkles,
  CornerDownLeft,
  Edit3,
  Shuffle,
  Wand2,
  Eye,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Flame,
} from 'lucide-react';
import {
  VocabEntry,
  ForgedWordRecord,
  inferSmartWordHint,
} from '../data/vocabularyData';
import { getKeyNormalizedPosition } from './InteractiveKeyboard';
import { SoundProfile } from '../utils/soundEngine';
import { DriftingWordStream } from './DriftingWordStream';

export type KineticVisualMode =
  | 'gummy'
  | 'jelly'
  | 'spring'
  | 'blocks'
  | 'voxel'
  | 'typewriter'
  | 'ransom'
  | 'toy-box'
  | 'keycap-box'
  | 'neon-box';

export const KINETIC_MODE_CATALOG: {
  id: KineticVisualMode;
  label: string;
  desc: string;
  category: 'naked' | 'framed';
}[] = [
  // 纯字骨变形 (无外框)
  { id: 'gummy', label: 'Gummy Q弹软糖', desc: '圆润饱满3D果冻高光Q弹字形', category: 'naked' },
  { id: 'jelly', label: '液态融墨字骨', desc: 'SVG 湍流场让笔画液态融化', category: 'naked' },
  { id: 'spring', label: '橡皮拉伸字骨', desc: '可变字重与字宽弹性拉丝伸缩', category: 'naked' },
  { id: 'blocks', label: '断层切片字骨', desc: '字母本体横切三层交错滑移', category: 'naked' },
  { id: 'voxel', label: '像素点阵字骨', desc: '纯裸像素阶梯字形波浪起伏', category: 'naked' },
  { id: 'typewriter', label: '镂空双线雕版', desc: '矢量描边字骨与错位复刻重影', category: 'naked' },
  // 经典加外框效果 (保留之前做的外框版不删除)
  { id: 'ransom', label: '剪报贴纸外框', desc: '复古杂志剪报撞色贴纸外框', category: 'framed' },
  { id: 'toy-box', label: '立体积木外框', desc: '3D 倒角彩色玩具积木块外框', category: 'framed' },
  { id: 'keycap-box', label: '机械键帽外框', desc: 'PBT 球帽内凹立体键帽外框', category: 'framed' },
  { id: 'neon-box', label: '赛博灯牌外框', desc: '暗底霓虹发光边框与折角徽章', category: 'framed' },
];

export interface TypedCharItem {
  id: string;
  char: string;
  sourceX: number; // -1 to +1 from keyboard key position
  sourceY: number;
  tilt: number;
  velocityScore: number;
  variantSeed: number;
  isSuper?: boolean;
  pluckedAt?: number;
}

export interface BurstParticle {
  id: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  size: number;
  shape?: 'circle' | 'square' | 'diamond';
}

export interface LaserArc {
  id: string;
  startX: number; // percentage 10% to 90%
  endX: number;   // percentage 25% to 75%
  color: string;
}

interface GummyPhysicsNode {
  id: string;
  dx: number;
  dy: number;
  vx: number;
  vy: number;
  squash: number; // >0 = wider & shorter (pancake), <0 = narrower & taller (stretch)
  vSquash: number;
  rot: number;
  vRot: number;
  impactFlash: number; // 0..1 contact flash when collision occurs
}

interface GummyLetterOffset {
  dx: number;
  dy: number;
  squashX: number;
  squashY: number;
  rot: number;
  impactFlash: number;
}

interface ForceFieldWave {
  id: string;
  xPercent: number;
  yPercent: number;
}

interface KineticWordStageProps {
  workspaceMode: 'free' | 'guided';
  onWorkspaceModeChange?: (mode: 'free' | 'guided') => void;
  visualMode: KineticVisualMode;
  soundProfile?: SoundProfile;
  onSoundProfileChange?: (profile: SoundProfile) => void;
  typedChars: TypedCharItem[];
  targetVocab: VocabEntry | null;
  customMeaning: string;
  isEditingMeaning: boolean;
  onCustomMeaningChange: (val: string) => void;
  onToggleEditMeaning: () => void;
  onForgeCurrentWord: () => void;
  onSpeakCurrent: () => void;
  onPickRandomWord: () => void;
  onMorphAllLetters: () => void;
  onToggleSingleLetterSuper: (charId: string, index: number) => void;
  onPluckLetter: (charId: string, index: number) => void;
  errorShake: boolean;
  forgedBanner: { word: string; meaning: string; wpm: number } | null;
  particles: BurstParticle[];
  laserArcs: LaserArc[];
  wpm: number;
  combo: number;
  isImmersive?: boolean;
  onToggleImmersive?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  forgedCount?: number;
  forgedWords?: ForgedWordRecord[];
  onReplayWord?: (record: ForgedWordRecord) => void;
  onSpeakWord?: (word: string) => void;
  lastPressedKey?: { key: string; timestamp: number } | null;
}

const VOWEL_SET = new Set(['a', 'e', 'i', 'o', 'u']);

const TOY_BOX_PALETTE = [
  'bg-[#FFEDD5] dark:bg-amber-950/80 border-[#D94625] text-[#9A3412] dark:text-amber-200 shadow-[0_5px_0_#D94625]',
  'bg-[#CCFBF1] dark:bg-teal-950/80 border-[#0D9488] text-[#115E59] dark:text-teal-200 shadow-[0_5px_0_#0D9488]',
  'bg-[#FEF3C7] dark:bg-yellow-950/80 border-[#D97706] text-[#92400E] dark:text-yellow-200 shadow-[0_5px_0_#D97706]',
  'bg-[#E0E7FF] dark:bg-indigo-950/80 border-[#4F46E5] text-[#3730A3] dark:text-indigo-200 shadow-[0_5px_0_#4F46E5]',
];

const RANSOM_CUTOUT_PALETTE = [
  'bg-zinc-900 text-[#FAF8F5] dark:bg-amber-400 dark:text-zinc-950 border-2 border-zinc-900 dark:border-amber-300 shadow-[3px_3px_0_#D94625]',
  'bg-[#D94625] text-white border-2 border-zinc-900 dark:border-white shadow-[3px_3px_0_#18181B]',
  'bg-[#FAF3E0] text-zinc-900 border-2 border-dashed border-zinc-800 shadow-[3px_3px_0_#0D9488]',
  'bg-[#0D9488] text-white border-2 border-zinc-900 shadow-[3px_3px_0_#F59E0B]',
];

export const KineticWordStage: React.FC<KineticWordStageProps> = ({
  workspaceMode,
  onWorkspaceModeChange,
  visualMode,
  soundProfile = 'thock',
  onSoundProfileChange,
  typedChars,
  targetVocab,
  customMeaning,
  isEditingMeaning,
  onCustomMeaningChange,
  onToggleEditMeaning,
  onForgeCurrentWord,
  onSpeakCurrent,
  onPickRandomWord,
  onMorphAllLetters,
  onToggleSingleLetterSuper,
  onPluckLetter,
  errorShake,
  forgedBanner,
  particles,
  laserArcs,
  wpm,
  combo,
  isImmersive = false,
  onToggleImmersive,
  darkMode = false,
  onToggleDarkMode,
  forgedCount = 0,
  forgedWords = [],
  onReplayWord,
  onSpeakWord,
  lastPressedKey,
}) => {
  const currentWordString = typedChars.map((c) => c.char).join('');
  const smartHint = inferSmartWordHint(currentWordString);
  const [vowelXRay, setVowelXRay] = useState(true);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  // Continuous animation phase for organic glyph deformation
  const [waveTick, setWaveTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setWaveTick((t) => (t + 1) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // ============================================================================
  // GUMMY MODE COLLISION-DETECTION & NEIGHBOR DISPLACEMENT PHYSICS ENGINE
  // Simulates coupled soft-body gummy candies: when a letter lands or receives
  // force, pairwise bounding-circle collision detection & viscoelastic shear
  // transfer real positional offsets (dx, dy), squash-and-stretch, and tilt
  // to neighboring letters!
  // ============================================================================
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const gummyNodesRef = useRef<GummyPhysicsNode[]>([]);
  const prevTypedCountRef = useRef<number>(0);
  const [gummyOffsets, setGummyOffsets] = useState<GummyLetterOffset[]>([]);
  const [forceWaves, setForceWaves] = useState<ForceFieldWave[]>([]);

  // Inject an impulse force into letter `targetIdx` (on landing, hover pluck, or click)
  const triggerGummyLetterForce = React.useCallback(
    (targetIdx: number, intensity = 1.0, isLanding = false) => {
      const nodes = gummyNodesRef.current;
      const node = nodes[targetIdx];
      if (!node) return;

      if (isLanding) {
        // Newly typed letter slams down and expands horizontally, colliding into its left neighbor!
        node.dy = -14 * intensity;
        node.vy = 19 * intensity;
        node.dx = 12 * intensity;
        node.vx = -18 * intensity;
        node.squash = 0.42 * intensity;
        node.vSquash = -0.16 * intensity;
        node.vRot = -8 * intensity;
        node.impactFlash = 1;

        // Immediate contact pre-impulse into left neighbor so collision detection cascades
        if (targetIdx - 1 >= 0 && nodes[targetIdx - 1]) {
          const leftNeighbor = nodes[targetIdx - 1];
          leftNeighbor.vx -= 14 * intensity;
          leftNeighbor.vy -= 7.5 * intensity;
          leftNeighbor.vSquash += 0.28 * intensity;
          leftNeighbor.vRot -= 6.5 * intensity;
          leftNeighbor.impactFlash = 0.9;
        }
      } else {
        // Direct user poke / pluck / click on letter `targetIdx`:
        // Letter squashes & bounces while expanding outward to collide with both left & right neighbors!
        node.vy = 15 * intensity;
        node.squash = 0.46 * intensity;
        node.vSquash = -0.22 * intensity;
        node.vRot = (Math.random() - 0.5) * 12 * intensity;
        node.impactFlash = 1;

        if (targetIdx - 1 >= 0 && nodes[targetIdx - 1]) {
          const left = nodes[targetIdx - 1];
          left.vx -= 13.5 * intensity;
          left.vy -= 6.5 * intensity;
          left.vSquash += 0.25 * intensity;
          left.vRot -= 6 * intensity;
          left.impactFlash = 0.85;
        }
        if (targetIdx + 1 < nodes.length && nodes[targetIdx + 1]) {
          const right = nodes[targetIdx + 1];
          right.vx += 13.5 * intensity;
          right.vy -= 6.5 * intensity;
          right.vSquash += 0.25 * intensity;
          right.vRot += 6 * intensity;
          right.impactFlash = 0.85;
        }
      }
    },
    []
  );

  // Sync `gummyNodesRef` with `typedChars` and trigger landing collision when a new char arrives
  useEffect(() => {
    const prevNodes = gummyNodesRef.current;
    const prevMap = new Map(prevNodes.map((n) => [n.id, n]));

    const nextNodes: GummyPhysicsNode[] = typedChars.map((ch) => {
      const existing = prevMap.get(ch.id);
      if (existing) return existing;
      return {
        id: ch.id,
        dx: 0,
        dy: 0,
        vx: 0,
        vy: 0,
        squash: 0,
        vSquash: 0,
        rot: 0,
        vRot: 0,
        impactFlash: 0,
      };
    });

    gummyNodesRef.current = nextNodes;

    // If a new character just landed on stage, trigger landing collision feedback!
    if (typedChars.length > prevTypedCountRef.current && typedChars.length > 0) {
      const newlyLandedIdx = typedChars.length - 1;
      triggerGummyLetterForce(newlyLandedIdx, 1.05, true);
    }
    prevTypedCountRef.current = typedChars.length;
  }, [typedChars, triggerGummyLetterForce]);

  // 60fps Coupled Soft-Body & Pairwise Collision-Detection Solver
  useEffect(() => {
    let animFrameId: number;
    const restSpacing = isImmersive ? 58 : 36;
    const baseRadius = restSpacing * 0.53;

    const stepGummyPhysics = () => {
      const nodes = gummyNodesRef.current;
      const n = nodes.length;

      if (n > 0) {
        // 1. Pairwise Bounding-Sphere Collision Detection between neighboring letters
        for (let i = 0; i < n - 1; i++) {
          const a = nodes[i];
          const b = nodes[i + 1];

          // World coordinates relative to word baseline
          const ax = i * restSpacing + a.dx;
          const ay = a.dy;
          const bx = (i + 1) * restSpacing + b.dx;
          const by = b.dy;

          // Effective gummy radii swell when squashed horizontally!
          const ra = baseRadius * Math.max(0.82, 1 + a.squash * 0.72);
          const rb = baseRadius * Math.max(0.82, 1 + b.squash * 0.72);
          const minDist = ra + rb;

          const rx = bx - ax;
          const ry = by - ay;
          const dist = Math.max(0.001, Math.hypot(rx, ry));

          // Collision detected when neighbor spheres overlap!
          if (dist < minDist) {
            const overlap = minDist - dist;
            const nx = rx / dist;
            const ny = ry / dist;

            // Elastic positional separation so letters push each other out of the way
            const push = overlap * 0.36;
            a.dx -= nx * push;
            b.dx += nx * push;
            a.dy -= ny * push * 0.5;
            b.dy += ny * push * 0.5;

            // Relative velocity impulse along collision normal (restitution)
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const velAlongNormal = rvx * nx + rvy * ny;
            if (velAlongNormal < 0) {
              const impulse = -(1 + 0.78) * velAlongNormal * 0.5;
              a.vx -= impulse * nx;
              b.vx += impulse * nx;
              a.vy -= impulse * ny + overlap * 0.08;
              b.vy += impulse * ny - overlap * 0.12;
            }

            // Mutual gummy compression on impact + opposite rotational nudge
            const squashImpulse = Math.min(0.09, overlap * 0.014);
            a.vSquash -= squashImpulse;
            b.vSquash += squashImpulse * 0.9;
            a.vRot -= overlap * 0.22;
            b.vRot += overlap * 0.22;
            a.impactFlash = Math.min(1, a.impactFlash + overlap * 0.06);
            b.impactFlash = Math.min(1, b.impactFlash + overlap * 0.06);
          }

          // 2. Viscoelastic Gummy Shear Coupling (neighbors gently tug each other vertically & horizontally)
          const shearY = (b.dy - a.dy) * 0.065;
          const shearX = (b.dx - a.dx) * 0.045;
          a.vy += shearY;
          b.vy -= shearY;
          a.vx += shearX;
          b.vx -= shearX;
        }

        // 3. Integrate each letter's spring-damper restoration toward rest slot (0, 0)
        const nextOffsets: GummyLetterOffset[] = new Array(n);
        for (let i = 0; i < n; i++) {
          const node = nodes[i];

          // Hooke's law spring force back to slot origin
          const springK = 0.16;
          const damping = 0.82;
          node.vx = (node.vx - node.dx * springK) * damping;
          node.vy = (node.vy - node.dy * springK) * damping;
          node.dx = Math.max(-28, Math.min(28, node.dx + node.vx));
          node.dy = Math.max(-24, Math.min(24, node.dy + node.vy));

          // Volume-preserving Q-bounce squash & stretch oscillation
          const squashK = 0.21;
          const squashDamp = 0.8;
          node.vSquash = (node.vSquash - node.squash * squashK) * squashDamp;
          node.squash = Math.max(-0.42, Math.min(0.48, node.squash + node.vSquash));

          // Rotational wobble restoration
          node.vRot = (node.vRot - node.rot * 0.18) * 0.8;
          node.rot = Math.max(-18, Math.min(18, node.rot + node.vRot));

          node.impactFlash *= 0.88;

          const sx = 1 + node.squash;
          // Preserve 2D area (1 / sx) so squashing wider makes the gummy letter shorter, and vice versa
          const sy = Math.max(0.62, Math.min(1.48, 1 / Math.max(0.65, sx)));

          nextOffsets[i] = {
            dx: Math.abs(node.dx) < 0.08 ? 0 : node.dx,
            dy: Math.abs(node.dy) < 0.08 ? 0 : node.dy,
            squashX: sx,
            squashY: sy,
            rot: Math.abs(node.rot) < 0.08 ? 0 : node.rot,
            impactFlash: node.impactFlash,
          };
        }

        setGummyOffsets(nextOffsets);
      } else {
        setGummyOffsets([]);
      }

      animFrameId = requestAnimationFrame(stepGummyPhysics);
    };

    animFrameId = requestAnimationFrame(stepGummyPhysics);
    return () => cancelAnimationFrame(animFrameId);
  }, [isImmersive]);

  // Trigger Outward Force-Field Shockwave & Subtle Gummy Ripple when any key is pressed!
  useEffect(() => {
    if (!lastPressedKey) return;

    const keyPos = getKeyNormalizedPosition(lastPressedKey.key);
    const waveId = `fw-${lastPressedKey.timestamp}-${Math.random()}`;
    setForceWaves((prev) => [
      ...prev.slice(-4),
      {
        id: waveId,
        xPercent: Math.max(10, Math.min(90, 50 + keyPos.x * 42)),
        yPercent: 82,
      },
    ]);

    // Also send a subtle shockwave ripple across existing gummy letters on stage
    const nodes = gummyNodesRef.current;
    if (nodes.length > 1) {
      const centerIdx = ((keyPos.x + 1) * 0.5) * (nodes.length - 1);
      nodes.forEach((node, idx) => {
        const distIdx = idx - centerIdx;
        const absDist = Math.abs(distIdx);
        const falloff = Math.max(0.15, 1 / (1 + absDist * 0.6));
        node.vx += (distIdx >= 0 ? 1 : -1) * 3.8 * falloff;
        node.vy -= 3.2 * falloff;
        node.vSquash += 0.08 * falloff;
      });
    }
  }, [lastPressedKey]);

  const activeMeaning =
    workspaceMode === 'guided' && targetVocab
      ? targetVocab.meaning
      : customMeaning.trim() ||
        (currentWordString
          ? smartHint.meaning
          : isImmersive
          ? '全屏物理力场已开启 · 敲击键盘发射冲击波力场，弹飞并碰撞舞台上的锻造词体'
          : '支持 6 种纯字骨变形 (含 Gummy Q弹) 与 4 种经典外框效果；敲击键盘发射冲击力场碰撞词体');

  const activePhonetic =
    workspaceMode === 'guided' && targetVocab
      ? targetVocab.phonetic
      : currentWordString
      ? smartHint.phonetic
      : '/gummy-and-framed-modes/';

  const activePos =
    workspaceMode === 'guided' && targetVocab
      ? targetVocab.pos
      : currentWordString
      ? smartHint.pos
      : 'lexicon';

  const carriageOffsetPx =
    visualMode === 'typewriter'
      ? Math.max(
          isImmersive ? -300 : -160,
          -typedChars.length * (isImmersive ? 20 : 11)
        )
      : 0;

  // ============================================================================
  // UNIFIED PER-MODE GLYPH & FRAMED-CARD RENDERER
  // Supports BOTH:
  //   A) 6 Naked Glyph Deformation Modes (gummy, jelly, spring, blocks, voxel, typewriter)
  //   B) 4 Classic Framed Box Modes (ransom, toy-box, keycap-box, neon-box)
  // ============================================================================
  const renderUnifiedDeformedGlyph = (item: TypedCharItem, idx: number) => {
    const isVowel = VOWEL_SET.has(item.char.toLowerCase());
    const baseSize = isImmersive
      ? 'text-6xl sm:text-8xl md:text-9xl'
      : 'text-4xl sm:text-6xl';
    const framedTextSize = isImmersive
      ? 'text-5xl sm:text-7xl md:text-8xl'
      : 'text-3xl sm:text-5xl';

    // Space character: minimalist typographic undertie curve (‿) or framed space bar
    if (item.char === ' ') {
      if (
        visualMode === 'ransom' ||
        visualMode === 'toy-box' ||
        visualMode === 'keycap-box' ||
        visualMode === 'neon-box'
      ) {
        return (
          <span
            className={`inline-flex items-center justify-center font-mono select-none mx-1 px-2.5 py-1 rounded-lg border border-dashed border-[#D94625]/60 text-[#D94625] dark:text-amber-400 ${
              isImmersive ? 'text-2xl sm:text-4xl' : 'text-xs sm:text-sm'
            }`}
          >
            ␣
          </span>
        );
      }
      return (
        <span
          className={`inline-block font-mono select-none mx-2 sm:mx-3 text-[#D94625] dark:text-amber-400 opacity-75 ${
            isImmersive
              ? 'text-4xl sm:text-6xl translate-y-3'
              : 'text-2xl sm:text-3xl translate-y-2'
          }`}
        >
          ‿
        </span>
      );
    }

    const vowelColor =
      isVowel && vowelXRay
        ? 'text-[#D94625] dark:text-amber-400'
        : 'text-zinc-900 dark:text-zinc-100';

    // --- A. PURE NAKED GLYPH DEFORMATION MODES (无外框纯字形) ---

    // 1. 'gummy' -> 全新 Gummy Q弹软糖字形 (Unified DynaPuff plump gummy strokes + 3D specular jelly highlight + Q-bounce oscillation)
    if (visualMode === 'gummy') {
      return (
        <span
          style={{
            filter: 'url(#glyph-gummy-specular)',
            animationDelay: `${idx * 75}ms`,
          }}
          className={`inline-block font-gummy font-bold animate-gummy-q leading-none tracking-normal select-none ${baseSize} ${
            isVowel && vowelXRay
              ? 'text-[#FF542E] dark:text-amber-400'
              : 'text-[#0D9488] dark:text-teal-300'
          }`}
        >
          {item.char}
        </span>
      );
    }

    // 2. 'jelly' -> 液态融墨字形 (Unified Fraunces SOFT/WONK serif with SVG turbulence liquid ink displacement)
    if (visualMode === 'jelly') {
      const phase = (waveTick + idx * 45) * (Math.PI / 180);
      const scaleX = 1 + Math.sin(phase) * 0.15;
      const scaleY = 1 - Math.sin(phase) * 0.13;
      const skewX = Math.cos(phase) * 7;
      return (
        <span
          style={{
            filter: 'url(#glyph-liquid-filter)',
            transform: `scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(
              3
            )}) skewX(${skewX.toFixed(1)}deg)`,
            fontVariationSettings: `"wght" ${
              isVowel ? 850 : 700
            }, "SOFT" 100, "WONK" 1`,
          }}
          className={`inline-block font-serif-morph animate-serif-morph leading-none tracking-tight select-none transition-transform ${baseSize} ${vowelColor}`}
        >
          {item.char}
        </span>
      );
    }

    // 3. 'spring' -> 橡皮拉伸骨骼 (Unified Bricolage Grotesque variable weight/width elastic stretch)
    if (visualMode === 'spring') {
      return (
        <span
          style={{
            animationDelay: `${idx * 105}ms`,
          }}
          className={`inline-block font-display animate-glyph-elastic leading-none select-none ${baseSize} ${vowelColor}`}
        >
          {item.char}
        </span>
      );
    }

    // 4. 'blocks' -> 断层切片字骨 (Unified Syne geometric font with 3-layer horizontal fracture slice on every letter)
    if (visualMode === 'blocks') {
      const shift = (idx % 2 === 0 ? 1 : -1) * 4.5;
      return (
        <span
          className={`relative inline-block font-syne-wide font-extrabold leading-none select-none ${baseSize} ${vowelColor}`}
        >
          <span className="opacity-15">{item.char}</span>
          <span
            aria-hidden="true"
            style={{
              clipPath: 'inset(0 0 64% 0)',
              transform: `translateX(${shift}px) skewX(-10deg)`,
            }}
            className="absolute inset-0 text-[#D94625] dark:text-amber-400"
          >
            {item.char}
          </span>
          <span
            aria-hidden="true"
            style={{
              clipPath: 'inset(34% 0 34% 0)',
              transform: `translateX(${-shift * 0.75}px)`,
            }}
            className="absolute inset-0 text-zinc-900 dark:text-zinc-100"
          >
            {item.char}
          </span>
          <span
            aria-hidden="true"
            style={{
              clipPath: 'inset(64% 0 0 0)',
              transform: `translateX(${shift * 0.85}px) skewX(8deg)`,
            }}
            className="absolute inset-0 text-teal-600 dark:text-teal-400"
          >
            {item.char}
          </span>
        </span>
      );
    }

    // 5. 'voxel' -> 像素点阵字骨 (Unified Silkscreen naked pixel skeleton)
    if (visualMode === 'voxel') {
      return (
        <span
          style={{
            filter: 'url(#glyph-pixel-filter)',
          }}
          className={`inline-block font-pixel-bare leading-none select-none ${baseSize} ${
            isVowel && vowelXRay
              ? 'text-[#D94625] dark:text-amber-400'
              : 'text-emerald-700 dark:text-emerald-400'
          }`}
        >
          {item.char}
        </span>
      );
    }

    // 6. 'typewriter' -> 镂空双线雕版 (Unified Fraunces hollow vector wireframe with 3px offset engraved clone)
    if (visualMode === 'typewriter') {
      return (
        <span
          className={`relative inline-block font-serif-morph font-black leading-none select-none ${baseSize}`}
        >
          <span
            aria-hidden="true"
            style={{ transform: 'translate(3px, 3px)' }}
            className={`absolute inset-0 opacity-25 ${
              isVowel && vowelXRay
                ? 'text-[#D94625]'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {item.char}
          </span>
          <span
            className={
              isVowel && vowelXRay
                ? 'glyph-outline-orange relative z-10'
                : 'glyph-outline-ink relative z-10'
            }
          >
            {item.char}
          </span>
        </span>
      );
    }

    // --- B. CLASSIC FRAMED / BOXED MODES (保留之前做的加外框效果版，不删除) ---

    // 7. 'ransom' -> 剪报贴纸外框 (Magazine cutout sticker frame with offset drop shadow & rotated tape aesthetic)
    if (visualMode === 'ransom') {
      const paletteClass =
        RANSOM_CUTOUT_PALETTE[idx % RANSOM_CUTOUT_PALETTE.length];
      const tiltDeg = ((idx % 2 === 0 ? 1 : -1) * 3.5).toFixed(1);
      return (
        <span
          style={{ transform: `rotate(${tiltDeg}deg)` }}
          className={`inline-flex items-center justify-center font-display font-extrabold select-none px-2.5 sm:px-3.5 py-1 sm:py-1.5 mx-0.5 rounded-md ${framedTextSize} ${paletteClass}`}
        >
          {item.char}
        </span>
      );
    }

    // 8. 'toy-box' -> 立体玩具积木外框 (3D beveled toy block tile with tactile bottom lip)
    if (visualMode === 'toy-box') {
      const boxPalette = TOY_BOX_PALETTE[idx % TOY_BOX_PALETTE.length];
      return (
        <span
          className={`inline-flex items-center justify-center font-gummy font-bold select-none px-2.5 sm:px-3.5 py-1 sm:py-2 mx-0.5 rounded-xl border-2 ${framedTextSize} ${boxPalette}`}
        >
          {item.char}
        </span>
      );
    }

    // 9. 'keycap-box' -> 机械键帽外框 (PBT sculpted spherical keycap frame with inner dish)
    if (visualMode === 'keycap-box') {
      return (
        <span
          className={`inline-flex items-center justify-center font-mono font-bold select-none px-2.5 sm:px-3.5 pt-1 pb-2 mx-0.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-gradient-to-b from-white to-[#EBE7DF] dark:from-zinc-800 dark:to-zinc-900 shadow-[0_5px_0_#C7C1B5,inset_0_1px_1px_#FFFFFF] dark:shadow-[0_5px_0_#18181B,inset_0_1px_1px_rgba(255,255,255,0.12)] ${framedTextSize} ${vowelColor}`}
        >
          {item.char.toUpperCase()}
        </span>
      );
    }

    // 10. 'neon-box' -> 赛博灯牌外框 (Glowing neon frame card with corner indicator)
    return (
      <span
        className={`relative inline-flex items-center justify-center font-syne-wide font-extrabold select-none px-2.5 sm:px-3.5 py-1 sm:py-1.5 mx-0.5 rounded-lg bg-zinc-950 text-white border-2 ${
          isVowel && vowelXRay
            ? 'border-[#D94625] text-[#FF6B4A] shadow-[0_0_14px_rgba(217,70,37,0.45)]'
            : 'border-teal-400 text-teal-300 shadow-[0_0_14px_rgba(45,212,191,0.35)]'
        } ${framedTextSize}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current absolute top-1 right-1 opacity-75" />
        {item.char}
      </span>
    );
  };

  return (
    <div
      className={
        isImmersive
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#F7F5F0] dark:bg-zinc-950 flex flex-col justify-between p-6 sm:p-10 overflow-hidden transition-colors'
          : 'kf-stage relative w-full flex flex-col overflow-hidden'
      }
    >
      {/* Hidden SVG Filter Definitions for Direct Glyph Stroke Deformation (Gummy 3D Specular Jelly, Liquid Ink Melt & Pixel Dilate) */}
      <svg aria-hidden="true" className="sr-only w-0 h-0 absolute">
        <defs>
          {/* Gummy Q弹 3D Specular Jelly Highlight Filter directly on the glyph strokes */}
          <filter
            id="glyph-gummy-specular"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation="2.4"
              result="blur"
            />
            <feSpecularLighting
              in="blur"
              surfaceScale="5"
              specularConstant="0.95"
              specularExponent="22"
              lightingColor="#ffffff"
              result="specOut"
            >
              <fePointLight x="-60" y="-90" z="160" />
            </feSpecularLighting>
            <feComposite
              in="specOut"
              in2="SourceAlpha"
              operator="in"
              result="specOut"
            />
            <feComposite
              in="SourceGraphic"
              in2="specOut"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="0.7"
              k4="0"
              result="litPaint"
            />
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="2"
              floodColor="#D94625"
              floodOpacity="0.22"
            />
          </filter>

          {/* Liquid Ink Turbulence Filter */}
          <filter
            id="glyph-liquid-filter"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.028 0.045"
              numOctaves="2"
              seed={Math.floor(waveTick / 4)}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={isImmersive ? '9' : '5.5'}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Pixel Matrix Dilate Filter */}
          <filter
            id="glyph-pixel-filter"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
          >
            <feMorphology operator="dilate" radius="0.6" />
          </filter>
        </defs>
      </svg>

      {/* Subtle Studio Grid Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(#A1A1AA 1px, transparent 1px)',
          backgroundSize: isImmersive ? '28px 28px' : '20px 20px',
        }}
      />

      {/* Live SVG Parabolic Laser Trajectory Arcs from Bottom Edge to Word Stage */}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-0"
      >
        <AnimatePresence>
          {laserArcs.map((arc) => {
            const ctrlX = (arc.startX + arc.endX) / 2;
            const pathData = `M ${arc.startX} 100 Q ${ctrlX} 15 ${arc.endX} 50`;
            return (
              <motion.path
                key={arc.id}
                d={pathData}
                fill="none"
                stroke={arc.color}
                strokeWidth={isImmersive ? '0.5' : '0.8'}
                strokeDasharray="3 2"
                initial={{ pathLength: 0, opacity: 0.9 }}
                animate={{ pathLength: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.48, ease: 'easeOut' }}
              />
            );
          })}
        </AnimatePresence>
      </svg>

      {/* Center Kinetic Typography & Matter.js Physics Arena */}
      <div
        ref={arenaRef}
        className={`relative z-10 flex-1 flex flex-col items-center justify-center ${
          isImmersive
            ? 'py-8 min-h-[58vh]'
            : 'min-h-[225px] sm:min-h-[250px] py-5'
        }`}
      >
        {/* Keystroke Force-Field Waves */}
        {physicsEnabled && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            {/* Expanding Keystroke Force-Field Shockwave Rings */}
            <AnimatePresence>
              {forceWaves.map((fw) => (
                <motion.span
                  key={fw.id}
                  initial={{ scale: 0.2, opacity: 0.7 }}
                  animate={{ scale: 4.2, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65, ease: 'easeOut' }}
                  style={{
                    left: `${fw.xPercent}%`,
                    top: `${fw.yPercent}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#D94625]/45 dark:border-amber-400/45"
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Particle Burst Layer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
          <AnimatePresence>
            {particles.map((p) => {
              const scaleMult = isImmersive ? 1.65 : 1;
              return (
                <motion.span
                  key={p.id}
                  initial={{
                    opacity: 0.95,
                    x: p.x * scaleMult,
                    y: p.y * scaleMult,
                    scale: scaleMult,
                    rotate: 0,
                  }}
                  animate={{
                    opacity: 0,
                    x: (p.x + p.dx) * scaleMult,
                    y: (p.y + p.dy) * scaleMult,
                    scale: 0.15,
                    rotate: p.shape === 'diamond' ? 225 : 140,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.62, ease: 'easeOut' }}
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                  }}
                  className={`absolute left-1/2 top-1/2 ${
                    p.shape === 'circle'
                      ? 'rounded-full'
                      : p.shape === 'diamond'
                      ? 'rotate-45 rounded-xs'
                      : 'rounded-xs'
                  }`}
                />
              );
            })}
          </AnimatePresence>
        </div>

        {/* Celebratory Forged Stamp Banner when Enter is pressed */}
        <AnimatePresence>
          {forgedBanner && (
            <motion.div
              key={forgedBanner.word + forgedBanner.wpm}
              initial={{ opacity: 0, y: 24, scale: 0.85 }}
              animate={{
                opacity: 1,
                y: isImmersive ? -125 : -68,
                scale: isImmersive ? 1.25 : 1,
              }}
              exit={{ opacity: 0, y: isImmersive ? -165 : -98, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              className="pointer-events-none absolute z-30 flex items-center gap-2.5 px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-amber-400 text-white dark:text-zinc-950 shadow-lg text-xs sm:text-sm font-mono"
            >
              <Sparkles className="w-4 h-4 text-[#D94625] dark:text-zinc-950" />
              <span>已收录：{forgedBanner.word}</span>
              <span aria-hidden="true">·</span>

            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Animated Word Display — Unified Per-Mode Deformed Glyphs */}
        <motion.div
          animate={
            errorShake
              ? { x: [-12, 12, -10, 10, -5, 0] }
              : { x: carriageOffsetPx }
          }
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          className={`relative z-20 flex items-baseline justify-center flex-wrap ${
            isImmersive
              ? 'gap-2 sm:gap-3.5 px-8 py-6 min-h-[160px] max-w-6xl'
              : 'gap-1 sm:gap-2 px-4 py-3 min-h-[92px]'
          }`}
        >
          {workspaceMode === 'guided' && targetVocab ? (
            targetVocab.word.split('').map((targetChar, idx) => {
              const typedItem = typedChars[idx];
              const isTyped = Boolean(typedItem);
              const isCurrentSlot = idx === typedChars.length;
              const keyPos = getKeyNormalizedPosition(targetChar);
              const gummy = gummyOffsets[idx];
              const isGummy = visualMode === 'gummy';

              return (
                <div
                  key={`${targetVocab.word}-${idx}`}
                  className="relative inline-flex items-baseline justify-center"
                >
                  <AnimatePresence mode="popLayout">
                    {isTyped ? (
                      <motion.span
                        key={typedItem.id}
                        onMouseEnter={() => {
                          triggerGummyLetterForce(idx, 1.0, false);
                          onPluckLetter(typedItem.id, idx);
                        }}
                        onClick={() => {
                          triggerGummyLetterForce(idx, 1.35, false);
                          onToggleSingleLetterSuper(typedItem.id, idx);
                        }}
                        initial={{
                          opacity: 0,
                          x: typedItem.sourceX * (isImmersive ? 340 : 195),
                          y: isImmersive ? 250 : 135,
                          scaleX: isGummy ? 1.75 : 1.5,
                          scaleY: isGummy ? 0.35 : 0.4,
                          rotate: typedItem.tilt * 4,
                        }}
                        animate={{
                          opacity: 1,
                          x: isGummy && gummy ? gummy.dx : 0,
                          y:
                            isGummy && gummy
                              ? gummy.dy
                              : visualMode === 'voxel'
                              ? Math.sin(
                                  (waveTick + idx * 38) * (Math.PI / 180)
                                ) * (isImmersive ? 14 : 7)
                              : 0,
                          scaleX:
                            (typedItem.isSuper ? 1.38 : 1) *
                            (isGummy && gummy ? gummy.squashX : 1),
                          scaleY:
                            (typedItem.isSuper ? 1.48 : 1) *
                            (isGummy && gummy ? gummy.squashY : 1),
                          rotate: isGummy && gummy ? gummy.rot : 0,
                        }}
                        whileHover={{
                          y: isImmersive ? -18 : -10,
                          scaleY: 1.38,
                          scaleX: 0.84,
                        }}
                        exit={{ opacity: 0, scaleY: 2.0, scaleX: 0.25, y: -45 }}
                        transition={{
                          type: 'spring',
                          stiffness: isGummy ? 320 : 360,
                          damping: isGummy ? 10 : 14,
                          mass: 0.72,
                        }}
                        className="inline-block cursor-pointer"
                        title="点击或划过字母：触发软糖碰撞挤压并向左右相邻字母传递位移"
                      >
                        {renderUnifiedDeformedGlyph(typedItem, idx)}
                      </motion.span>
                    ) : (
                      <span
                        className={`inline-block transition-all select-none ${
                          visualMode === 'gummy'
                            ? 'font-gummy'
                            : visualMode === 'voxel'
                            ? 'font-pixel-bare'
                            : 'font-display'
                        } ${
                          isImmersive
                            ? 'px-1.5 text-6xl sm:text-8xl md:text-9xl'
                            : 'px-1 text-4xl sm:text-6xl'
                        } font-bold ${
                          isCurrentSlot
                            ? 'text-[#D94625]/70 dark:text-amber-400/70 underline decoration-wavy decoration-2 underline-offset-8 scale-105'
                            : 'text-zinc-300/65 dark:text-zinc-700/65'
                        }`}
                        title={`对应键位方向: ${
                          targetChar === ' '
                            ? '底部空格键 (Space)'
                            : keyPos.x < 0
                            ? '左手区'
                            : '右手区'
                        }`}
                      >
                        {targetChar === ' ' ? '‿' : targetChar}
                      </span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            /* Free Entry Mode: Unified Per-Mode Deforming Glyphs + Gummy Collision Neighbor Offsets */
            <>
              <AnimatePresence mode="popLayout">
                {typedChars.length === 0 ? (
                  null
                ) : (
                  typedChars.map((item, idx) => {
                    const gummy = gummyOffsets[idx];
                    const isGummy = visualMode === 'gummy';
                    return (
                      <motion.span
                        key={item.id}
                        layout
                        onMouseEnter={() => {
                          triggerGummyLetterForce(idx, 1.0, false);
                          onPluckLetter(item.id, idx);
                        }}
                        onClick={() => {
                          triggerGummyLetterForce(idx, 1.35, false);
                          onToggleSingleLetterSuper(item.id, idx);
                        }}
                        initial={{
                          opacity: 0,
                          x: item.sourceX * (isImmersive ? 380 : 215),
                          y: isImmersive ? 260 : 140,
                          scaleX: isGummy ? 1.85 : 1.6,
                          scaleY: isGummy ? 0.32 : 0.35,
                        }}
                        animate={{
                          opacity: 1,
                          x: isGummy && gummy ? gummy.dx : 0,
                          y:
                            isGummy && gummy
                              ? gummy.dy
                              : visualMode === 'voxel'
                              ? Math.sin(
                                  (waveTick + idx * 42) * (Math.PI / 180)
                                ) * (isImmersive ? 15 : 8)
                              : 0,
                          scaleX:
                            (item.isSuper ? 1.38 : 1) *
                            (isGummy && gummy ? gummy.squashX : 1),
                          scaleY:
                            (item.isSuper ? 1.48 : 1) *
                            (isGummy && gummy ? gummy.squashY : 1),
                          rotate: isGummy && gummy ? gummy.rot : 0,
                        }}
                        whileHover={{
                          y: isImmersive ? -18 : -10,
                          scaleY: 1.42,
                          scaleX: 0.8,
                        }}
                        exit={{
                          opacity: 0,
                          y: 55,
                          scaleY: 2.0,
                          scaleX: 0.2,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: isGummy ? 310 : 350,
                          damping: isGummy ? 9.5 : 13,
                          mass: 0.7,
                        }}
                        className="inline-block cursor-pointer"
                        title="点击或划过字母：触发软糖碰撞挤压并向左右相邻字母传递位移"
                      >
                        {renderUnifiedDeformedGlyph(item, idx)}
                      </motion.span>
                    );
                  })
                )}
              </AnimatePresence>

              {/* Animated Kinetic Caret */}
              {typedChars.length > 0 && <motion.span
                animate={{ opacity: [1, 0.2, 1], scaleY: [1, 0.85, 1] }}
                transition={{ duration: 0.9, repeat: Infinity }}
                className={`inline-block rounded-full bg-[#D94625] ml-1.5 self-center ${
                  isImmersive ? 'w-2 h-16 sm:h-24' : 'w-1 h-9 sm:h-11'
                }`}
              />}
            </>
          )}
        </motion.div>
      </div>

    </div>
  );
};
