import {
  KnowledgeNode,
  KnowledgeEdge,
  GraphGroupRule,
  GraphFilterConfig,
} from '../types/graph';

export function getEdgeEndpointIds(edge: KnowledgeEdge): { sourceId: string; targetId: string } {
  const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
  const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
  return { sourceId, targetId };
}

/**
 * Evaluates Obsidian-like group color rules in order (first matching rule wins).
 * Supports queries like:
 * - "group:core-engine"
 * - "type:decision"
 * - "tag:#architecture"
 * - "path:adr"
 * - or plain substring match on title/group/tags
 */
export function resolveNodeColor(
  node: KnowledgeNode,
  groupRules: GraphGroupRule[],
  isDark: boolean
): string {
  for (const rule of groupRules) {
    if (!rule.enabled) continue;
    const q = rule.query.trim().toLowerCase();
    if (!q) continue;

    if (q.startsWith('group:')) {
      const targetGroup = q.slice(6).trim();
      if (node.group.toLowerCase() === targetGroup) return rule.color;
    } else if (q.startsWith('type:')) {
      const targetType = q.slice(5).trim();
      if (node.type.toLowerCase() === targetType) return rule.color;
    } else if (q.startsWith('tag:')) {
      const targetTag = q.slice(4).trim();
      if (
        node.tags.some(
          (t) =>
            t.toLowerCase() === targetTag ||
            t.toLowerCase() === `#${targetTag.replace(/^#/, '')}`
        )
      ) {
        return rule.color;
      }
    } else if (q.startsWith('path:')) {
      const targetPath = q.slice(5).trim();
      if (node.metadata.folder.toLowerCase().includes(targetPath)) return rule.color;
    } else {
      const matchesTitle = node.title.toLowerCase().includes(q);
      const matchesGroup = node.group.toLowerCase().includes(q);
      const matchesTag = node.tags.some((t) => t.toLowerCase().includes(q));
      if (matchesTitle || matchesGroup || matchesTag) return rule.color;
    }
  }

  return isDark ? '#8B8E9B' : '#64748B';
}

/**
 * Checks if a node passes the Group visibility rules (if a group rule matches and is disabled,
 * we can either fall through or hide; additionally checks Filters).
 */
export function isNodeMatchingGroupVisibility(
  node: KnowledgeNode,
  groupRules: GraphGroupRule[]
): boolean {
  for (const rule of groupRules) {
    const q = rule.query.trim().toLowerCase();
    if (!q) continue;

    let matched = false;
    if (q.startsWith('group:')) {
      matched = node.group.toLowerCase() === q.slice(6).trim();
    } else if (q.startsWith('type:')) {
      matched = node.type.toLowerCase() === q.slice(5).trim();
    } else if (q.startsWith('tag:')) {
      const targetTag = q.slice(4).trim();
      matched = node.tags.some(
        (t) =>
          t.toLowerCase() === targetTag ||
          t.toLowerCase() === `#${targetTag.replace(/^#/, '')}`
      );
    } else if (q.startsWith('path:')) {
      matched = node.metadata.folder.toLowerCase().includes(q.slice(5).trim());
    }

    if (matched) {
      return rule.enabled;
    }
  }
  return true;
}

/**
 * Computes the filtered Global or Local subgraph, node degrees, and adjacency maps.
 */
