/**
 * Minest Hex Badge Summon 8-Phase Animation Sequence Controller
 * Strictly based on design storyboard 4530E4C3-2A2B-4A7E-B52C-2DB392466777.png:
 *
 * 核心节奏：组装 → 锁定 → 激活 → 旋转 → Reveal → 归入 Badge Wall
 *
 * Phase 1: 初始形态 (0 ~ 800ms) - 中央六边形胚体散发微弱冰蓝光芒
 * Phase 2: 外围组件合拢 (800 ~ 1700ms) - 6 个金属卡槽组件错峰弧线飞入
 * Phase 3: 组装完成锁定 (1700 ~ 2200ms) - 组件归位锁定，中心浮雕印章卡入，青色能量充能
 * Phase 4: 能量激活 (2200 ~ 2900ms) - 内部能量注入，双层光环升腾，光效增强
 * Phase 5: 3D 旋转 (2900 ~ 3800ms) - 徽章高速倾斜 3.5 圈，视觉汇聚
 * Phase 6: 最终揭晓 (3800 ~ 4300ms) - 外壳向外碎裂飞散，露出发光真身 Crown Badge
 * Phase 7: 展示停留 (4300 ~ 5400ms) - 皇冠勋章空中悬停，八角星芒光效与粒子绽放
 * Phase 8: 收入 Badge Wall (5400 ~ 6400ms) - 缓缓退后吸入个人 Badge Wall 蓝金卡牌中
 */

import * as THREE from 'three';
import { MinestSummonPack } from './MinestBadgeSummonMeshBuilder';
import { MinestSummonMaterials } from './MinestSummonMaterials';
import { badgeAudio, triggerHaptic } from '../utils/hapticsAndAudio';

export interface MinestPhaseInfo {
  phaseIndex: number;
  nameZh: string;
  nameEn: string;
  timeRange: [number, number];
  summary: string;
}

export const MINEST_8_PHASES: MinestPhaseInfo[] = [
  {
    phaseIndex: 1,
    nameZh: '1 初始形态',
    nameEn: 'Crystal Hex Core',
    timeRange: [0, 800],
    summary: '画面中央出现统一的六边形胚体，散发微弱冰蓝光芒。',
  },
  {
    phaseIndex: 2,
    nameZh: '2 外围组件合拢',
    nameEn: 'Armor Brackets Inbound',
    timeRange: [800, 1700],
    summary: '六个金属外壳组件从四周错峰飞入，依次合拢。',
  },
  {
    phaseIndex: 3,
    nameZh: '3 组装完成锁定',
    nameEn: 'Locked Shell',
    timeRange: [1700, 2200],
    summary: '所有组件严丝合缝归位，外壳完整并发出咔哒物理锁定。',
  },
  {
    phaseIndex: 4,
    nameZh: '4 能量激活',
    nameEn: 'Energy Activation',
    timeRange: [2200, 2900],
    summary: '内部能量注入，双轨道光环升腾，光效层层递进增强。',
  },
  {
    phaseIndex: 5,
    nameZh: '5 3D 高速旋转',
    nameEn: '3D High-Speed Spin',
    timeRange: [2900, 3800],
    summary: '整个徽章高速倾斜 3.5 圈，流光拖尾，视觉聚焦汇聚。',
  },
  {
    phaseIndex: 6,
    nameZh: '6 最终揭晓爆解',
    nameEn: 'Armor Burst Reveal',
    timeRange: [3800, 4300],
    summary: '装甲外壳受力向外爆散，露出真实的 3D 黄金皇冠勋章！',
  },
  {
    phaseIndex: 7,
    nameZh: '7 荣耀展示停留',
    nameEn: 'Showcase Celebration',
    timeRange: [4300, 5400],
    summary: '真身勋章在空中轻微悬浮，伴随神圣星芒与庆祝光效。',
  },
  {
    phaseIndex: 8,
    nameZh: '8 收入 Badge Wall',
    nameEn: 'Archive to Wall',
    timeRange: [5400, 6400],
    summary: '动画结束，Badge 缓缓后退吸入个人专属 Badge Wall 典藏卡。',
  },
];

export class MinestSummonTimelineEngine {
  private pack: MinestSummonPack;
  private mats: MinestSummonMaterials;
  private centerLight: THREE.PointLight;

