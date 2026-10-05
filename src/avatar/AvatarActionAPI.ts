/**
 * AvatarActionAPI.ts
 * 
 * 任务 1：统一 Avatar Action API 接口定义
 * 
 * 核心原则：
 * 1. 上层代码（UI、业务逻辑、Voice 管道）只能调用此接口，绝不直接操作 Three.js Bone 或 MorphTarget。
 * 2. 状态、动作、表情、视线、眨眼全部抽象为语义指令。
 */

export type AvatarStateType =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'talking'
  | 'speaking'
  | 'happy'
  | 'excited'
  | 'curious'
  | 'surprised'
  | 'shy'
  | 'sleeping';

export type AvatarActionType =
  | 'wave'
  | 'scratch_head'
  | 'curl_tip'
  | 'poke'
  | 'tentacle_touch'
  | 'explore_reach'
  | 'cute_tilt'
  | 'happy_pop'
  | 'spiral_dance'
  | 'drum_tap'
  | 'shy_cover';

export type AvatarExpressionType =
  | 'neutral'
  | 'happy'
  | 'curious'
  | 'excited'
  | 'confused'
  | 'thinking'
  | 'surprised'
  | 'sleepy'
  | 'proud';

export type VisemeType =
  | 'sil'
  | 'aa'
  | 'ee'
  | 'oh'
  | 'oo'
  | 'ff'
  | 'mm';

export interface LookAtTarget {
  x: number; // -1.0 (left) ~ 1.0 (right)
  y: number; // -1.0 (down) ~ 1.0 (up)
}

export interface IAvatarActionAPI {
  // --- 状态流转 ---
  setState(state: AvatarStateType, transitionDuration?: number): void;
  getState(): AvatarStateType;

  // --- 离散动作触发 ---
  playAction(action: AvatarActionType, options?: { duration?: number; intensity?: number }): void;

  // --- 表情图层叠加 ---
  setExpression(expression: AvatarExpressionType, intensity?: number): void;
  getExpression(): { type: AvatarExpressionType; intensity: number };

  // --- 眨眼与眼动 ---
  blink(doubleBlink?: boolean): void;
  setLookAt(target: LookAtTarget): void;

  // --- 语音与口型 ---
  setAudioAmplitude(amplitude: number): void;
  setViseme(viseme: VisemeType, weight?: number): void;

  // --- 触觉/物理交互 ---
  poke(force?: number): void;

  // --- 销毁与重置 ---
  reset(): void;
  dispose(): void;
}
