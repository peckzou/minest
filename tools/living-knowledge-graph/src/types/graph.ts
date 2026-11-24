export type KnowledgeType = 'page' | 'wiki' | 'concept' | 'decision' | 'insight' | 'unresolved';

export type RelationshipType =
  | 'markdown-link'
  | 'wiki-relation'
  | 'ai-extracted'
  | 'user-manual'
  | 'project-decision';

export interface SourceReference {
  docId: string;
  path: string;
  section?: string;
  snippet: string;
  updatedAt: string;
}

export interface EvidenceReference {
  sourceDocId: string;
  quote: string;
  confidence: number; // 1.0 for verified direct references, 0.72-0.95 for AI extracted
  verified: boolean;
  extractedBy: 'markdown-parser' | 'wiki-engine' | 'living-knowledge-ai' | 'human-author' | 'adr-registry';
}

export interface KnowledgeNode {
  id: string;
  title: string;
  type: KnowledgeType;
  tags: string[];
  group: string;
  size: number; // Base computed importance or degree score
  resolved: boolean; // False if unresolved/broken wiki link target
  metadata: {
    summary: string;
    content: string;
    author: string;
    updatedAt: string;
    folder: string;
    wordCount: number;
    status?: 'verified' | 'draft' | 'accepted-adr' | 'unresolved-stub';
  };
  sourceReferences: SourceReference[];
  // Living Knowledge: when it was first saved; in time travel, whether it is new or was changed at the step shown;
  // an insight still in draft is drawn hollow; a decision that was replaced or rejected is drawn faint
  createdAt?: number;
  mark?: 'new' | 'changed';
  draft?: boolean;
  faded?: boolean;
  stateLabel?: string;
  // Runtime d3-force simulation fields
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  degree?: number;
}

export interface KnowledgeEdge {
  id: string;
  source: string | KnowledgeNode;
  target: string | KnowledgeNode;
  relationshipType: RelationshipType;
  weight: number;
  verified: boolean; // True = real citation/link, False = AI inferred concept link
  evidenceReferences: EvidenceReference[];
  // Living Knowledge relations: the kind of relation (its colour), whether the user confirmed it (solid) or it is still
  // a suggestion (dashed), why the two are linked, and the words that show it
  relationType?: string;
  status?: 'confirmed' | 'suggested';
  explanation?: string;
  relationId?: string; // the lk_relations document; absent for [[links]] and for the ties of an insight
  confidence?: number;
  createdAt?: number;
  quotes?: Array<{ nodeId: string; title: string; quote: string }>;
  engine?: string;
  downgraded?: boolean;
  aiFound?: boolean;
  fixed?: boolean; // part of the text or of an insight: nothing to confirm or reject
  mark?: 'new';
}

export interface GraphGroupRule {
  id: string;
  label: string;
  query: string; // e.g., "tag:#architecture", "type:decision", "group:core-engine", "path:adr/"
  color: string;
  enabled: boolean;
}

export interface GraphFilterConfig {
  searchQuery: string;
  selectedTags: string[];
  selectedTypes: KnowledgeType[];
  selectedRelationships: RelationshipType[];
  showUnresolved: boolean;
  showOrphans: boolean;
  showAIInferred: boolean; // Must clearly distinguish real vs AI-inferred
  onlyVerifiedLinks: boolean;
}

export interface GraphDisplayConfig {
  nodeSizeMultiplier: number; // 0.5 to 2.5
  linkThicknessMultiplier: number; // 0.5 to 3.0
  textFadeThreshold: number; // Zoom level threshold where labels appear (0.2 to 2.2)
  colorOpacity: number; // 0.25 to 1.0
  showArrows: boolean;
  animatePhysics: boolean;
  distinguishAIEgesDashed: boolean;
}

export interface GraphForceConfig {
  centerForce: number; // 0.05 to 1.0
  repelForce: number; // 30 to 600
  linkForce: number; // 0.1 to 1.5
  linkDistance: number; // 25 to 240
  collisionRadius: number; // 1.0 to 3.0 multiplier
  damping: number; // velocityDecay: 0.15 to 0.85
}

export type GraphScopeMode = 'global' | 'local';

export type DatasetScaleMode = 'standard' | '500' | '1000' | '5000';

export type GraphVisualModeId =
  | 'obsidian-native'
  | 'infranodus'
  | 'juggl'
  | 'extended-graph'
  | 'excalibrain'
  | 'cosmos-nebula'
  | 'graph-analysis'
  | 'radial-chord'
  | 'knowledge-pulse'
  | 'timeline-river';

export interface StructuralGapBridge {
  id: string;
  clusterA: string;
  clusterB: string;
  nodeA: KnowledgeNode;
  nodeB: KnowledgeNode;
  gapScore: number; // Higher means larger conceptual blindspot / structural hole between two major clusters
  rationale: string;
}

export interface GraphVisualPreset {
  id: GraphVisualModeId;
  rank: number;
  name: string;
  pluginSource: string;
  tagline: string;
  description: string;
  accentColor: string;
  features: string[];
  recommendedForces?: Partial<GraphForceConfig>;
  recommendedDisplay?: Partial<GraphDisplayConfig>;
}