  public currentTimeMs = 0;
  public readonly TOTAL_DURATION = 6400; // ms
  public isPlaying = false;
  public playbackSpeed = 1.0;

  // Sound triggers to prevent multiple plays per timestamp
  private soundTriggered = {
    p1: false,
    brackets: [false, false, false, false, false, false],
    locked: false,
    energyPulse: false,
    vortexSpin: false,
    burst: false,
    celebrate: false,
    cardArchive: false,
  };

  public onPhaseChange?: (phaseIndex: number, timeMs: number) => void;
  public onComplete?: () => void;
  private currentPhase = 1;

  constructor(pack: MinestSummonPack, mats: MinestSummonMaterials, centerLight: THREE.PointLight) {
    this.pack = pack;
    this.mats = mats;
    this.centerLight = centerLight;
    this.seekTime(0);
  }

  public seekTime(timeMs: number) {
    this.currentTimeMs = Math.max(0, Math.min(this.TOTAL_DURATION, timeMs));
    this.evaluate(this.currentTimeMs);
  }

  public play() {
    if (this.currentTimeMs >= this.TOTAL_DURATION) {
      this.seekTime(0);
      this.resetSoundTriggers();
    }
    this.isPlaying = true;
  }

  public pause() {
    this.isPlaying = false;
  }

  public restart() {
    this.resetSoundTriggers();
    this.seekTime(0);
    this.isPlaying = true;
  }

  private resetSoundTriggers() {
    this.soundTriggered = {
      p1: false,
      brackets: [false, false, false, false, false, false],
      locked: false,
      energyPulse: false,
      vortexSpin: false,
      burst: false,
      celebrate: false,
      cardArchive: false,
    };
  }

  public update(dt: number) {
    if (!this.isPlaying) return;

    this.currentTimeMs += dt * 1000 * this.playbackSpeed;
    if (this.currentTimeMs >= this.TOTAL_DURATION) {
      this.currentTimeMs = this.TOTAL_DURATION;
      this.isPlaying = false;
      if (this.onComplete) this.onComplete();
    }
    this.evaluate(this.currentTimeMs);
  }