export function computeActiveGraph(
  allNodes: KnowledgeNode[],
  allEdges: KnowledgeEdge[],
  filters: GraphFilterConfig,
  groupRules: GraphGroupRule[],
  scopeMode: 'global' | 'local',
  localCenterId: string | null,
  localDepth: number
): {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  adjacencyMap: Map<string, Set<string>>;
  incidentEdgesMap: Map<string, Set<string>>;
  degreeMap: Map<string, number>;
} {
  // 1. Filter edges by relationship type and verification policy first
  const eligibleEdges = allEdges.filter((edge) => {
    if (!filters.selectedRelationships.includes(edge.relationshipType)) {
      return false;
    }
    if (!filters.showAIInferred && edge.relationshipType === 'ai-extracted') {
      return false;
    }
    if (filters.onlyVerifiedLinks && !edge.verified) {
      return false;
    }
    return true;
  });

  // 2. Filter candidate nodes by type, unresolved toggle, group visibility, tags, and search
  const searchLower = filters.searchQuery.trim().toLowerCase();

  const candidateNodeMap = new Map<string, KnowledgeNode>();
  for (const node of allNodes) {
    if (!filters.selectedTypes.includes(node.type)) continue;
    if (!filters.showUnresolved && (!node.resolved || node.type === 'unresolved')) continue;
    if (!isNodeMatchingGroupVisibility(node, groupRules)) continue;

    if (filters.selectedTags.length > 0) {
      const hasSelectedTag = node.tags.some((t) => filters.selectedTags.includes(t));
      if (!hasSelectedTag) continue;
    }

    if (searchLower) {
      const matchesTitle = node.title.toLowerCase().includes(searchLower);
      const matchesTag = node.tags.some((t) => t.toLowerCase().includes(searchLower));
      const matchesSummary = node.metadata.summary.toLowerCase().includes(searchLower);
      const matchesId = node.id.toLowerCase().includes(searchLower);
      if (!matchesTitle && !matchesTag && !matchesSummary && !matchesId) continue;
    }

    candidateNodeMap.set(node.id, node);
  }

  // 3. Keep only edges whose both endpoints are in candidateNodeMap
  let activeEdges = eligibleEdges.filter((edge) => {
    const { sourceId, targetId } = getEdgeEndpointIds(edge);
    return candidateNodeMap.has(sourceId) && candidateNodeMap.has(targetId);
  });

  // 4. If in Local Graph mode, perform N-hop BFS from localCenterId
  if (scopeMode === 'local' && localCenterId) {
    // Ensure center node is present even if search filter was typed
    const centerNode = allNodes.find((n) => n.id === localCenterId);
    if (centerNode && !candidateNodeMap.has(localCenterId)) {
      candidateNodeMap.set(localCenterId, centerNode);
    }

    // Build full adjacency over eligible edges for BFS traversal
    const bfsAdj = new Map<string, Set<string>>();
    for (const edge of eligibleEdges) {
      const { sourceId, targetId } = getEdgeEndpointIds(edge);
      if (!candidateNodeMap.has(sourceId) || !candidateNodeMap.has(targetId)) continue;
      if (!bfsAdj.has(sourceId)) bfsAdj.set(sourceId, new Set());
      if (!bfsAdj.has(targetId)) bfsAdj.set(targetId, new Set());
      bfsAdj.get(sourceId)!.add(targetId);
      bfsAdj.get(targetId)!.add(sourceId);
    }

    const visited = new Set<string>([localCenterId]);
    let frontier = [localCenterId];

    for (let d = 0; d < localDepth; d++) {
      const nextFrontier: string[] = [];
      for (const curr of frontier) {
        const neighbors = bfsAdj.get(curr);
        if (!neighbors) continue;
        for (const nb of neighbors) {
          if (!visited.has(nb)) {
            visited.add(nb);
            nextFrontier.push(nb);
          }
        }
      }
      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }

    for (const id of Array.from(candidateNodeMap.keys())) {
      if (!visited.has(id)) {
        candidateNodeMap.delete(id);
      }
    }

    activeEdges = eligibleEdges.filter((edge) => {
      const { sourceId, targetId } = getEdgeEndpointIds(edge);
      return visited.has(sourceId) && visited.has(targetId);
    });
  }

  // 5. Compute degrees & adjacency maps
  const adjacencyMap = new Map<string, Set<string>>();
  const incidentEdgesMap = new Map<string, Set<string>>();
  const degreeMap = new Map<string, number>();

  for (const id of candidateNodeMap.keys()) {
    adjacencyMap.set(id, new Set());
    incidentEdgesMap.set(id, new Set());
    degreeMap.set(id, 0);
  }

  for (const edge of activeEdges) {
    const { sourceId, targetId } = getEdgeEndpointIds(edge);
    adjacencyMap.get(sourceId)?.add(targetId);
    adjacencyMap.get(targetId)?.add(sourceId);
    incidentEdgesMap.get(sourceId)?.add(edge.id);
    incidentEdgesMap.get(targetId)?.add(edge.id);
    degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
    degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
  }

  // 6. Filter orphan nodes if showOrphans is false (except in local mode center)
  const finalNodes: KnowledgeNode[] = [];
  for (const [id, node] of candidateNodeMap.entries()) {
    const deg = degreeMap.get(id) || 0;
    if (!filters.showOrphans && deg === 0 && !(scopeMode === 'local' && id === localCenterId)) {
      continue;
    }
    node.degree = deg;
    finalNodes.push(node);
  }

  return {
    nodes: finalNodes,
    edges: activeEdges,
    adjacencyMap,
    incidentEdgesMap,
    degreeMap,
  };
}

