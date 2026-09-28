# Apple Fitness Rings 4.0 & Apple Award Full-Lifecycle Ceremony Suite 

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r128%2B-black.svg?style=flat-square)](https://threejs.org/)
[![React](https://img.shields.io/badge/React-18%2B%20%7C%2019-61dafb.svg?style=flat-square)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square)](https://tailwindcss.com/)
[![WebGL2](https://img.shields.io/badge/WebGL2-120FPS%20Ready-green.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext)
[![Zero-Audio-Assets](https://img.shields.io/badge/Web%20Audio-100%25%20Pure%20Code-orange.svg?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

> **极度纯粹、像素级还原的 Apple Fitness 三环 4.0 原生架构与苹果年度勋章全流程流转仪式 SDK。**
> 包含 **2,200+ 粒子打铁花系统**、**空气流场风洞横向扰动**、**赛车刹车片摩擦铁火花**、**多轴重力惯性阻尼回正**、**Web Audio 超低频声学体感震动合成** 及 **5 阶段勋章召唤/装配/检视/归壁全链路**。

---

## 🌟 核心特性与架构 (Key Highlights)

### 1. Apple Fitness 三环 4.0 混合渲染管线 (Hybrid 2D/3D Engine)
- **片头常驻态 (Head Standby)**：原生 2D 微光待闭合状态，12点钟起始尾端与运动端头高光珠永久常驻锚定。
- **2,200+ 熔铁铁花粒子系统 (Blacksmith Molten Iron Sparks)**：全 GPU `InstancedMesh` 实例化渲染，速度矢量牵引针状几何体自适应拉伸、真实重力弹跳与热力学冷却色彩衰减。
- **空气动力学流场风洞 (Aerodynamic Vector Flow Field & Wake Turbulence)**：环体自转与手动拖拽产生的切向空气流拖拽粒子产生自然横向飘拂与有机微湍流。
- **赛车碳陶刹车片铁火花 (Racing Brake Friction Sparks)**：模拟赛车卡钳急刹制动时摩擦喷涌的超细高温铁火花流（白热核心 $\to$ 电光金 $\to$ 炽橙 $\to$ 碳渣暗红）。
- **多轴重力惯性与力度自适应回正 (Gravity Momentum & Spring Rebound)**：
  $$\vec{\alpha} = -k_{\text{spring}} \cdot \vec{\theta} - c_{\text{damping}} \cdot \vec{\omega}$$
- **Web Audio 纯代码物理震动与金属碰撞音效 (Sub-Bass Acoustic Haptics)**：
  - 高频钛金敲击共振（$1750\text{Hz} \sim 3380\text{Hz}$）；
  - 超低频体感震动（$45\text{Hz} \sim 72\text{Hz}$ Sub-Bass Rumble），模拟 Taptic Engine 真实物理顿挫感；
  - 碰撞力度自适应多段硬件震动（`triggerDynamicImpactHaptic`）。
- **统一单通道后处理管线 (Single-Pass Fused Shader Pipeline)**：切向拖影、离心径向拉伸与色散分离合并入单通道 Pass，彻底消灭 Framebuffer Ping-Pong，低端设备稳固 60/120 FPS。
- **视距自适应 LOD 分级体系 (Coverage-Driven LOD 0~3)**：根据视口面积与相机距离动态调节粒子算力。

### 2. 苹果勋章全流程流转体验链路 (Full-Lifecycle Award Ceremonies)
```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Apple Fitness   │  ──▶  │ Minest Summon   │  ──▶  │ Hex Assembly    │
│ 三环 4.0 满环闭合 │       │ 远古矿脉粒子召唤 │       │ 六边形悬浮装配   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Apple Watch     │  ◀──  │ Badge Wall Grid │  ◀──  │ 3D 6DoF Badge   │
│ 真机表盘全功能联动 │       │ 勋章墙平滑归位   │       │ 自由阻尼检视器   │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 📦 快速接入 (Quick Start)

### 1. 安装依赖
```bash
npm install three @types/three lucide-react clsx tailwindcss
```

### 2. 引入三环 4.0 视图组件
```tsx
import React, { useState } from 'react';
import { AppleFitnessRingsView } from './src';

export default function MyFitnessApp() {
  const [metrics, setMetrics] = useState(null);

  return (
    <div className="w-full h-screen bg-[#07090e]">
      <AppleFitnessRingsView
        onMetricsUpdate={(liveMetrics) => {
          console.log(`FPS: ${liveMetrics.fps}, LOD: ${liveMetrics.lodTier}`);
        }}
      />
    </div>
  );
}
```

### 3. 直接调用底层 Three.js 场景引擎
```ts
import { OptimizedRings3DScene, badgeAudio } from './src';

const container = document.getElementById('rings-canvas-container')!;
const scene = new OptimizedRings3DScene(container);

// 更新三环进度 (活动, 锻炼, 站立)
scene.updateRingPercentages(100, 100, 100);

// 触发 2,200+ 铁花喷发
scene.spawnBlacksmithMoltenSparks(2200);

// 触发赛车刹车片铁火花
scene.emitRacingBrakeSparks(360, 1.2);

// 播放纯代码合成金属敲击与低频震动
badgeAudio.playKineticSnapRebound(1.5);
```

---

## ⚙️ 核心 API 文档 (API Reference)

### `<AppleFitnessRingsView />` Props
| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `onMetricsUpdate` | `(metrics: RingsPerformanceMetrics) => void` | `undefined` | 实时回传帧率、DrawCalls、粒子数与 LOD 档位 |
| `sharedMaterials` | `AppleAwardMaterials` | `undefined` | 可选共享苹果 PBR 材质池，避免显存重复分配 |

### `OptimizedRings3DScene` 关键方法与属性
```ts
class OptimizedRings3DScene {
  // 属性开关
  flowFieldEnabled: boolean;       // 空气流场涡流扰动开关
  flowFieldIntensity: number;     // 流场风阻横向偏转强度 (0.2 ~ 2.0)
  brakeSparksEnabled: boolean;     // 赛车刹车铁火花开关
  soundEnabled: boolean;           // Web Audio 纯代码合成音效开关
  lodMode: 'auto' | 'lod0' | 'lod1' | 'lod2' | 'lod3'; // 粒子 LOD 模式

  // 核心方法
  updateRingPercentages(m: number, e: number, s: number, isAnim?: boolean): void;
  spawnBlacksmithMoltenSparks(count?: number): void;
  emitRacingBrakeSparks(count?: number, intensity?: number): void;
  emitCentrifugalFlungSparks(rate?: number): void;
  settleToRestingTailState(): void; // 缓速刹车进入片尾常驻
  resetToHeadState(): void;         // 瞬间重置回片头 2D 原生常驻
  destroy(): void;                  // 彻底销毁并释放 WebGL 上下文与几何体显存
}
```

---

## 🔊 Web Audio API 纯代码声学生成 (Zero Audio Assets)

本项目 **不加载任何外部 MP3/WAV 音频文件**，所有音效均由浏览器的 `AudioContext` 实时震荡器、双二阶带通/低通滤波器与包络增益实时数学合成：

```ts
import { badgeAudio, triggerDynamicImpactHaptic } from './src';

// 1. 钛合金碰撞敲击 + 45Hz~72Hz 超低频体感冲击波
badgeAudio.playKineticSnapRebound(intensity);

// 2. 赛车刹车片高频摩擦尖啸与研磨火花白噪
badgeAudio.playBrakeSparksSizzle(intensity);

// 3. 2,200+ 铁花剧烈喷发与空气撕裂咆哮
badgeAudio.playSparksEruption();

// 4. 环形闭合水晶清脆钟鸣与全满环琶音
badgeAudio.playRingCloseSound(ringIndex);
badgeAudio.playAllRingsMasterFlourish();

// 5. 硬件级自适应力度多脉冲震动
triggerDynamicImpactHaptic(intensity);
```

---

## 📄 开源许可 (License)
MIT License © 2026 Apple Fitness Rings 4.0 & Award Ceremony Contributors.
