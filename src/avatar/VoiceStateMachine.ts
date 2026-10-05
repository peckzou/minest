/**
 * VoiceStateMachine.ts
 * 
 * 任务 3：建立统一 Voice State Machine
 * 
 * 核心设计：
 * 1. 将 Route A (Kwami LiveKit WebRTC) 与 Route B (Open LLM Direct) 统一归一化为 6 个核心状态：
 *    - DISCONNECTED: 未连接/静止离线
 *    - IDLE: 已连接，环境待机
 *    - LISTENING: 正在捕捉用户语音 / 麦克风活跃
 *    - THINKING: 用户停止说话，等待首字或首个音素返回 (TTFT 阶段)
 *    - TALKING: 语音正在回放，音频振幅与 Viseme 输出中
 *    - INTERRUPTED: 用户中途打断 (Barge-in)，紧急刹车回退到 LISTENING
 * 
 * 2. 两个语音引擎都只向本状态机发布事件；本状态机再统一驱动 IAvatarActionAPI，
 *    彻底隔离了语音网络层与 Avatar 表现层。
 */

import { IAvatarActionAPI, AvatarStateType } from './AvatarActionAPI';

export type UnifiedVoiceState =
  | 'DISCONNECTED'
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'TALKING'
  | 'INTERRUPTED';

export type VoiceRouteType = 'A' | 'B'; // 'A': Kwami LiveKit | 'B': Open LLM Direct

export interface VoiceStateEventListener {
  (state: UnifiedVoiceState, previousState: UnifiedVoiceState, metadata?: Record<string, unknown>): void;
}

export class VoiceStateMachine {
  private currentState: UnifiedVoiceState = 'DISCONNECTED';
  private previousState: UnifiedVoiceState = 'DISCONNECTED';
  private avatarApi: IAvatarActionAPI;
  private listeners: Set<VoiceStateEventListener> = new Set();

  public currentRoute: VoiceRouteType = 'B';

  constructor(avatarApi: IAvatarActionAPI) {
    this.avatarApi = avatarApi;
  }

  public getState(): UnifiedVoiceState {
    return this.currentState;
  }

  public subscribe(listener: VoiceStateEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 状态跃迁核心分发
   */
  public transitionTo(nextState: UnifiedVoiceState, metadata?: Record<string, unknown>): void {
    if (this.currentState === nextState) return;

    this.previousState = this.currentState;
    this.currentState = nextState;

    // 1. 同步映射到 Avatar Action API 状态
    this.syncToAvatarState(nextState);

    // 2. 广播给 UI 观察者
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentState, this.previousState, metadata);
      } catch (err) {
        console.error('[VoiceStateMachine] Listener error:', err);
      }
    });
  }

  /**
   * 统一映射表：Voice 状态 -> Avatar Action API 状态
   */
  private syncToAvatarState(voiceState: UnifiedVoiceState): void {
    let targetAvatarState: AvatarStateType = 'idle';

    switch (voiceState) {
      case 'DISCONNECTED':
        targetAvatarState = 'idle';
        this.avatarApi.setAudioAmplitude(0);
        this.avatarApi.setViseme('sil', 0);
        break;

      case 'IDLE':
        targetAvatarState = 'idle';
        this.avatarApi.setAudioAmplitude(0);
        this.avatarApi.setViseme('sil', 0);
        break;

      case 'LISTENING':
        targetAvatarState = 'listening';
        this.avatarApi.setAudioAmplitude(0);
        this.avatarApi.setViseme('sil', 0);
        break;

      case 'THINKING':
        targetAvatarState = 'thinking';
        this.avatarApi.setAudioAmplitude(0);
        this.avatarApi.setViseme('sil', 0);
        break;

      case 'TALKING':
        targetAvatarState = 'talking';
        break;

      case 'INTERRUPTED':
        // 打断时：瞬间刹车停口，随后立即过渡到聆听
        this.avatarApi.setAudioAmplitude(0);
        this.avatarApi.setViseme('sil', 0);
        targetAvatarState = 'listening';
        break;
    }

    this.avatarApi.setState(targetAvatarState);
  }

  /**
   * 引擎通用生命周期快捷接入封装 (供 Route A / Route B 适配器调用)
   */
  public notifyConnect(): void {
    this.transitionTo('IDLE');
  }

  public notifyDisconnect(): void {
    this.transitionTo('DISCONNECTED');
  }

  public notifyUserSpeechStart(): void {
    if (this.currentState === 'TALKING') {
      // 触发打断
      this.transitionTo('INTERRUPTED');
      setTimeout(() => this.transitionTo('LISTENING'), 50);
    } else {
      this.transitionTo('LISTENING');
    }
  }

  public notifyUserSpeechEnd(): void {
    this.transitionTo('THINKING');
  }

  public notifyAISpeechStart(): void {
    this.transitionTo('TALKING');
  }

  public notifyAISpeechEnd(): void {
    this.transitionTo('LISTENING');
  }

  public notifyAudioAmplitude(amplitude: number): void {
    if (this.currentState === 'TALKING') {
      this.avatarApi.setAudioAmplitude(amplitude);
    }
  }

  public notifyViseme(viseme: any, weight: number): void {
    if (this.currentState === 'TALKING') {
      this.avatarApi.setViseme(viseme, weight);
    }
  }
}
