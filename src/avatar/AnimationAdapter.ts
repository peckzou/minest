/**
 * AnimationAdapter.ts
 * 
 * 任务 2 强化：解耦配置化 Mapping，并全面支持“骨骼已存在、Morph Targets 暂时缺失”的 Fallback 状态。
 * 
 * 核心设计准则：
 * 1. 严格只读模型：不修改任何 GLB、骨骼、Rig 或 Blender 文件。
 * 2. 映射彻底配置化：提供 updateMappingConfig() / loadSkeletonConfig()，等 Codex 确认真实层级与名称后注入即可生效。
 * 3. 稳健 Fallback 机制：
 *    - 如果 Mesh 上不存在指定的 Morph Target 或 morphTargetDictionary 为空，自动跳过，绝对不报错、不抛异常、不中断骨骼动画循环。
 *    - 严禁自己伪造嘴型或用任何 JS scale/rotation/hack 模拟嘴部几何形变；在 Morph 缺失期间，面部静止保持 placeholder，专注全速运行骨骼 Skeleton Actions。
 * 4. 完整保留原 AI Studio 的核心二阶动力学与程序化算法（Wave, Scratch Head, Curl Tip, Poke, Spiral Dance, Breathing, Spring-Mass-Damper）。
 */

import * as THREE from 'three';
import {
  IAvatarActionAPI,
  AvatarStateType,
  AvatarActionType,
  AvatarExpressionType,
  VisemeType,
  LookAtTarget,
} from './AvatarActionAPI';

/**
 * --------------------------------------------------------------------------------
 * 1. 骨骼与 MorphTarget 配置接口 (支持运行时配置注入)
 * --------------------------------------------------------------------------------
 */
export interface RodinTentacleJointConfig {
  id: number;
  name: string;
  role: 'front_hand' | 'side_accent' | 'back_support';
  /**
   * 骨骼链节点名称 (按序：根部 -> 中间 -> 末梢)
   * 运行时会自动在 SkinnedMesh / Skeleton 中递归查找对应的 Bone 节点
   */
  joints: string[];
}

export interface RodinSkeletonConfig {
  rootBoneName: string;
  headBoneName: string;
  tentacles: RodinTentacleJointConfig[];
}

export interface RodinMorphTargetConfig {
  // 眼部 BlendShapes (暂时占位)
  eyeBlinkLeft?: string;
  eyeBlinkRight?: string;
  eyeHappy?: string;
  eyeWide?: string;
  eyeSquint?: string;
  // 嘴部音素 BlendShapes (暂时占位，无 BlendShape 时静默跳过，绝不用代码伪造变形)
  mouthOpen?: string;   // Viseme: aa
  mouthWide?: string;   // Viseme: ee
  mouthO?: string;      // Viseme: oh
  mouthPucker?: string; // Viseme: oo
  mouthBite?: string;   // Viseme: ff
  mouthClose?: string;  // Viseme: mm
  mouthSmile?: string;  // 表情: smile
}

export interface AvatarMappingConfig {
  skeleton: RodinSkeletonConfig;
  morphTargets: RodinMorphTargetConfig;
  /**
   * 当检测到 Morph Target 缺失时，是否静默处理（默认 true，确保骨骼动作顺畅执行）
   */
  silentFallbackOnMissingMorphs?: boolean;
}

/**
 * 默认 Placeholder 配置 (Codex 确认最终规范后动态覆盖)
 */