  /**
   * Main Phase Evaluator (Zero-GC, Pure Math & Direct Transform updates)
   */
  private evaluate(t: number) {
    // 1. Calculate active phase
    let activePhase = 1;
    for (const p of MINEST_8_PHASES) {
      if (t >= p.timeRange[0] && t <= p.timeRange[1]) {
        activePhase = p.phaseIndex;
        break;
      }
      if (t > p.timeRange[1]) activePhase = p.phaseIndex;
    }

    if (activePhase !== this.currentPhase) {
      this.currentPhase = activePhase;
      if (this.onPhaseChange) this.onPhaseChange(this.currentPhase, t);
    }

    const {
      crystalHex,
      bracketsGroup,
      brackets,
      assembledShell,
      energyVortexRing1,
      energyVortexRing2,
      realCrownBadge,
      badgeWallCard,
      rootGroup,
    } = this.pack;

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 1: 初始形态 (0 ~ 800ms) - 六边形胚体微弱呼吸
    // ─────────────────────────────────────────────────────────────────────────
    if (t < 800) {
      crystalHex.visible = true;
      crystalHex.scale.setScalar(1.0);
      bracketsGroup.visible = false;
      assembledShell.visible = false;
      realCrownBadge.visible = false;
      badgeWallCard.visible = false;

      const p1Progress = t / 800;
      const breathe = Math.sin(p1Progress * Math.PI * 2) * 0.04;
      crystalHex.scale.setScalar(1.0 + breathe);
      this.mats.iceCrystalHex.opacity = 0.65 + breathe * 0.5;

      this.centerLight.intensity = 1.2 + breathe * 1.5;
      this.centerLight.color.setHex(0x00f0ff);
      rootGroup.rotation.set(0, 0, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 2: 外围组件合拢 (800 ~ 1700ms) - 6 个金属卡槽错峰飞入
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 800 && t < 1700) {
      crystalHex.visible = true;
      bracketsGroup.visible = true;
      assembledShell.visible = false;
      realCrownBadge.visible = false;

      const p2Time = t - 800;
      const stagger = 110; // ms
      const duration = 480;

      brackets.forEach((b, i) => {
        const bStart = i * stagger;
        if (p2Time < bStart) {
          b.visible = false;
          return;
        }
        b.visible = true;

        if (p2Time >= bStart + duration && !this.soundTriggered.brackets[i]) {
          this.soundTriggered.brackets[i] = true;
          badgeAudio.playBracketSnap(i);
          triggerHaptic('tap');
        }

        const bProgress = Math.min(1, (p2Time - bStart) / duration);
        // Overshoot Bounce curve
        let bt = 1;
        if (bProgress < 0.85) {
          bt = 1 - Math.pow(1 - bProgress / 0.85, 3);
        } else {
          const sub = (bProgress - 0.85) / 0.15;
          bt = 1 + 0.08 * Math.sin(sub * Math.PI);
        }

        const u = b.userData;
        const currentR = u.spreadRadius + (u.dockRadius - u.spreadRadius) * bt;

        b.position.x = u.dirX * currentR;
        b.position.y = u.dirY * currentR;
        b.position.z = (1 - bProgress) * 0.8;
        b.scale.setScalar(0.45 + 0.55 * bt);

        // Curved arrival arc (as indicated by arrows in reference sketch)
        if (bProgress < 0.85) {
          const arc = Math.sin(bProgress * Math.PI) * 0.35;
          b.position.x += -u.dirY * arc;
          b.position.y += u.dirX * arc;
        }
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 3: 组装完成锁定 (1700 ~ 2200ms) - 严丝合缝咔哒锁定
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 1700 && t < 2200) {
      if (!this.soundTriggered.locked) {
        this.soundTriggered.locked = true;
        badgeAudio.playClick(1.6);
        triggerHaptic('impact');
      }

      crystalHex.visible = false;
      bracketsGroup.visible = true;
      // All brackets docked tightly
      brackets.forEach((b) => {
        b.visible = true;
        b.position.x = b.userData.dirX * b.userData.dockRadius;
        b.position.y = b.userData.dirY * b.userData.dockRadius;
        b.position.z = 0;
        b.scale.setScalar(1.0);
      });

      // Show locked shell core
      assembledShell.visible = true;

      // Subtle metallic recoil snap
      const p3t = (t - 1700) / 500;
      const snap = Math.sin(p3t * Math.PI) * 0.06;
      rootGroup.scale.setScalar(1.0 + snap);

      this.centerLight.intensity = 3.5 + snap * 4.0;
      this.centerLight.color.setHex(0x00f0ff);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 4: 能量激活 (2200 ~ 2900ms) - 双层光环升腾能量注入
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 2200 && t < 2900) {
      if (!this.soundTriggered.energyPulse) {
        this.soundTriggered.energyPulse = true;
        badgeAudio.playEnergyPulse();
        triggerHaptic('selection');
      }

      assembledShell.visible = true;
      bracketsGroup.visible = true;

      const p4t = (t - 2200) / 700;
      const wave = Math.sin(p4t * Math.PI);

      // Vortex energy rings illuminate and rotate
      this.mats.vortexEnergyCyan.opacity = wave * 0.85;
      this.mats.vortexEnergyGold.opacity = wave * 0.75;
      energyVortexRing1.rotation.z += 0.08;
      energyVortexRing2.rotation.z -= 0.09;

      this.centerLight.intensity = 4.0 + wave * 6.0;
      this.centerLight.color.setHex(p4t < 0.5 ? 0x00f0ff : 0xffd60a);
      this.mats.shellEmblemCrown.emissiveIntensity = 0.5 + wave * 1.5;
    } else {
      this.mats.vortexEnergyCyan.opacity = 0;
      this.mats.vortexEnergyGold.opacity = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 5: 3D 旋转 (2900 ~ 3800ms) - 高速倾斜自转 3.5 圈，视觉汇聚
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 2900 && t < 3800) {
      if (!this.soundTriggered.vortexSpin) {
        this.soundTriggered.vortexSpin = true;
        badgeAudio.playSpinWhoosh(0.9);
      }

      const p5t = (t - 2900) / 900;
      // Hermite S-Curve
      const ease = p5t < 0.5 ? 4 * p5t * p5t * p5t : 1 - Math.pow(-2 * p5t + 2, 3) / 2;

      // 3.5 Full rotations
      rootGroup.rotation.y = ease * Math.PI * 2 * 3.5;
      // Tilt during spin (exactly matching frame 5 in sketch)
      rootGroup.rotation.x = Math.sin(ease * Math.PI) * 0.42;

      this.centerLight.intensity = 6.0 + Math.sin(p5t * Math.PI) * 4.0;
    } else if (t < 2900) {
      rootGroup.rotation.set(0, 0, 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 6: 最终揭晓爆解 (3800 ~ 4300ms) - 外壳飞散，3D 皇冠勋章露出
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 3800 && t < 4300) {
      if (!this.soundTriggered.burst) {
        this.soundTriggered.burst = true;
        badgeAudio.playBurst();
        triggerHaptic('impact');
      }

      const p6t = (t - 3800) / 500;
      const easeBurst = p6t * p6t;

      // Brackets explode outwards radially
      bracketsGroup.visible = true;
      brackets.forEach((b) => {
        const u = b.userData;
        const burstR = u.dockRadius + easeBurst * 7.5;
        b.position.x = u.dirX * burstR;
        b.position.y = u.dirY * burstR;
        b.position.z = p6t * 2.2;
        b.scale.setScalar(Math.max(0.01, 1.0 - p6t * 0.9));
      });

      // Assembled Shell fades away
      assembledShell.visible = true;
      assembledShell.scale.setScalar(Math.max(0.01, 1.0 - p6t * 0.8));

      // Real Crown Badge appears from scale 0.01 to 1.0
      realCrownBadge.visible = true;
      const crownScale = Math.min(1.0, 0.01 + 0.99 * Math.pow(p6t, 0.6));
      realCrownBadge.scale.setScalar(crownScale);

      // Flash blast light
      this.centerLight.intensity = (1 - p6t) * 9.0;
      this.centerLight.color.setHex(0xffffff);

      rootGroup.rotation.y = 0;
      rootGroup.rotation.x = 0;
    } else if (t >= 4300) {
      bracketsGroup.visible = false;
      assembledShell.visible = false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 7: 展示停留 (4300 ~ 5400ms) - 空中悬浮，神圣光芒绽放
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 4300 && t < 5400) {
      if (!this.soundTriggered.celebrate) {
        this.soundTriggered.celebrate = true;
        badgeAudio.playCelebrationChime();
        triggerHaptic('success');
      }

      realCrownBadge.visible = true;
      realCrownBadge.scale.setScalar(1.0);
      badgeWallCard.visible = false;

      // Gentle celebratory levitation
      const p7t = (t - 4300) / 1100;
      rootGroup.position.y = Math.sin(p7t * Math.PI * 2) * 0.08;
      rootGroup.rotation.y = Math.sin(p7t * Math.PI) * 0.12;

      this.centerLight.intensity = 2.5 + Math.sin(p7t * Math.PI * 2) * 1.0;
      this.centerLight.color.setHex(0xffd60a);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Phase 8: 收入 Badge Wall (5400 ~ 6400ms) - 缓缓退入个人典藏卡片
    // ─────────────────────────────────────────────────────────────────────────
    if (t >= 5400) {
      if (!this.soundTriggered.cardArchive) {
        this.soundTriggered.cardArchive = true;
        badgeAudio.playClick(1.8);
        triggerHaptic('selection');
      }

      realCrownBadge.visible = true;
      badgeWallCard.visible = true;

      const p8t = Math.min(1, (t - 5400) / 1000);
      const easeCard = 1 - Math.pow(1 - p8t, 3);

      // Card scales up from behind
      badgeWallCard.scale.setScalar(0.2 + 0.8 * easeCard);
      badgeWallCard.position.z = -0.3 + 0.15 * easeCard;

      // Badge docks nicely in center of card frame
      realCrownBadge.scale.setScalar(1.0 - 0.28 * easeCard);
      realCrownBadge.position.z = 0.1;
      rootGroup.position.y = 0;
      rootGroup.rotation.set(0, 0, 0);

      this.centerLight.intensity = 2.0;
    } else {
      badgeWallCard.visible = false;
      realCrownBadge.position.z = 0;
    }
  }
}
