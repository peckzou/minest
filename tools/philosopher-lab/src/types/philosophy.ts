export type QuoteMapping = [
  operation: string,
  chinese: string,
  english: string,
  reference: string
];

export interface ControlSlider {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  formatValue?: (val: number) => string;
}

export interface ControlChoice {
  key: string;
  label: string;
  options: { value: string; label: string; badge?: string }[];
  defaultValue: string;
}

export interface ActionButton {
  key: string;
  label: string;
  accent?: 'amber' | 'blue' | 'green' | 'red' | 'purple';
}

export interface DraggableItem {
  id: string;
  label: string;
  sub?: string;
  targetZone: string;
  color?: string;
}

export interface DropZone {
  id: string;
  label: string;
  sub?: string;
  color: string;
}

export interface StageConfig {
  id: number;
  tabLabel: string;
  instructionTitle: string;
  mappings: QuoteMapping[];
  sliders?: ControlSlider[];
  choices?: ControlChoice[];
  buttons?: ActionButton[];
  draggables?: DraggableItem[];
  dropZones?: DropZone[];
  canvasHint?: string;
}

export type CategoryGroup =
  | '一、认识论与逻辑哲学（45–46）'
  | '二、伦理学与政治哲学（47–56）'
  | '三、形而上学与存在哲学（57–66）'
  | '四、语言、解释与社会哲学（67–76）'
  | '五、科学哲学、数学哲学与思想实验（77–86）'
  | '一、经济学与博弈论（87–101）'
  | '二、社会学与社会结构（102–113）'
  | '三、心理学与认知科学（114–123）'
  | '四、政治学、传播学与组织管理（124–131）'
  | '五、复杂系统、科学与跨学科思维（132–136）'
  | '前序模型（1–44）';

export interface PhilosophyModel {
  id: number;
  slug: string;
  title: string;
  philosopher: string;
  concept: string;
  categoryGroup: CategoryGroup;
  tags: string[];
  playSummary: string;
  levelsSummary: string;
  source: string;
  quoteCount: number;
  thumbType: string;
  coreQuestion: string;
  boundaryNote: string;
  priorityRank?: number;
  htmlAssetPath?: string;
  stages: StageConfig[];
}

export interface LegacyModel {
  id: number;
  slug: string;
  title: string;
  batch: number;
  tags: string[];
  levelsSummary: string;
  source: string;
  quoteCount: number;
  thumbType: string;
  htmlAssetPath: string;
}