export const DEFAULT_MAPPING_CONFIG: AvatarMappingConfig = {
  skeleton: {
    rootBoneName: '__RODIN_ROOT_BONE_PLACEHOLDER__',
    headBoneName: '__RODIN_HEAD_BONE_PLACEHOLDER__',
    tentacles: [
      { id: 0, name: 'Tentacle_Front_L', role: 'front_hand', joints: ['__BONE_T0_J0__', '__BONE_T0_J1__', '__BONE_T0_J2__', '__BONE_T0_J3__'] },
      { id: 1, name: 'Tentacle_Side_L', role: 'side_accent', joints: ['__BONE_T1_J0__', '__BONE_T1_J1__', '__BONE_T1_J2__', '__BONE_T1_J3__'] },
      { id: 2, name: 'Tentacle_Back_L', role: 'back_support', joints: ['__BONE_T2_J0__', '__BONE_T2_J1__', '__BONE_T2_J2__', '__BONE_T2_J3__'] },
      { id: 3, name: 'Tentacle_Back_ML', role: 'back_support', joints: ['__BONE_T3_J0__', '__BONE_T3_J1__', '__BONE_T3_J2__', '__BONE_T3_J3__'] },
      { id: 4, name: 'Tentacle_Back_MR', role: 'back_support', joints: ['__BONE_T4_J0__', '__BONE_T4_J1__', '__BONE_T4_J2__', '__BONE_T4_J3__'] },
      { id: 5, name: 'Tentacle_Back_R', role: 'back_support', joints: ['__BONE_T5_J0__', '__BONE_T5_J1__', '__BONE_T5_J2__', '__BONE_T5_J3__'] },
      { id: 6, name: 'Tentacle_Side_R', role: 'side_accent', joints: ['__BONE_T6_J0__', '__BONE_T6_J1__', '__BONE_T6_J2__', '__BONE_T6_J3__'] },
      { id: 7, name: 'Tentacle_Front_R', role: 'front_hand', joints: ['__BONE_T7_J0__', '__BONE_T7_J1__', '__BONE_T7_J2__', '__BONE_T7_J3__'] },
    ],
  },
  morphTargets: {
    eyeBlinkLeft: '__MORPH_EYE_BLINK_L__',
    eyeBlinkRight: '__MORPH_EYE_BLINK_R__',
    eyeHappy: '__MORPH_EYE_HAPPY__',
    eyeWide: '__MORPH_EYE_WIDE__',
    eyeSquint: '__MORPH_EYE_SQUINT__',
    mouthOpen: '__MORPH_MOUTH_OPEN__',
    mouthWide: '__MORPH_MOUTH_WIDE__',
    mouthO: '__MORPH_MOUTH_O__',
    mouthPucker: '__MORPH_MOUTH_PUCKER__',
    mouthBite: '__MORPH_MOUTH_BITE__',
    mouthClose: '__MORPH_MOUTH_CLOSE__',
    mouthSmile: '__MORPH_MOUTH_SMILE__',
  },
  silentFallbackOnMissingMorphs: true,
};

/**
 * --------------------------------------------------------------------------------
 * 2. 算法输出缓冲器 (Intermediate Kinematic State)
 * --------------------------------------------------------------------------------
 */
export interface KinematicOutputBuffer {
  rootPosition: THREE.Vector3;
  rootRotation: THREE.Vector3;
  headScale: THREE.Vector3;
  // 各触手关节的局部旋转角 (8 条触手 × 关节列表)
  tentacleJointRotations: THREE.Vector3[][];
  // 变形目标权重缓冲表 (targetName -> 0.0~1.0)
  morphWeights: Record<string, number>;
}

/**
 * --------------------------------------------------------------------------------
 * 3. AnimationAdapter 主类 (实现 IAvatarActionAPI，解耦绑定)
 * --------------------------------------------------------------------------------
 */
export class AnimationAdapter implements IAvatarActionAPI {
  // 当前配置
  private config: AvatarMappingConfig;

  // 绑定的目标 3D 对象缓存
  private targetObject: THREE.Object3D | null = null;
  private resolvedRootBone: THREE.Bone | THREE.Object3D | null = null;
  private resolvedHeadBone: THREE.Bone | THREE.Object3D | null = null;
  private resolvedTentacleBones: Array<Array<THREE.Bone | THREE.Object3D | null>> = [];
  private resolvedSkinnedMeshesWithMorphs: THREE.Mesh[] = [];

  // 状态变量
  private currentState: AvatarStateType = 'idle';
  private targetState: AvatarStateType = 'idle';
  private stateProgress = 1.0;
  private stateDuration = 0.5;

