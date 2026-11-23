import { NEW_PHILOSOPHY_MODELS } from '../data';
import { CanvasEnv } from './canvasHelpers';
import { StageEngine, createEthicsEngine } from './engineEthics';
import { createMetaphysicsEngine } from './engineMetaphysics';
import { createLanguageSocialEngine } from './engineLanguageSocial';
import { createScienceParadoxEngine } from './engineScienceParadox';
import { createTop10VisualWorld } from './worldsTop10';
import { createEconPoliticsVisualWorld } from './worldsEconPolitics';
import { createSocPsychVisualWorld } from './worldsSocPsych';
import { createPhilosophyVisualWorld } from './worldsPhilosophyVisual';

export type { StageEngine };

function rawModelStageEngine(modelId: number, stageId: number): StageEngine {
  // 1. Flagship Top 10 + Complex Systems visual worlds (87–136)
  const top10 = createTop10VisualWorld(modelId);
  if (top10) return top10[stageId] || top10[1];

  // 2. Economics, Politics, Media & Systems visual worlds (87–136)
  const econPol = createEconPoliticsVisualWorld(modelId);
  if (econPol) return econPol[stageId] || econPol[1];

  // 3. Sociology & Psychology visual worlds (87–136)
  const socPsych = createSocPsychVisualWorld(modelId);
  if (socPsych) return socPsych[stageId] || socPsych[1];

  // 4. Upgraded bespoke visual worlds for Philosophy models (#51–56, #59–66, #68–76, #78, #80, #81)
  const philVisual = createPhilosophyVisualWorld(modelId, stageId);
  if (philVisual) return philVisual;

  // 5. Existing custom physics engines (#47–50, #57–58, #67, #77, #79, #82–86)
  let stages: Record<number, StageEngine>;
  if (modelId >= 47 && modelId <= 56) {
    stages = createEthicsEngine(modelId);
  } else if (modelId >= 57 && modelId <= 66) {
    stages = createMetaphysicsEngine(modelId);
  } else if (modelId >= 67 && modelId <= 76) {
    stages = createLanguageSocialEngine(modelId);
  } else {
    stages = createScienceParadoxEngine(modelId);
  }
  return stages[stageId] || stages[1];
}

// Some Studio visual worlds emit three generic quote slots even when a stage has
// fewer source mappings. Ignore absent slots before they reach the progress store.
export function getModelStageEngine(modelId: number, stageId: number): StageEngine {
  const raw = rawModelStageEngine(modelId, stageId);
  const model = NEW_PHILOSOPHY_MODELS.find((m) => m.id === modelId);
  const safe = (env: CanvasEnv): CanvasEnv => ({ ...env, hit: (level, index, message) => {
    if (Number.isInteger(index) && index >= 0 && model?.stages.find((s) => s.id === level)?.mappings[index]) env.hit(level, index, message);
  }});
  return {
    init: () => raw.init(),
    tick: (env) => raw.tick(safe(env)),
    down: raw.down ? (x, y, env) => raw.down!(x, y, safe(env)) : undefined,
    move: raw.move ? (x, y, dx, dy, env) => raw.move!(x, y, dx, dy, safe(env)) : undefined,
    up: raw.up ? (env) => raw.up!(safe(env)) : undefined,
  };
}