/**
 * Computes the visual node radius in world coordinates based on connection degree
 * and the user's Node Size slider multiplier, closely matching Obsidian's scaling curve.
 */
export function computeNodeRadius(
  node: KnowledgeNode,
  degree: number,
  nodeSizeMultiplier: number
): number {
  const baseRadius = 3.8 + Math.sqrt(degree) * 2.1 + (node.size - 4) * 0.32;
  return Math.max(3.2, baseRadius * nodeSizeMultiplier);
}

/**
 * Monotone Chain 2D Convex Hull algorithm for InfraNodus topological community clouds.
 */
export function computeConvexHull(
  points: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;
  const sorted = [...points].sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const cross = (
    o: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: Array<{ x: number; y: number }> = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Array<{ x: number; y: number }> = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Expands a polygon outward from its centroid by `padding` world units so the InfraNodus
 * community hull wraps smoothly around the outer nodes.
 */
export function expandPolygonFromCentroid(
  hull: Array<{ x: number; y: number }>,
  padding: number
): {
  centroid: { x: number; y: number };
  vertices: Array<{ x: number; y: number }>;
} {
  if (hull.length === 0) {
    return { centroid: { x: 0, y: 0 }, vertices: [] };
  }
  let cx = 0;
  let cy = 0;
  for (const pt of hull) {
    cx += pt.x;
    cy += pt.y;
  }
  cx /= hull.length;
  cy /= hull.length;

  const vertices = hull.map((pt) => {
    const dx = pt.x - cx;
    const dy = pt.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    return {
      x: pt.x + (dx / len) * padding,
      y: pt.y + (dy / len) * padding,
    };
  });

  return { centroid: { x: cx, y: cy }, vertices };
}

/**
 * InfraNodus Structural Gap & Graph Analysis Centrality detector:
 * 1. Computes normalized Centrality / Betweenness proxy score [0..1] for each node.
 * 2. Detects "Structural Gaps" — pairs of high-importance hub nodes in distinct communities
 *    that lack direct connections or have minimal cross-cluster density.
 */
export function computeTopologicalInsights(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[],
  adjacencyMap: Map<string, Set<string>>,
  degreeMap: Map<string, number>
): {
  centralityMap: Map<string, number>;
  structuralGaps: import('../types/graph').StructuralGapBridge[];
  predictedLinks: Array<{
    nodeA: KnowledgeNode;
    nodeB: KnowledgeNode;
    commonCount: number;
  }>;
} {
  const centralityMap = new Map<string, number>();
  let maxScore = 1;

  const nodeGroupMap = new Map<string, string>();
  for (const n of nodes) {
    nodeGroupMap.set(n.id, n.group);
  }

  // Score combines degree + cross-community bridge diversity (Betweenness proxy)
  for (const n of nodes) {
    const deg = degreeMap.get(n.id) || 0;
    const neighbors = adjacencyMap.get(n.id);
    const neighborGroups = new Set<string>();
    if (neighbors) {
      for (const nbId of neighbors) {
        const g = nodeGroupMap.get(nbId);
        if (g) neighborGroups.add(g);
      }
    }
    const crossGroupMultiplier = 1 + Math.max(0, neighborGroups.size - 1) * 0.45;
    const rawScore = (deg * 1.4 + n.size * 0.6) * crossGroupMultiplier;
    centralityMap.set(n.id, rawScore);
    if (rawScore > maxScore) maxScore = rawScore;
  }

  for (const [id, val] of centralityMap.entries()) {
    centralityMap.set(id, Math.min(1, val / maxScore));
  }

  // Identify top hub per community group
  const groupHubs = new Map<string, KnowledgeNode[]>();
  for (const n of nodes) {
    if (!n.resolved || n.type === 'unresolved') continue;
    if (!groupHubs.has(n.group)) groupHubs.set(n.group, []);
    groupHubs.get(n.group)!.push(n);
  }

  for (const [g, list] of groupHubs.entries()) {
    list.sort(
      (a, b) => (centralityMap.get(b.id) || 0) - (centralityMap.get(a.id) || 0)
    );
    groupHubs.set(g, list.slice(0, 2));
  }

  // Compute cross-group edge counts to find disconnected or weakly linked clusters (Structural Holes)
  const crossGroupEdgeCount = new Map<string, number>();
  for (const e of edges) {
    const { sourceId, targetId } = getEdgeEndpointIds(e);
    const gA = nodeGroupMap.get(sourceId);
    const gB = nodeGroupMap.get(targetId);
    if (gA && gB && gA !== gB) {
      const pairKey = [gA, gB].sort().join('::');
      crossGroupEdgeCount.set(pairKey, (crossGroupEdgeCount.get(pairKey) || 0) + 1);
    }
  }

  const groupKeys = Array.from(groupHubs.keys());
  const structuralGaps: import('../types/graph').StructuralGapBridge[] = [];

  for (let i = 0; i < groupKeys.length; i++) {
    for (let j = i + 1; j < groupKeys.length; j++) {
      const gA = groupKeys[i];
      const gB = groupKeys[j];
      const hubsA = groupHubs.get(gA) || [];
      const hubsB = groupHubs.get(gB) || [];
      if (hubsA.length === 0 || hubsB.length === 0) continue;

      // Pick highest-centrality pair not directly connected
      let candidateA = hubsA[0];
      let candidateB = hubsB[0];
      const adjA = adjacencyMap.get(candidateA.id);
      if (adjA?.has(candidateB.id)) {
        if (hubsB[1] && !adjA.has(hubsB[1].id)) {
          candidateB = hubsB[1];
        } else if (hubsA[1] && !adjacencyMap.get(hubsA[1].id)?.has(candidateB.id)) {
          candidateA = hubsA[1];
        } else {
          continue;
        }
      }

      const pairKey = [gA, gB].sort().join('::');
      const existingBridgeEdges = crossGroupEdgeCount.get(pairKey) || 0;
      const cA = centralityMap.get(candidateA.id) || 0.5;
      const cB = centralityMap.get(candidateB.id) || 0.5;
      const gapScore = Number(
        (((cA + cB) * 50) / (1 + existingBridgeEdges * 0.65)).toFixed(1)
      );

      structuralGaps.push({
        id: `gap-${candidateA.id}-${candidateB.id}`,
        clusterA: gA,
        clusterB: gB,
        nodeA: candidateA,
        nodeB: candidateB,
        gapScore,
        rationale: `结构洞洞察：「${candidateA.title}」与「${candidateB.title}」分别是各自社群的高中心度枢纽，但二者缺乏直接知识引用。建立跨群落连接可打通知识盲区。`,
      });
    }
  }

  structuralGaps.sort((a, b) => b.gapScore - a.gapScore);

  // Compute Graph Analysis Common-Neighbors Link Predictions (for top hubs)
  const predictedLinks: Array<{
    nodeA: KnowledgeNode;
    nodeB: KnowledgeNode;
    commonCount: number;
  }> = [];

  const topNodes = [...nodes]
    .filter((n) => (degreeMap.get(n.id) || 0) >= 2)
    .sort((a, b) => (degreeMap.get(b.id) || 0) - (degreeMap.get(a.id) || 0))
    .slice(0, 32);

  for (let i = 0; i < topNodes.length; i++) {
    for (let j = i + 1; j < topNodes.length; j++) {
      const nA = topNodes[i];
      const nB = topNodes[j];
      const adjA = adjacencyMap.get(nA.id);
      const adjB = adjacencyMap.get(nB.id);
      if (!adjA || !adjB || adjA.has(nB.id)) continue;

      let common = 0;
      for (const nb of adjA) {
        if (adjB.has(nb)) common++;
      }
      if (common >= 2) {
        predictedLinks.push({ nodeA: nA, nodeB: nB, commonCount: common });
      }
    }
  }
  predictedLinks.sort((a, b) => b.commonCount - a.commonCount);

  return {
    centralityMap,
    structuralGaps: structuralGaps.slice(0, 4),
    predictedLinks: predictedLinks.slice(0, 6),
  };
}