  private currentExpression: AvatarExpressionType = 'neutral';
  private expressionIntensity = 0.0;

  // 动作排程
  private currentAction: AvatarActionType | null = null;
  private actionElapsed = 0;
  private actionDuration = 2.5;

  // 物理与弹簧系统 (二阶阻尼)
  private pos = new THREE.Vector3(0, 0, 0);
  private targetPos = new THREE.Vector3(0, 0, 0);
  private posVel = new THREE.Vector3(0, 0, 0);

  private rot = new THREE.Vector3(0, 0, 0);
  private targetRot = new THREE.Vector3(0, 0, 0);
  private rotVel = new THREE.Vector3(0, 0, 0);

  // Poke 果冻抖动
  private jigglePos = 0;
  private jiggleVel = 0;

  // 眨眼与视线
  private blinkProgress = 0;
  private isBlinking = false;
  private lookAtTarget: LookAtTarget = { x: 0, y: 0 };

  // 语音振幅与音素
  private audioAmplitude = 0;
  private smoothedAmplitude = 0;
  private activeViseme: VisemeType = 'sil';
  private visemeWeight = 0;

  // 输出缓冲
  public output: KinematicOutputBuffer;

  constructor(initialConfig?: Partial<AvatarMappingConfig>) {
    this.config = {
      ...DEFAULT_MAPPING_CONFIG,
      ...initialConfig,
      skeleton: {
        ...DEFAULT_MAPPING_CONFIG.skeleton,
        ...(initialConfig?.skeleton || {}),
      },
      morphTargets: {
        ...DEFAULT_MAPPING_CONFIG.morphTargets,
        ...(initialConfig?.morphTargets || {}),
      },
    };

    this.output = {
      rootPosition: new THREE.Vector3(),
      rootRotation: new THREE.Vector3(),
      headScale: new THREE.Vector3(1, 1, 1),
      tentacleJointRotations: Array.from({ length: 8 }, () =>
        Array.from({ length: 4 }, () => new THREE.Vector3())
      ),
      morphWeights: {},
    };
  }

  /**
   * ----------------------------------------------------------------------------
   * 配置化更新接口 (供后续注入 Codex 真实骨骼层级与名称)
   * ----------------------------------------------------------------------------
   */
  public updateMappingConfig(newConfig: Partial<AvatarMappingConfig>): void {
    if (newConfig.skeleton) {
      this.config.skeleton = { ...this.config.skeleton, ...newConfig.skeleton };
    }
    if (newConfig.morphTargets) {
      this.config.morphTargets = { ...this.config.morphTargets, ...newConfig.morphTargets };
    }
    if (newConfig.silentFallbackOnMissingMorphs !== undefined) {
      this.config.silentFallbackOnMissingMorphs = newConfig.silentFallbackOnMissingMorphs;
    }

    // 若已绑定模型，重新解析节点
    if (this.targetObject) {
      this.bindModel(this.targetObject);
    }
  }

  public getMappingConfig(): AvatarMappingConfig {
    return this.config;
  }

