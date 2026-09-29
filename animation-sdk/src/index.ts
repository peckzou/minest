/**
 * Apple Fitness Rings 4.0 & Apple Award Full-Lifecycle Ceremony SDK
 *
 * @packageDocumentation
 * High-performance, WebGL2 + Three.js + Web Audio API complete suite for:
 * 1. Apple Fitness Rings 4.0 Native 2D/3D Hybrid Pipeline
 *    - 2,200+ Blacksmith Molten Iron Sparks & Instanced Particles
 *    - Aerodynamic Vector Flow Field & Wake Turbulence
 *    - Racing Carbon-Ceramic Brake Friction Sparks
 *    - Gravity Inertia Simulation with Sub-Bass Acoustic Vibration Synthesizer
 *    - Fused Single-Pass Motion Blur & Dynamic Radial Bloom Post-Processing
 *    - Coverage-Driven LOD Multi-Tier Adaptive Density
 * 2. Full-Lifecycle Apple Award 3D Summon & Reveal Ceremonies:
 *    - Minest Summon Particle Eruption Ceremony
 *    - Hex Assembly Reveal Mechanics
 *    - 3D Interactive Badge 6DoF Inspector with Spring Damping & Audio
 *    - Badge Wall Grid Return Snap Ceremony
 *    - Apple Watch Activity Live Device Frame
 */

// UI View Components
export { UnifiedAwardCeremonyFlowView } from './components/UnifiedAwardCeremonyFlowView';
export { AppleFitnessRingsView } from './components/AppleFitnessRingsView';
export { AppleWatchActivityView } from './components/AppleWatchActivityView';
export { AppleWatchDeviceFrame } from './components/AppleWatchDeviceFrame';
export { BadgeInspectorView } from './components/BadgeInspectorView';
export { BadgeWallReturnCeremonyView } from './components/BadgeWallReturnCeremonyView';
export { HexAssemblyRevealView } from './components/HexAssemblyRevealView';
export { MinestSummonCeremonyView } from './components/MinestSummonCeremonyView';
export { PendingBadgeView } from './components/PendingBadgeView';
export { PerformanceHUD } from './components/PerformanceHUD';
export { OptimizationReportModal } from './components/OptimizationReportModal';

// Three.js 3D Core Engines & Scene Managers
export {
  UnifiedAwardCeremonyFlowScene,
  type UnifiedCeremonyStage,
} from './three/UnifiedAwardCeremonyFlowScene';
export { OptimizedRings3DScene, type RingsPerformanceMetrics, type RingsLODMode } from './three/OptimizedRings3DScene';
export {
  AppleAwardMaterials,
  type FresnelConfig,
  type AwardLightingEnvironment,
  type FresnelUniforms,
} from './three/AppleAwardMaterials';
export { OptimizedBadgeInspectorScene, type PerformanceMetrics } from './three/OptimizedBadgeInspectorScene';
export { OptimizedBadgeWallReturnScene } from './three/OptimizedBadgeWallReturnScene';
export { OptimizedHexRevealScene } from './three/OptimizedHexRevealScene';
export { OptimizedPendingBadgeScene } from './three/OptimizedPendingBadgeScene';
export { MinestSummonScene } from './three/MinestSummonScene';
export { MinestSummonTimelineEngine } from './three/MinestSummonTimelineEngine';
export { AppleWatchFireworksEngine } from './three/AppleWatchFireworksEngine';
export {
  BADGE_CATALOG,
  type BadgeCatalogItem,
  buildAppleHexMechanicalPendingBadge,
  buildApplePendingConvexHexBlank,
} from './three/BadgeGeometries';

// Physics & Web Audio API Pure Code Synthesis
export {
  badgeAudio,
  triggerHaptic,
  triggerSpringOvershootHaptic,
  triggerDynamicImpactHaptic,
  type HapticFeedbackType,
} from './utils/hapticsAndAudio';
export { SpringPhysicsIntegrator } from './utils/springPhysicsIntegrator';
export { RingsSparksManager } from './utils/ringsSparksManager';
