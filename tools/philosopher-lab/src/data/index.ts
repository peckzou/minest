import { PhilosophyModel, CategoryGroup } from '../types/philosophy';
import { LEGACY_MODELS } from './legacyModels';
import { MODELS_45_TO_56 } from './modelsEpistemologyEthics';
import { MODELS_57_TO_66 } from './modelsMetaphysics';
import { MODELS_67_TO_76 } from './modelsLanguageSocial';
import { MODELS_77_TO_86 } from './modelsScienceParadox';
import { MODELS_87_TO_101 } from './modelsEconomics';
import { MODELS_102_TO_113 } from './modelsSociology';
import { MODELS_114_TO_123 } from './modelsPsychology';
import { MODELS_124_TO_136 } from './modelsPoliticsSystems';

export const NEW_PHILOSOPHY_MODELS: PhilosophyModel[] = [
  ...MODELS_45_TO_56,
  ...MODELS_57_TO_66,
  ...MODELS_67_TO_76,
  ...MODELS_77_TO_86,
  ...MODELS_87_TO_101,
  ...MODELS_102_TO_113,
  ...MODELS_114_TO_123,
  ...MODELS_124_TO_136
];

export const CATEGORY_GROUPS: { key: string; label: string; count?: number }[] = [
  { key: 'new_87_136', label: '★ 新增思想家库 Top 50（87–136）', count: 50 },
  { key: 'top10_priority', label: '🔥 优先开发 Top 10', count: 10 },
  { key: '一、经济学与博弈论（87–101）', label: '经济学与博弈论（87–101）', count: 15 },
  { key: '二、社会学与社会结构（102–113）', label: '社会学与社会结构（102–113）', count: 12 },
  { key: '三、心理学与认知科学（114–123）', label: '心理学与认知科学（114–123）', count: 10 },
  { key: '四、政治学、传播学与组织管理（124–131）', label: '政治学、传播学与管理（124–131）', count: 8 },
  { key: '五、复杂系统、科学与跨学科思维（132–136）', label: '复杂系统与跨学科（132–136）', count: 5 },
  { key: 'new_45_86', label: '哲学模型（45–86）', count: 42 },
  { key: '前序模型（1–44）', label: '前序哲学模型（1–44）', count: 44 },
  { key: 'all_136', label: '全部 136 个模型（1–136）', count: 136 }
];

export { LEGACY_MODELS };
export type { CategoryGroup };