  /**
   * 将 Adapter 绑定到某个 3D 根节点（GLTF scene 或 SkinnedMesh）
   * 会安全扫描骨骼和 MorphTargets，不存在也不会报错。
   */
  public bindModel(rootObject: THREE.Object3D): void {
    this.targetObject = rootObject;
    this.resolvedTentacleBones = [];
    this.resolvedSkinnedMeshesWithMorphs = [];

    // 1. 安全查找 Root 骨骼与 Head 骨骼
    this.resolvedRootBone = this.findNodeByName(rootObject, this.config.skeleton.rootBoneName);
    this.resolvedHeadBone = this.findNodeByName(rootObject, this.config.skeleton.headBoneName);

    // 2. 安全查找 8 条触手的所有关节骨骼
    for (let t = 0; t < 8; t++) {
      const tentConfig = this.config.skeleton.tentacles[t];
      const joints: Array<THREE.Bone | THREE.Object3D | null> = [];
      if (tentConfig && Array.isArray(tentConfig.joints)) {
        for (const jointName of tentConfig.joints) {
          joints.push(this.findNodeByName(rootObject, jointName));
        }
      }
      this.resolvedTentacleBones.push(joints);
    }

    // 3. 安全搜集包含 Morph Targets 的 Mesh（如果完全没有，fallback 机制接管，绝不抛异常）
    rootObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          this.resolvedSkinnedMeshesWithMorphs.push(mesh);
        }
      }
    });
  }

  private findNodeByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
    if (!name || name.startsWith('__')) return null;
    let found: THREE.Object3D | null = null;
    root.traverse((node) => {
      if (!found && node.name === name) {
        found = node;
      }
    });
    return found;
  }

  // ==================== IAvatarActionAPI 实现 ====================

  public setState(state: AvatarStateType, transitionDuration = 0.5): void {
    if (state === 'talking') state = 'speaking';
    if (this.targetState === state && this.stateProgress >= 1.0) return;
    this.targetState = state;
    this.stateProgress = 0;
    this.stateDuration = transitionDuration;

    if (state === 'surprised') {
      this.poke(0.5);
    } else if (state === 'happy' || state === 'excited') {
      this.poke(0.28);
    }
  }

  public getState(): AvatarStateType {
    return this.currentState;
  }

  public playAction(action: AvatarActionType, options?: { duration?: number; intensity?: number }): void {
    this.currentAction = action;
    this.actionElapsed = 0;
    this.actionDuration = options?.duration || this.getDefaultActionDuration(action);

    if (action === 'poke') {
      this.poke(options?.intensity || 0.35);
    }
  }

  public setExpression(expression: AvatarExpressionType, intensity = 1.0): void {
    this.currentExpression = expression;
    this.expressionIntensity = Math.min(Math.max(intensity, 0), 1);
  }

  public getExpression(): { type: AvatarExpressionType; intensity: number } {
    return { type: this.currentExpression, intensity: this.expressionIntensity };
  }

  public blink(doubleBlink = false): void {
    this.isBlinking = true;
    this.blinkProgress = 0;
  }

  public setLookAt(target: LookAtTarget): void {
    this.lookAtTarget.x = Math.min(Math.max(target.x, -1), 1);
    this.lookAtTarget.y = Math.min(Math.max(target.y, -1), 1);
  }

  public setAudioAmplitude(amplitude: number): void {
    this.audioAmplitude = Math.min(Math.max(amplitude, 0), 1);
  }

  public setViseme(viseme: VisemeType, weight = 1.0): void {
    this.activeViseme = viseme;
    this.visemeWeight = weight;
  }

  public poke(force = 0.35): void {
    this.jiggleVel += force;
  }

  public reset(): void {
    this.setState('idle', 0.1);
    this.setExpression('neutral', 0);
    this.currentAction = null;
    this.audioAmplitude = 0;
    this.smoothedAmplitude = 0;
    this.activeViseme = 'sil';
  }

  public dispose(): void {
    this.reset();
    this.targetObject = null;
    this.resolvedRootBone = null;
    this.resolvedHeadBone = null;
    this.resolvedTentacleBones = [];
    this.resolvedSkinnedMeshesWithMorphs = [];
  }

  // ==================== 主动画循环更新 ====================

  public update(delta: number, elapsed: number): void {
    // 1. 平滑音频输入
    const smoothing = this.audioAmplitude > this.smoothedAmplitude ? 0.45 : 0.18;
    this.smoothedAmplitude += (this.audioAmplitude - this.smoothedAmplitude) * smoothing;

    // 2. 状态过渡插值
    if (this.stateProgress < 1.0) {
      this.stateProgress += delta / Math.max(this.stateDuration, 0.05);
      if (this.stateProgress >= 1.0) {
        this.stateProgress = 1.0;
        this.currentState = this.targetState;
      }
    }

    // 3. 动作计时器
    if (this.currentAction) {
      this.actionElapsed += delta;
      if (this.actionElapsed >= this.actionDuration) {
        this.currentAction = null;
      }
    }

    // 4. Poke 果冻阻尼震颤 (二阶微积分计算)
    const kMantle = 140.0;
    const cMantle = 8.5;
    const accMantle = -kMantle * this.jigglePos - cMantle * this.jiggleVel;
    this.jiggleVel += accMantle * delta;
    this.jigglePos += this.jiggleVel * delta;

    // 5. 计算机械目标 (Position, Rotation)
    this.computeProceduralKinematics(delta, elapsed);

    // 6. 二阶弹簧计算躯体物理位置
    this.solveBodySpringPhysics(delta);

    // 7. 写入输出缓冲区
    this.output.rootPosition.copy(this.pos);
    this.output.rootRotation.copy(this.rot);

    // 8. 触手程序化算法输出 (Wave / Scratch / Curl Tip / Spiral / Breathing)
    this.computeProceduralTentacles(delta, elapsed);

    // 9. 形变目标权重计算 (如果无 MorphTarget 则静默处理，严禁自造变形)
    this.computeMorphWeights(delta);

    // 10. 将缓冲区数据应用到真实骨骼和 MorphTargets (带 Fallback 保护)
    this.applyToBoundModel();
  }

  private getDefaultActionDuration(action: AvatarActionType): number {
    switch (action) {
      case 'happy_pop': return 1.4;
      case 'wave': return 3.0;
      case 'spiral_dance': return 3.4;
      case 'drum_tap': return 2.6;
      case 'scratch_head': return 2.8;
      default: return 2.5;
    }
  }

  private computeProceduralKinematics(delta: number, elapsed: number): void {
    const t = elapsed;
    let tY = 0;
    let tZ = 0;
    let rX = 0;
    let rY = 0;
    let rZ = 0;

    switch (this.targetState) {
      case 'idle': {
        const breath = Math.sin(t * 1.6) + Math.sin(t * 3.2) * 0.15;
        tY = breath * 0.035;
        rX = Math.sin(t * 0.8) * 0.015;
        rY = Math.sin(t * 0.45) * 0.025;
        rZ = Math.sin(t * 1.1) * 0.012;
        break;
      }
      case 'listening': {
        tZ = 0.22;
        tY = -0.04;
        rX = 0.12; // 身体前倾聆听
        break;
      }
      case 'thinking': {
        rZ = 0.14 + Math.sin(t * 1.5) * 0.06; // 歪头沉思
        rY = 0.08;
        rX = -0.04;
        break;
      }
      case 'speaking': {
        const amp = this.smoothedAmplitude;
        tY = Math.sin(t * 12.0) * amp * 0.07;
        rX = Math.sin(t * 6.5) * amp * 0.07 + 0.04; // 说话时伴随重音微点头
        break;
      }
      case 'happy': {
        const bounce = Math.abs(Math.sin(t * 5.2)) * 0.2;
        tY = bounce;
        rX = Math.sin(t * 5.2) * 0.05;
        break;
      }
      case 'surprised': {
        tZ = -0.28;
        tY = 0.12;
        rX = -0.15;
        break;
      }
      case 'sleeping': {
        tY = -0.18 + Math.sin(t * 0.85) * 0.025;
        rX = 0.08;
        break;
      }
    }

    // 动作叠加
    if (this.currentAction === 'cute_tilt') {
      const p = Math.sin((this.actionElapsed / this.actionDuration) * Math.PI);
      rZ += 0.22 * p;
    } else if (this.currentAction === 'happy_pop') {
      const p = Math.sin((this.actionElapsed / this.actionDuration) * Math.PI);
      tY += 0.18 * p;
    }

    this.targetPos.set(0, tY, tZ);
    this.targetRot.set(rX, rY, rZ);

    const squash = 1.0 + this.jigglePos;
    this.output.headScale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
  }

  private solveBodySpringPhysics(delta: number): void {
    const kPos = 110.0;
    const cPos = 13.5;
    this.posVel.x += (kPos * (this.targetPos.x - this.pos.x) - cPos * this.posVel.x) * delta;
    this.posVel.y += (kPos * (this.targetPos.y - this.pos.y) - cPos * this.posVel.y) * delta;
    this.posVel.z += (kPos * (this.targetPos.z - this.pos.z) - cPos * this.posVel.z) * delta;
    this.pos.addScaledVector(this.posVel, delta);

    const kRot = 120.0;
    const cRot = 14.0;
    this.rotVel.x += (kRot * (this.targetRot.x - this.rot.x) - cRot * this.rotVel.x) * delta;
    this.rotVel.y += (kRot * (this.targetRot.y - this.rot.y) - cRot * this.rotVel.y) * delta;
    this.rotVel.z += (kRot * (this.targetRot.z - this.rot.z) - cRot * this.rotVel.z) * delta;
    this.rot.addScaledVector(this.rotVel, delta);
  }

  private computeProceduralTentacles(delta: number, elapsed: number): void {
    const t = elapsed;
    const action = this.currentAction;
    const actP = action ? Math.sin(Math.min(this.actionElapsed / this.actionDuration, 1.0) * Math.PI) : 0;

    for (let tentIndex = 0; tentIndex < 8; tentIndex++) {
      const isFrontL = tentIndex === 0;
      const isFrontR = tentIndex === 7;
      const waveOffset = tentIndex * 0.82;

      for (let jIndex = 0; jIndex < 4; jIndex++) {
        const segDelay = jIndex * 0.05;
        const delayedTime = t - segDelay;

        // 默认自然呼吸卷曲
        const baseFlare = jIndex === 0 ? 0.36 : -0.12;
        const spiralCurl = jIndex >= 1 ? -((jIndex) * 0.32) : 0;
        const wander = Math.sin(delayedTime * 1.5 - waveOffset) * 0.04;

        let rotX = baseFlare + spiralCurl + wander;
        let rotY = 0;
        let rotZ = 0;

        // 关键动作算法接入 (保留全部原审计算法)
        if (action === 'wave' && isFrontR) {
          // 八字流体摆动
          const waveSweep = Math.sin(this.actionElapsed * 13.0 - segDelay * 5.0) * 0.45;
          rotX = -0.78 * actP;
          rotY = 0.28 * actP;
          rotZ = (0.42 + waveSweep) * actP;
        } else if (action === 'scratch_head' && isFrontL) {
          // 挠头摩擦
          const rub = Math.sin(this.actionElapsed * 10.0 - segDelay * 3.5) * 0.14;
          rotX = -0.95 * actP;
          rotZ = (-0.52 + rub) * actP;
        } else if (action === 'curl_tip') {
          // 尖端向内紧卷
          rotX += -((jIndex + 1) * 0.48) * actP;
        } else if (action === 'spiral_dance') {
          // 环形波浪舞
          const phase = this.actionElapsed * 7.0 - (tentIndex * (Math.PI / 4.0));
          rotX += Math.sin(phase) * 0.38 * actP;
          rotZ += Math.cos(phase) * 0.22 * actP;
        }

        if (!this.output.tentacleJointRotations[tentIndex]) {
          this.output.tentacleJointRotations[tentIndex] = [];
        }
        if (!this.output.tentacleJointRotations[tentIndex][jIndex]) {
          this.output.tentacleJointRotations[tentIndex][jIndex] = new THREE.Vector3();
        }
        this.output.tentacleJointRotations[tentIndex][jIndex].set(rotX, rotY, rotZ);
      }
    }
  }

  /**
   * 形变目标计算：
   * 严格遵守约束：如果在 placeholder 状态或新模型无 BlendShape，只计算逻辑权重并放入缓冲表，
   * 绝对不用 JS scale/rotation 去破坏性伪造嘴型。
   */
  private computeMorphWeights(delta: number): void {
    const w = this.output.morphWeights;
    const m = this.config.morphTargets;

    // 眨眼
    if (this.isBlinking) {
      this.blinkProgress += delta * 12.0;
      if (this.blinkProgress >= Math.PI) {
        this.blinkProgress = 0;
        this.isBlinking = false;
      }
    }
    const blinkVal = Math.sin(this.blinkProgress);
    if (m.eyeBlinkLeft) w[m.eyeBlinkLeft] = this.currentState === 'sleeping' ? 1.0 : blinkVal;
    if (m.eyeBlinkRight) w[m.eyeBlinkRight] = this.currentState === 'sleeping' ? 1.0 : blinkVal;

    // 表情映射
    if (m.eyeHappy) w[m.eyeHappy] = this.currentExpression === 'happy' || this.currentState === 'happy' ? 1.0 : 0.0;
    if (m.eyeWide) w[m.eyeWide] = this.currentState === 'surprised' ? 1.0 : 0.0;
    if (m.mouthSmile) w[m.mouthSmile] = this.currentState === 'happy' ? 0.8 : 0.4;

    // 音素驱动 (标准映射值)
    const v = this.activeViseme;
    const vw = this.visemeWeight;
    if (m.mouthOpen) w[m.mouthOpen] = v === 'aa' ? 0.88 * vw : 0;
    if (m.mouthWide) w[m.mouthWide] = v === 'ee' ? 1.0 * vw : 0;
    if (m.mouthO) w[m.mouthO] = v === 'oh' ? 0.7 * vw : 0;
    if (m.mouthPucker) w[m.mouthPucker] = v === 'oo' ? 0.9 * vw : 0;
    if (m.mouthBite) w[m.mouthBite] = v === 'ff' ? 0.4 * vw : 0;
    if (m.mouthClose) w[m.mouthClose] = v === 'mm' ? 0.8 * vw : 0;
  }

  /**
   * ----------------------------------------------------------------------------
   * 稳健 Fallback 应用层：
   * 1. 骨骼正常驱动，不受 Morph 缺失影响。
   * 2. Morph 目标如果不存在于 SkinnedMesh 的 morphTargetDictionary 中，静默跳过，
   *    严格杜绝 undefined 错误与运行时中断。
   * ----------------------------------------------------------------------------
   */
  private applyToBoundModel(): void {
    if (!this.targetObject) return;

    // 1. 驱动 Root / Head 骨骼 (若存在)
    if (this.resolvedRootBone) {
      this.resolvedRootBone.position.copy(this.output.rootPosition);
      this.resolvedRootBone.rotation.set(
        this.output.rootRotation.x,
        this.output.rootRotation.y,
        this.output.rootRotation.z
      );
    }

    if (this.resolvedHeadBone) {
      this.resolvedHeadBone.rotation.set(
        this.output.rootRotation.x * 0.6,
        this.output.rootRotation.y * 0.6,
        this.output.rootRotation.z * 0.6
      );
      this.resolvedHeadBone.scale.copy(this.output.headScale);
    }

    // 2. 驱动触手链骨骼 (若存在)
    for (let t = 0; t < 8; t++) {
      const joints = this.resolvedTentacleBones[t];
      const rots = this.output.tentacleJointRotations[t];
      if (!joints || !rots) continue;

      for (let j = 0; j < joints.length; j++) {
        const bone = joints[j];
        const rotVal = rots[j];
        if (bone && rotVal) {
          bone.rotation.set(rotVal.x, rotVal.y, rotVal.z);
        }
      }
    }

    // 3. 驱动 Morph Targets (带安全 Fallback)
    if (this.resolvedSkinnedMeshesWithMorphs.length === 0) {
      // 场景没有 Morph Targets，正常安全退出，绝对不阻断
      return;
    }

    const weights = this.output.morphWeights;
    for (const mesh of this.resolvedSkinnedMeshesWithMorphs) {
      const dict = mesh.morphTargetDictionary;
      const influences = mesh.morphTargetInfluences;
      if (!dict || !influences) continue;

      for (const [targetName, weight] of Object.entries(weights)) {
        if (!targetName || targetName.startsWith('__')) continue;
        const targetIndex = dict[targetName];
        if (targetIndex !== undefined && targetIndex < influences.length) {
          influences[targetIndex] = weight;
        }
      }
    }
  }
}
