import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as d3Force from 'd3-force';
import * as d3Quadtree from 'd3-quadtree';
import {
  KnowledgeNode,
  KnowledgeEdge,
  GraphGroupRule,
  GraphDisplayConfig,
  GraphForceConfig,
  GraphVisualModeId,
  StructuralGapBridge,
} from '../types/graph';
import {
  computeNodeRadius,
  getEdgeEndpointIds,
  resolveNodeColor,
  computeConvexHull,
  expandPolygonFromCentroid,
} from '../utils/graphAlgorithms';
import { RELATIONSHIP_META } from '../data/livingKnowledgeData';

export interface GraphCanvasHandle {
  resetCamera: () => void;
  focusNode: (nodeId: string, zoomLevel?: number) => void;
  zoomBy: (factor: number) => void;
  reheatSimulation: (alpha?: number) => void;
}

interface GraphCanvasProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  adjacencyMap: Map<string, Set<string>>;
  incidentEdgesMap: Map<string, Set<string>>;
  degreeMap: Map<string, number>;
  centralityMap: Map<string, number>;
  structuralGaps: StructuralGapBridge[];
  predictedLinks: Array<{
    nodeA: KnowledgeNode;
    nodeB: KnowledgeNode;
    commonCount: number;
  }>;
  groupRules: GraphGroupRule[];
  displayConfig: GraphDisplayConfig;
  forceConfig: GraphForceConfig;
  visualMode: GraphVisualModeId;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  localCenterId: string | null;
  scopeMode: 'global' | 'local';
  isDark: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onHoverNode: (nodeId: string | null) => void;
  onDoubleClickNode: (nodeId: string) => void;
}

interface CameraTransform {
  x: number;
  y: number;
  k: number;
}

const TAG_PALETTE: Record<string, string> = {
  '#architecture': '#8B7CF6',
  '#core': '#6366F1',
  '#living-knowledge': '#A855F7',
  '#graph': '#38BDF8',
  '#physics': '#06B6D4',
  '#rendering': '#0EA5E9',
  '#adr': '#F59E0B',
  '#decision': '#D97706',
  '#ai': '#10B981',
  '#nlp': '#14B8A6',
  '#retrieval': '#059669',
  '#product': '#EC4899',
  '#ux': '#F43F5E',
  '#obsidian': '#C084FC',
  '#performance': '#22D3EE',
};

function getHeatColor(score: number): string {
  // Interpolates from cool cyan-blue (0) -> violet (0.45) -> amber-crimson (1.0)
  if (score < 0.45) {
    const t = score / 0.45;
    const r = Math.round(56 + t * (168 - 56));
    const g = Math.round(189 + t * (85 - 189));
    const b = Math.round(248 + t * (247 - 248));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (score - 0.45) / 0.55;
    const r = Math.round(168 + t * (245 - 168));
    const g = Math.round(85 + t * (158 - 85));
    const b = Math.round(247 + t * (11 - 247));
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function drawPolygonPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotationOffset = -Math.PI / 2
) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = rotationOffset + (i * 2 * Math.PI) / sides;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawSmoothClosedHull(
  ctx: CanvasRenderingContext2D,
  vertices: Array<{ x: number; y: number }>
) {
  if (vertices.length < 3) return;
  ctx.beginPath();
  const len = vertices.length;
  const firstMidX = (vertices[len - 1].x + vertices[0].x) / 2;
  const firstMidY = (vertices[len - 1].y + vertices[0].y) / 2;
  ctx.moveTo(firstMidX, firstMidY);

  for (let i = 0; i < len; i++) {
    const curr = vertices[i];
    const next = vertices[(i + 1) % len];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
  }
  ctx.closePath();
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(
  (
    {
      nodes,
      edges,
      adjacencyMap,
      incidentEdgesMap,
      degreeMap,
      centralityMap,
      structuralGaps,
      predictedLinks,
      groupRules,
      displayConfig,
      forceConfig,
      visualMode,
      selectedNodeId,
      hoveredNodeId,
      localCenterId,
      scopeMode,
      isDark,
      onSelectNode,
      onHoverNode,
      onDoubleClickNode,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const simulationRef = useRef<d3Force.Simulation<KnowledgeNode, undefined> | null>(null);
    const positionCacheRef = useRef<
      Map<string, { x: number; y: number; vx: number; vy: number }>
    >(new Map());

    const cameraRef = useRef<CameraTransform>({ x: 0, y: 0, k: 1 });
    const targetCameraRef = useRef<CameraTransform | null>(null);

    const nodesRef = useRef<KnowledgeNode[]>(nodes);
    const edgesRef = useRef<KnowledgeEdge[]>(edges);
    const nodeMapRef = useRef<Map<string, KnowledgeNode>>(new Map());
    const adjacencyRef = useRef<Map<string, Set<string>>>(adjacencyMap);
    const incidentEdgesRef = useRef<Map<string, Set<string>>>(incidentEdgesMap);
    const degreeRef = useRef<Map<string, number>>(degreeMap);
    const centralityRef = useRef<Map<string, number>>(centralityMap);
    const structuralGapsRef = useRef<StructuralGapBridge[]>(structuralGaps);
    const predictedLinksRef = useRef(predictedLinks);
    const groupRulesRef = useRef<GraphGroupRule[]>(groupRules);
    const displayRef = useRef<GraphDisplayConfig>(displayConfig);
    const forceRef = useRef<GraphForceConfig>(forceConfig);
    const visualModeRef = useRef<GraphVisualModeId>(visualMode);
    const selectedIdRef = useRef<string | null>(selectedNodeId);
    const hoveredIdRef = useRef<string | null>(hoveredNodeId);
    const localCenterIdRef = useRef<string | null>(localCenterId);
    const scopeModeRef = useRef<'global' | 'local'>(scopeMode);
    const isDarkRef = useRef<boolean>(isDark);

    const interactionRef = useRef<{
      isDraggingNode: boolean;
      draggedNode: KnowledgeNode | null;
      isPanning: boolean;
      pointerDownX: number;
      pointerDownY: number;
      lastPointerX: number;
      lastPointerY: number;
      movedDistance: number;
      lastClickTime: number;
      lastClickedNodeId: string | null;
      activePointers: Map<number, { x: number; y: number }>;
      lastPinchDistance: number | null;
      lastPinchCenter: { x: number; y: number } | null;
      longPressTimer: number | null;
    }>({
      isDraggingNode: false,
      draggedNode: null,
      isPanning: false,
      pointerDownX: 0,
      pointerDownY: 0,
      lastPointerX: 0,
      lastPointerY: 0,
      movedDistance: 0,
      lastClickTime: 0,
      lastClickedNodeId: null,
      activePointers: new Map(),
      lastPinchDistance: null,
      lastPinchCenter: null,
      longPressTimer: null,
    });

    const spotlightAlphaRef = useRef<number>(0);

    // Sync props to mutable refs
    useEffect(() => {
      adjacencyRef.current = adjacencyMap;
      incidentEdgesRef.current = incidentEdgesMap;
      degreeRef.current = degreeMap;
      centralityRef.current = centralityMap;
      structuralGapsRef.current = structuralGaps;
      predictedLinksRef.current = predictedLinks;
      groupRulesRef.current = groupRules;
      displayRef.current = displayConfig;
      visualModeRef.current = visualMode;
      selectedIdRef.current = selectedNodeId;
      hoveredIdRef.current = hoveredNodeId;
      localCenterIdRef.current = localCenterId;
      scopeModeRef.current = scopeMode;
      isDarkRef.current = isDark;
    }, [
      adjacencyMap,
      incidentEdgesMap,
      degreeMap,
      centralityMap,
      structuralGaps,
      predictedLinks,
      groupRules,
      displayConfig,
      visualMode,
      selectedNodeId,
      hoveredNodeId,
      localCenterId,
      scopeMode,
      isDark,
    ]);

    const screenToWorld = useCallback((sx: number, sy: number, width: number, height: number) => {
      const cam = cameraRef.current;
      const wx = (sx - width / 2 - cam.x) / cam.k;
      const wy = (sy - height / 2 - cam.y) / cam.k;
      return { x: wx, y: wy };
    }, []);

    const findNodeAtScreenPos = useCallback(
      (sx: number, sy: number): KnowledgeNode | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const worldPos = screenToWorld(sx, sy, rect.width, rect.height);
        const currentNodes = nodesRef.current;
        if (currentNodes.length === 0) return null;

        const qt = d3Quadtree
          .quadtree<KnowledgeNode>()
          .x((d) => d.x || 0)
          .y((d) => d.y || 0)
          .addAll(currentNodes);

        const maxSearchRadius = 32 / Math.max(0.25, cameraRef.current.k);
        const candidate = qt.find(worldPos.x, worldPos.y, maxSearchRadius);
        if (!candidate) return null;

        const deg = degreeRef.current.get(candidate.id) || 0;
        let nodeRadius = computeNodeRadius(
          candidate,
          deg,
          displayRef.current.nodeSizeMultiplier
        );
        if (visualModeRef.current === 'infranodus') {
          const cent = centralityRef.current.get(candidate.id) || 0;
          nodeRadius *= 0.85 + cent * 0.9;
        }
        const hitThreshold = Math.max(nodeRadius + 5 / cameraRef.current.k, 9 / cameraRef.current.k);
        const dx = (candidate.x || 0) - worldPos.x;
        const dy = (candidate.y || 0) - worldPos.y;
        if (dx * dx + dy * dy <= hitThreshold * hitThreshold) {
          return candidate;
        }
        return null;
      },
      [screenToWorld]
    );

    // Helper that applies mode-specific spatial forces (ExcaliBrain Compass, Radial Orbit, Timeline River, or Free Force)
    const applyModeForces = useCallback(
      (
        sim: d3Force.Simulation<KnowledgeNode, undefined>,
        mode: GraphVisualModeId,
        fConfig: GraphForceConfig,
        focalNodeId: string | null
      ) => {
        sim.velocityDecay(fConfig.damping);

        // Reset custom mode forces first
        sim.force('radial', null);

        if (mode === 'radial-chord') {
          // 4 Concentric orbital rings based on node role & degree
          sim.force('x', d3Force.forceX<KnowledgeNode>(0).strength(0.03));
          sim.force('y', d3Force.forceY<KnowledgeNode>(0).strength(0.03));
          sim.force(
            'radial',
            d3Force
              .forceRadial<KnowledgeNode>(
                (d) => {
                  const deg = degreeRef.current.get(d.id) || 0;
                  if (d.id === 'lk-engine-overview' || deg >= 7) return 75;
                  if (d.type === 'decision' || d.type === 'wiki') return 195;
                  if (d.type === 'concept' || deg >= 3) return 315;
                  return 430;
                },
                0,
                0
              )
              .strength(0.82)
          );
        } else if (mode === 'excalibrain') {
          // ExcaliBrain 4-Quadrant Ontology Compass around focal node
          const anchorId = focalNodeId || localCenterIdRef.current || 'lk-engine-overview';
          const anchorNeighbors = adjacencyRef.current.get(anchorId) || new Set<string>();

          sim.force(
            'x',
            d3Force
              .forceX<KnowledgeNode>((d) => {
                if (d.id === anchorId) return 0;
                if (d.type === 'decision' || d.group === 'adr-decisions') return -290; // West: Decisions
                if (d.type === 'concept' || d.group === 'ai-semantics') return 290; // East: Semantic Concepts
                if (!anchorNeighbors.has(d.id)) {
                  return d.group === 'core-engine' ? -150 : 150;
                }
                return 0;
              })
              .strength((d) => (d.id === anchorId ? 0.95 : 0.55))
          );

          sim.force(
            'y',
            d3Force
              .forceY<KnowledgeNode>((d) => {
                if (d.id === anchorId) return 0;
                if (d.type === 'decision' || d.type === 'concept') return 0;
                if (d.type === 'wiki' || d.group === 'core-engine') return -230; // North: Parent Architecture & Wiki
                return 230; // South: Implementation Pages & Unresolved Children
              })
              .strength((d) => (d.id === anchorId ? 0.95 : 0.55))
          );
        } else if (mode === 'timeline-river') {
          // 4 Horizontal Architectural Evolution Columns (Left to Right Flow)
          const stageX: Record<string, number> = {
            'adr-decisions': -420,
            'core-engine': -150,
            'graph-engine': 90,
            'ai-semantics': 280,
            'product-spec': 450,
            unresolved: 580,
          };
          sim.force(
            'x',
            d3Force
              .forceX<KnowledgeNode>((d) => stageX[d.group] ?? 0)
              .strength(0.75)
          );
          sim.force('y', d3Force.forceY<KnowledgeNode>(0).strength(0.16));
        } else {
          // Standard / InfraNodus / Juggl / Extended / Cosmos / Graph Analysis / Pulse
          sim.force(
            'x',
            d3Force.forceX<KnowledgeNode>(0).strength(fConfig.centerForce * 0.18)
          );
          sim.force(
            'y',
            d3Force.forceY<KnowledgeNode>(0).strength(fConfig.centerForce * 0.18)
          );
        }

        const charge = sim.force('charge') as d3Force.ForceManyBody<KnowledgeNode> | undefined;
        if (charge) {
          charge.strength(
            mode === 'radial-chord' ? -fConfig.repelForce * 0.65 : -fConfig.repelForce
          );
        }

        const link = sim.force('link') as
          | d3Force.ForceLink<KnowledgeNode, d3Force.SimulationLinkDatum<KnowledgeNode>>
          | undefined;
        if (link) {
          link.distance(fConfig.linkDistance);
          link.strength(
            mode === 'radial-chord' || mode === 'excalibrain' || mode === 'timeline-river'
              ? fConfig.linkForce * 0.25
              : fConfig.linkForce * 0.65
          );
        }

        const collide = sim.force('collide') as d3Force.ForceCollide<KnowledgeNode> | undefined;
        if (collide) {
          collide.radius((d) => {
            const deg = degreeRef.current.get(d.id) || 0;
            let r = computeNodeRadius(d, deg, displayRef.current.nodeSizeMultiplier);
            if (mode === 'infranodus') {
              const cent = centralityRef.current.get(d.id) || 0;
              r *= 0.85 + cent * 0.9;
            }
            return r * fConfig.collisionRadius + (mode === 'juggl' ? 7 : 3.5);
          });
        }
      },
      []
    );

    // Initialize persistent d3-force simulation ONCE
    useEffect(() => {
      const sim = d3Force
        .forceSimulation<KnowledgeNode>()
        .alphaDecay(0.024)
        .velocityDecay(forceRef.current.damping)
        .force(
          'x',
          d3Force.forceX<KnowledgeNode>(0).strength(forceRef.current.centerForce * 0.18)
        )
        .force(
          'y',
          d3Force.forceY<KnowledgeNode>(0).strength(forceRef.current.centerForce * 0.18)
        )
        .force(
          'charge',
          d3Force
            .forceManyBody<KnowledgeNode>()
            .strength(-forceRef.current.repelForce)
            .theta(0.85)
            .distanceMax(900)
        )
        .force(
          'collide',
          d3Force
            .forceCollide<KnowledgeNode>()
            .radius((d) => {
              const deg = degreeRef.current.get(d.id) || 0;
              return (
                computeNodeRadius(d, deg, displayRef.current.nodeSizeMultiplier) *
                  forceRef.current.collisionRadius +
                3.5
              );
            })
            .iterations(2)
        );

      sim.stop();
      simulationRef.current = sim;

      return () => {
        sim.stop();
      };
    }, []);

    // Update topology while preserving existing node coordinates
    useEffect(() => {
      const sim = simulationRef.current;
      if (!sim) return;

      for (const prevNode of nodesRef.current) {
        if (typeof prevNode.x === 'number' && typeof prevNode.y === 'number') {
          positionCacheRef.current.set(prevNode.id, {
            x: prevNode.x,
            y: prevNode.y,
            vx: prevNode.vx || 0,
            vy: prevNode.vy || 0,
          });
        }
      }

      const clusterIndexMap: Record<string, number> = {
        'core-engine': 0,
        'graph-engine': 1,
        'adr-decisions': 2,
        'ai-semantics': 3,
        'product-spec': 4,
        unresolved: 5,
      };

      const nextNodeMap = new Map<string, KnowledgeNode>();
      const preparedNodes = nodes.map((node, idx) => {
        const cached = positionCacheRef.current.get(node.id);
        if (cached) {
          node.x = cached.x;
          node.y = cached.y;
          node.vx = cached.vx * 0.4;
          node.vy = cached.vy * 0.4;
        } else {
          const clusterIdx = clusterIndexMap[node.group] ?? idx % 5;
          const clusterAngle = (clusterIdx / 5) * Math.PI * 2;
          const clusterOffset = nodes.length > 500 ? 220 : 120;
          const spiralRadius = Math.sqrt(idx + 1) * 14;
          const goldenAngle = idx * 2.399963229728653;
          node.x =
            Math.cos(clusterAngle) * clusterOffset + Math.cos(goldenAngle) * spiralRadius;
          node.y =
            Math.sin(clusterAngle) * clusterOffset + Math.sin(goldenAngle) * spiralRadius;
          node.vx = 0;
          node.vy = 0;
        }
        nextNodeMap.set(node.id, node);
        return node;
      });

      const simLinks: d3Force.SimulationLinkDatum<KnowledgeNode>[] = [];
      for (const edge of edges) {
        const { sourceId, targetId } = getEdgeEndpointIds(edge);
        const sNode = nextNodeMap.get(sourceId);
        const tNode = nextNodeMap.get(targetId);
        if (sNode && tNode) {
          simLinks.push({
            source: sNode,
            target: tNode,
          });
        }
      }

      nodesRef.current = preparedNodes;
      edgesRef.current = edges;
      nodeMapRef.current = nextNodeMap;

      sim.nodes(preparedNodes);
      sim.force(
        'link',
        d3Force
          .forceLink<KnowledgeNode, d3Force.SimulationLinkDatum<KnowledgeNode>>(simLinks)
          .id((d) => d.id)
          .distance(forceRef.current.linkDistance)
          .strength(forceRef.current.linkForce * 0.65)
      );

      applyModeForces(sim, visualModeRef.current, forceRef.current, selectedIdRef.current);

      const isLargeScale = preparedNodes.length >= 1000;
      sim.alpha(isLargeScale ? 0.55 : 0.48);

      if (scopeMode === 'local' && localCenterId) {
        const centerNode = nextNodeMap.get(localCenterId);
        if (centerNode && typeof centerNode.x === 'number' && typeof centerNode.y === 'number') {
          targetCameraRef.current = {
            x: -centerNode.x * cameraRef.current.k,
            y: -centerNode.y * cameraRef.current.k,
            k: Math.max(cameraRef.current.k, 1.05),
          };
        }
      }
    }, [nodes, edges, scopeMode, localCenterId, applyModeForces]);

    // Hot-update physics force parameters & visual mode transitions
    useEffect(() => {
      forceRef.current = forceConfig;
      visualModeRef.current = visualMode;
      const sim = simulationRef.current;
      if (!sim) return;

      applyModeForces(sim, visualMode, forceConfig, selectedNodeId);
      sim.alpha(Math.max(sim.alpha(), 0.52));
    }, [forceConfig, visualMode, selectedNodeId, displayConfig.nodeSizeMultiplier, applyModeForces]);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        const currentNodes = nodesRef.current;
        const canvas = canvasRef.current;
        if (!canvas || currentNodes.length === 0) {
          targetCameraRef.current = { x: 0, y: 0, k: 1 };
          return;
        }
        let minX = Infinity,
          maxX = -Infinity,
          minY = Infinity,
          maxY = -Infinity;
        for (const n of currentNodes) {
          const x = n.x || 0;
          const y = n.y || 0;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
        const rect = canvas.getBoundingClientRect();
        const spanX = Math.max(180, maxX - minX + 160);
        const spanY = Math.max(180, maxY - minY + 160);
        const fitK = Math.min(
          1.45,
          Math.max(0.18, Math.min((rect.width * 0.8) / spanX, (rect.height * 0.8) / spanY))
        );
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        targetCameraRef.current = {
          x: -cx * fitK,
          y: -cy * fitK,
          k: fitK,
        };
      },
      focusNode: (nodeId: string, zoomLevel = 1.45) => {
        const target = nodeMapRef.current.get(nodeId);
        if (!target) return;
        const tx = target.x || 0;
        const ty = target.y || 0;
        targetCameraRef.current = {
          x: -tx * zoomLevel,
          y: -ty * zoomLevel,
          k: zoomLevel,
        };
      },
      zoomBy: (factor: number) => {
        const current = targetCameraRef.current || cameraRef.current;
        const nextK = Math.min(4.5, Math.max(0.12, current.k * factor));
        const ratio = nextK / current.k;
        targetCameraRef.current = {
          x: current.x * ratio,
          y: current.y * ratio,
          k: nextK,
        };
      },
      reheatSimulation: (alpha = 0.45) => {
        if (simulationRef.current) {
          simulationRef.current.alpha(alpha);
        }
      },
    }));

    // Main High-DPI Canvas 2D Render & Physics Tick Loop supporting all Top 10 Visual Modes
    useEffect(() => {
      let animationFrameId: number;

      const renderFrame = (timeMs: number) => {
        const canvas = canvasRef.current;
        const sim = simulationRef.current;
        if (!canvas || !sim) {
          animationFrameId = requestAnimationFrame(renderFrame);
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;
        const nodeCount = currentNodes.length;
        const mode = visualModeRef.current;

        const rawDpr = window.devicePixelRatio || 1;
        const isSmallViewport = width < 768;
        const effectiveDpr =
          nodeCount >= 2500
            ? Math.min(rawDpr, 1.25)
            : isSmallViewport || nodeCount >= 1000
            ? Math.min(rawDpr, 1.5)
            : Math.min(rawDpr, 2);

        const targetPixelWidth = Math.round(width * effectiveDpr);
        const targetPixelHeight = Math.round(height * effectiveDpr);
        if (canvas.width !== targetPixelWidth || canvas.height !== targetPixelHeight) {
          canvas.width = targetPixelWidth;
          canvas.height = targetPixelHeight;
        }

        if (displayRef.current.animatePhysics) {
          if (sim.alpha() > 0.002 || interactionRef.current.isDraggingNode) {
            sim.tick();
          }
        }

        if (targetCameraRef.current) {
          const cam = cameraRef.current;
          const target = targetCameraRef.current;
          cam.x += (target.x - cam.x) * 0.16;
          cam.y += (target.y - cam.y) * 0.16;
          cam.k += (target.k - cam.k) * 0.16;
          if (
            Math.abs(target.x - cam.x) < 0.25 &&
            Math.abs(target.y - cam.y) < 0.25 &&
            Math.abs(target.k - cam.k) < 0.002
          ) {
            cameraRef.current = { ...target };
            targetCameraRef.current = null;
          }
        }

        const activeFocusId = hoveredIdRef.current || selectedIdRef.current;
        const targetSpotlight = activeFocusId ? 1 : 0;
        spotlightAlphaRef.current += (targetSpotlight - spotlightAlphaRef.current) * 0.22;
        const spotlightWeight = spotlightAlphaRef.current;

        const focusNeighbors = activeFocusId
          ? adjacencyRef.current.get(activeFocusId)
          : undefined;
        const focusEdges = activeFocusId
          ? incidentEdgesRef.current.get(activeFocusId)
          : undefined;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          animationFrameId = requestAnimationFrame(renderFrame);
          return;
        }

        const dark = isDarkRef.current;
        const cam = cameraRef.current;
        const disp = displayRef.current;

        ctx.save();
        ctx.scale(effectiveDpr, effectiveDpr);

        // 1. Background Fill
        if (mode === 'cosmos-nebula' && dark) {
          const bgGrad = ctx.createRadialGradient(
            width / 2,
            height / 2,
            20,
            width / 2,
            height / 2,
            Math.max(width, height) * 0.75
          );
          bgGrad.addColorStop(0, '#131124');
          bgGrad.addColorStop(0.55, '#0C0D16');
          bgGrad.addColorStop(1, '#07080D');
          ctx.fillStyle = bgGrad;
        } else {
          ctx.fillStyle = dark ? '#141519' : '#F8FAFC';
        }
        ctx.fillRect(0, 0, width, height);

        // Subtle spatial dot matrix
        if (cam.k > 0.35 && nodeCount <= 2500) {
          const gridStep = cam.k < 0.7 ? 72 : 36;
          const scaledStep = gridStep * cam.k;
          const offsetX = ((width / 2 + cam.x) % scaledStep + scaledStep) % scaledStep;
          const offsetY = ((height / 2 + cam.y) % scaledStep + scaledStep) % scaledStep;
          ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(15, 23, 42, 0.05)';
          for (let gx = offsetX; gx < width; gx += scaledStep) {
            for (let gy = offsetY; gy < height; gy += scaledStep) {
              ctx.fillRect(gx, gy, 1.2, 1.2);
            }
          }
        }

        // Apply camera world transform
        ctx.translate(width / 2 + cam.x, height / 2 + cam.y);
        ctx.scale(cam.k, cam.k);

        const cullMargin = 120 / cam.k;
        const worldLeft = (-width / 2 - cam.x) / cam.k - cullMargin;
        const worldRight = (width / 2 - cam.x) / cam.k + cullMargin;
        const worldTop = (-height / 2 - cam.y) / cam.k - cullMargin;
        const worldBottom = (height / 2 - cam.y) / cam.k + cullMargin;

        // =========================================================================
        // 1.5 MODE-SPECIFIC UNDERLAYS (InfraNodus Hulls, Radial Rings, ExcaliBrain Axes, Timeline Swimlanes, Cosmos Nebula Clouds)
        // =========================================================================
        if (
          (mode === 'infranodus' || mode === 'cosmos-nebula') &&
          nodeCount <= 1200
        ) {
          // Group nodes by community rule/group
          const clusterPoints = new Map<
            string,
            { color: string; label: string; points: Array<{ x: number; y: number }> }
          >();

          for (const n of currentNodes) {
            if (typeof n.x !== 'number' || typeof n.y !== 'number') continue;
            const cColor = resolveNodeColor(n, groupRulesRef.current, dark);
            const matchedRule = groupRulesRef.current.find((r) => r.color === cColor);
            const key = n.group;
            if (!clusterPoints.has(key)) {
              clusterPoints.set(key, {
                color: cColor,
                label: matchedRule?.label || n.group,
                points: [],
              });
            }
            clusterPoints.get(key)!.points.push({ x: n.x, y: n.y });
          }

          for (const [, cluster] of clusterPoints.entries()) {
            if (cluster.points.length < 3) continue;
            const rawHull = computeConvexHull(cluster.points);
            const { centroid, vertices } = expandPolygonFromCentroid(rawHull, 36);

            if (mode === 'cosmos-nebula') {
              // Deep space radial nebula glow cloud per community
              ctx.save();
              if (dark) ctx.globalCompositeOperation = 'screen';
              const nebulaGrad = ctx.createRadialGradient(
                centroid.x,
                centroid.y,
                10,
                centroid.x,
                centroid.y,
                195
              );
              nebulaGrad.addColorStop(0, `${cluster.color}28`);
              nebulaGrad.addColorStop(0.55, `${cluster.color}10`);
              nebulaGrad.addColorStop(1, 'transparent');
              ctx.fillStyle = nebulaGrad;
              ctx.beginPath();
              ctx.arc(centroid.x, centroid.y, 195, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            } else if (mode === 'infranodus') {
              // InfraNodus Smooth Community Convex Hull + Centroid Watermark Badge
              ctx.save();
              drawSmoothClosedHull(ctx, vertices);
              ctx.fillStyle = dark ? `${cluster.color}16` : `${cluster.color}14`;
              ctx.fill();
              ctx.lineWidth = 1.4 / Math.pow(cam.k, 0.35);
              ctx.setLineDash([6 / cam.k, 4 / cam.k]);
              ctx.strokeStyle = `${cluster.color}55`;
              ctx.stroke();

              // Community Topic Cluster Label at Centroid
              if (cam.k > 0.32) {
                const fontSize = 12 / Math.pow(cam.k, 0.45);
                ctx.font = `700 ${fontSize.toFixed(1)}px "Plus Jakarta Sans", sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = `${cluster.color}88`;
                ctx.fillText(cluster.label, centroid.x, centroid.y);
              }
              ctx.restore();
            }
          }
        }

        if (mode === 'radial-chord') {
          // Draw 4 Concentric Orbital Rings & Sector Guides
          const rings = [
            { r: 75, label: 'ORBIT 01 · 核心枢纽 (Core Hubs)' },
            { r: 195, label: 'ORBIT 02 · 架构规范与 ADR 决策' },
            { r: 315, label: 'ORBIT 03 · 领域概念与专题实体' },
            { r: 430, label: 'ORBIT 04 · 知识卡片与待建引用' },
          ];
          ctx.save();
          for (const ring of rings) {
            ctx.beginPath();
            ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
            ctx.lineWidth = 1.1 / Math.pow(cam.k, 0.35);
            ctx.setLineDash([5 / cam.k, 5 / cam.k]);
            ctx.strokeStyle = dark
              ? 'rgba(56, 189, 248, 0.22)'
              : 'rgba(2, 132, 199, 0.24)';
            ctx.stroke();

            if (cam.k > 0.35) {
              const fSize = 10 / Math.pow(cam.k, 0.4);
              ctx.font = `600 ${fSize.toFixed(1)}px "JetBrains Mono", monospace`;
              ctx.textAlign = 'center';
              ctx.fillStyle = dark
                ? 'rgba(56, 189, 248, 0.55)'
                : 'rgba(2, 132, 199, 0.65)';
              ctx.fillText(ring.label, 0, -ring.r - 7 / cam.k);
            }
          }
          ctx.restore();
        }

        if (mode === 'excalibrain') {
          // Draw ExcaliBrain 4-Quadrant Ontology Compass Guides
          ctx.save();
          ctx.lineWidth = 1.2 / Math.pow(cam.k, 0.35);
          ctx.setLineDash([6 / cam.k, 6 / cam.k]);
          ctx.strokeStyle = dark
            ? 'rgba(16, 185, 129, 0.22)'
            : 'rgba(5, 150, 105, 0.25)';

          // Crosshair axes
          ctx.beginPath();
          ctx.moveTo(-550, 0);
          ctx.lineTo(550, 0);
          ctx.moveTo(0, -420);
          ctx.lineTo(0, 420);
          ctx.stroke();

          // Compass Quadrant Headers
          if (cam.k > 0.35) {
            const fSize = 11 / Math.pow(cam.k, 0.45);
            ctx.font = `600 ${fSize.toFixed(1)}px "Plus Jakarta Sans", sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = dark ? 'rgba(16, 185, 129, 0.7)' : 'rgba(5, 150, 105, 0.8)';
            ctx.fillText('▲ 上游架构与父级 Wiki (Parents)', 0, -310);
            ctx.fillText('▼ 衍生知识笔记与子项 (Children)', 0, 315);
            ctx.fillText('◀ 项目决策依据 (ADR Decisions)', -310, -14);
            ctx.fillText('AI 语义概念关联 (Concepts) ▶', 310, -14);
          }
          ctx.restore();
        }

        if (mode === 'timeline-river') {
          // Draw 4 Horizontal Architectural Evolution Swimlanes
          const lanes = [
            { x: -420, title: 'STAGE 01 · 架构决策源头 (ADR)', color: '#F59E0B' },
            { x: -150, title: 'STAGE 02 · Living Knowledge 引擎', color: '#8B7CF6' },
            { x: 90, title: 'STAGE 03 · 图谱物理与渲染管线', color: '#38BDF8' },
            { x: 280, title: 'STAGE 04 · AI 语义提取与检索', color: '#10B981' },
            { x: 470, title: 'STAGE 05 · 产品规范与演进', color: '#EC4899' },
          ];
          ctx.save();
          for (const lane of lanes) {
            ctx.beginPath();
            ctx.moveTo(lane.x, -360);
            ctx.lineTo(lane.x, 360);
            ctx.lineWidth = 1.2 / Math.pow(cam.k, 0.35);
            ctx.setLineDash([6 / cam.k, 6 / cam.k]);
            ctx.strokeStyle = `${lane.color}38`;
            ctx.stroke();

            if (cam.k > 0.32) {
              const fSize = 10.5 / Math.pow(cam.k, 0.45);
              ctx.font = `600 ${fSize.toFixed(1)}px "Plus Jakarta Sans", sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillStyle = `${lane.color}BB`;
              ctx.fillText(lane.title, lane.x, -375);
            }
          }
          ctx.restore();
        }

        const nMap = nodeMapRef.current;
        const baseThickness = (1.05 * disp.linkThicknessMultiplier) / Math.pow(cam.k, 0.35);

        // =========================================================================
        // 2. RENDER EDGES (Mode-aware: Straight, Juggl Bezier Arc, Radial Chord, ExcaliBrain Elbow, Timeline Cubic, Pulse Photon Stream)
        // =========================================================================
        for (let i = 0; i < currentEdges.length; i++) {
          const edge = currentEdges[i];
          const { sourceId, targetId } = getEdgeEndpointIds(edge);
          const sNode = nMap.get(sourceId);
          const tNode = nMap.get(targetId);
          if (!sNode || !tNode) continue;

          const sx = sNode.x || 0;
          const sy = sNode.y || 0;
          const tx = tNode.x || 0;
          const ty = tNode.y || 0;

          if (
            (sx < worldLeft && tx < worldLeft) ||
            (sx > worldRight && tx > worldRight) ||
            (sy < worldTop && ty < worldTop) ||
            (sy > worldBottom && ty > worldBottom)
          ) {
            continue;
          }

          const isHighlightedEdge = activeFocusId ? focusEdges?.has(edge.id) ?? false : false;

          if (nodeCount >= 3500 && cam.k < 0.25 && !isHighlightedEdge && i % 2 === 1) {
            continue;
          }

          const relMeta = RELATIONSHIP_META[edge.relationshipType];
          let strokeColor = isHighlightedEdge
            ? '#8B7CF6'
            : dark
            ? relMeta.colorDark
            : relMeta.colorLight;

          if (mode === 'graph-analysis' && !isHighlightedEdge) {
            const cScore =
              ((centralityRef.current.get(sourceId) || 0) +
                (centralityRef.current.get(targetId) || 0)) /
              2;
            strokeColor = getHeatColor(cScore);
          }

          let edgeAlpha = disp.colorOpacity * (edge.verified ? 0.38 : 0.48);
          if (spotlightWeight > 0.02) {
            const targetAlpha = isHighlightedEdge
              ? Math.min(1, disp.colorOpacity * 0.94)
              : disp.colorOpacity * 0.06;
            edgeAlpha = edgeAlpha * (1 - spotlightWeight) + targetAlpha * spotlightWeight;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0.03, Math.min(1, edgeAlpha));
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isHighlightedEdge
            ? baseThickness * 1.85
            : mode === 'extended-graph'
            ? baseThickness * (0.7 + edge.weight * 0.85)
            : baseThickness;

          if (
            (!edge.verified || edge.relationshipType === 'ai-extracted') &&
            disp.distinguishAIEgesDashed
          ) {
            const dashLen = 4.5 / Math.pow(cam.k, 0.3);
            ctx.setLineDash([dashLen, dashLen * 0.85]);
          }

          const dx = tx - sx;
          const dy = ty - sy;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = -dy / dist;
          const ny = dx / dist;

          // Compute curve geometry based on Visual Mode
          ctx.beginPath();
          let midCurveX = (sx + tx) / 2;
          let midCurveY = (sy + ty) / 2;

          if (mode === 'juggl') {
            // Juggl Quadratic Bezier Arc
            const curvature = Math.min(42, dist * 0.18);
            const ctrlX = (sx + tx) / 2 + nx * curvature;
            const ctrlY = (sy + ty) / 2 + ny * curvature;
            midCurveX = (sx + 2 * ctrlX + tx) / 4;
            midCurveY = (sy + 2 * ctrlY + ty) / 4;
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(ctrlX, ctrlY, tx, ty);
          } else if (mode === 'radial-chord') {
            // Radial Chord curving gently toward origin (0,0)
            const ctrlX = (sx + tx) * 0.24;
            const ctrlY = (sy + ty) * 0.24;
            ctx.moveTo(sx, sy);
            ctx.quadraticCurveTo(ctrlX, ctrlY, tx, ty);
          } else if (mode === 'excalibrain') {
            // ExcaliBrain Smooth Orthogonal Elbow Connector
            const midX = (sx + tx) / 2;
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(midX, sy, midX, ty, tx, ty);
          } else if (mode === 'timeline-river') {
            // Horizontal S-Curve River Flow
            const c1x = sx + dx * 0.45;
            const c2x = sx + dx * 0.55;
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(c1x, sy, c2x, ty, tx, ty);
          } else {
            ctx.moveTo(sx, sy);
            ctx.lineTo(tx, ty);
          }
          ctx.stroke();

          // Juggl Semantic Edge Pill Label at midpoint when zoomed in or highlighted
          if (
            mode === 'juggl' &&
            (isHighlightedEdge || (cam.k > 0.85 && nodeCount <= 120))
          ) {
            ctx.setLineDash([]);
            const badgeSize = 8.5 / Math.pow(cam.k, 0.45);
            ctx.font = `600 ${badgeSize.toFixed(1)}px "Plus Jakarta Sans", sans-serif`;
            const badgeText = relMeta.badge;
            const textW = ctx.measureText(badgeText).width;
            const padX = 4 / Math.pow(cam.k, 0.45);
            const padY = 2.2 / Math.pow(cam.k, 0.45);

            ctx.fillStyle = dark ? 'rgba(24, 25, 32, 0.92)' : 'rgba(255, 255, 255, 0.94)';
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 0.9 / Math.pow(cam.k, 0.45);
            ctx.beginPath();
            ctx.roundRect(
              midCurveX - textW / 2 - padX,
              midCurveY - badgeSize / 2 - padY,
              textW + padX * 2,
              badgeSize + padY * 2,
              3 / Math.pow(cam.k, 0.45)
            );
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = strokeColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, midCurveX, midCurveY);
          }

          // Mode 9: Neural Knowledge Pulse — Animated Signal Particles flowing along edges
          if (
            mode === 'knowledge-pulse' &&
            (nodeCount <= 600 || isHighlightedEdge)
          ) {
            const speed = edge.verified ? 0.00048 : 0.00032;
            const phaseOffset = (i * 0.19) % 1;
            const t = (timeMs * speed + phaseOffset) % 1;
            const px = sx + dx * t;
            const py = sy + dy * t;
            const particleRadius = (isHighlightedEdge ? 3.2 : 2.1) / Math.pow(cam.k, 0.3);

            ctx.setLineDash([]);
            ctx.globalAlpha = isHighlightedEdge ? 1 : Math.min(0.95, edgeAlpha * 2.1);
            ctx.fillStyle = edge.verified ? '#2DD4BF' : '#F59E0B';
            ctx.beginPath();
            ctx.arc(px, py, particleRadius, 0, Math.PI * 2);
            ctx.fill();
          }

          // Optional Directional Arrow
          if (
            (disp.showArrows || mode === 'juggl' || mode === 'timeline-river') &&
            (cam.k > 0.55 || isHighlightedEdge)
          ) {
            if (dist > 14) {
              const targetDeg = degreeRef.current.get(targetId) || 0;
              const targetRadius = computeNodeRadius(
                tNode,
                targetDeg,
                disp.nodeSizeMultiplier
              );
              const ux = dx / dist;
              const uy = dy / dist;
              const tipX = tx - ux * (targetRadius + 2.5);
              const tipY = ty - uy * (targetRadius + 2.5);
              const arrowSize = Math.max(3.5, 5.2 / Math.pow(cam.k, 0.25));

              ctx.setLineDash([]);
              ctx.fillStyle = strokeColor;
              ctx.beginPath();
              ctx.moveTo(tipX, tipY);
              ctx.lineTo(
                tipX - ux * arrowSize - uy * arrowSize * 0.58,
                tipY - uy * arrowSize + ux * arrowSize * 0.58
              );
              ctx.lineTo(
                tipX - ux * arrowSize + uy * arrowSize * 0.58,
                tipY - uy * arrowSize - ux * arrowSize * 0.58
              );
              ctx.closePath();
              ctx.fill();
            }
          }

          ctx.restore();
        }

        // =========================================================================
        // 2.5 INFRANODUS STRUCTURAL GAPS & GRAPH ANALYSIS LINK PREDICTION OVERLAYS
        // =========================================================================
        if (mode === 'infranodus' && nodeCount <= 1000) {
          const gaps = structuralGapsRef.current;
          const pulse = 0.55 + 0.45 * Math.sin(timeMs * 0.004);
          for (let gIdx = 0; gIdx < gaps.length; gIdx++) {
            const gap = gaps[gIdx];
            const nA = nMap.get(gap.nodeA.id);
            const nB = nMap.get(gap.nodeB.id);
            if (!nA || !nB) continue;
            const ax = nA.x || 0;
            const ay = nA.y || 0;
            const bx = nB.x || 0;
            const by = nB.y || 0;

            ctx.save();
            ctx.strokeStyle = '#F59E0B';
            ctx.lineWidth = (2.1 / Math.pow(cam.k, 0.35)) * (0.85 + pulse * 0.3);
            ctx.setLineDash([7 / cam.k, 5 / cam.k]);
            ctx.globalAlpha = 0.78;

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            // Midpoint Structural Gap Insight Badge
            const mx = (ax + bx) / 2;
            const my = (ay + by) / 2;
            if (cam.k > 0.38) {
              ctx.setLineDash([]);
              const fSize = 9.5 / Math.pow(cam.k, 0.45);
              ctx.font = `700 ${fSize.toFixed(1)}px "JetBrains Mono", monospace`;
              const label = `⚡ 结构洞盲区 #${gIdx + 1} (Gap ${gap.gapScore})`;
              const tw = ctx.measureText(label).width;
              const px = 5 / Math.pow(cam.k, 0.45);
              const py = 2.8 / Math.pow(cam.k, 0.45);

              ctx.fillStyle = dark ? 'rgba(20, 21, 25, 0.94)' : 'rgba(255, 251, 235, 0.96)';
              ctx.strokeStyle = '#F59E0B';
              ctx.lineWidth = 1.2 / Math.pow(cam.k, 0.45);
              ctx.beginPath();
              ctx.roundRect(
                mx - tw / 2 - px,
                my - fSize / 2 - py,
                tw + px * 2,
                fSize + py * 2,
                4 / Math.pow(cam.k, 0.45)
              );
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#F59E0B';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, mx, my);
            }
            ctx.restore();
          }
        }

        if (mode === 'graph-analysis' && nodeCount <= 1000) {
          const preds = predictedLinksRef.current;
          for (const pred of preds) {
            const nA = nMap.get(pred.nodeA.id);
            const nB = nMap.get(pred.nodeB.id);
            if (!nA || !nB) continue;
            const ax = nA.x || 0;
            const ay = nA.y || 0;
            const bx = nB.x || 0;
            const by = nB.y || 0;

            ctx.save();
            ctx.strokeStyle = '#F43F5E';
            ctx.lineWidth = 1.5 / Math.pow(cam.k, 0.35);
            ctx.setLineDash([4 / cam.k, 4 / cam.k]);
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            if (cam.k > 0.5) {
              const mx = (ax + bx) / 2;
              const my = (ay + by) / 2;
              const fSize = 8.5 / Math.pow(cam.k, 0.45);
              ctx.font = `600 ${fSize.toFixed(1)}px "JetBrains Mono", monospace`;
              ctx.fillStyle = '#F43F5E';
              ctx.textAlign = 'center';
              ctx.fillText(`预测连接 (共同邻居:${pred.commonCount})`, mx, my - 4 / cam.k);
            }
            ctx.restore();
          }
        }

        // =========================================================================
        // 3. RENDER NODES (Mode-aware shapes, Extended Graph multi-tag rings, Cosmos starburst, InfraNodus centrality scaling)
        // =========================================================================
        const visibleNodesForLabels: Array<{
          node: KnowledgeNode;
          x: number;
          y: number;
          radius: number;
          degree: number;
          centrality: number;
          isPrimaryFocus: boolean;
          isNeighborFocus: boolean;
        }> = [];

        for (let i = 0; i < currentNodes.length; i++) {
          const node = currentNodes[i];
          const nx = node.x || 0;
          const ny = node.y || 0;

          if (nx < worldLeft || nx > worldRight || ny < worldTop || ny > worldBottom) {
            continue;
          }

          const deg = degreeRef.current.get(node.id) || 0;
          const cent = centralityRef.current.get(node.id) || 0;
          let radius = computeNodeRadius(node, deg, disp.nodeSizeMultiplier);

          if (mode === 'infranodus') {
            // InfraNodus scales nodes dramatically by Betweenness/Centrality importance
            radius *= 0.82 + cent * 0.95;
          }

          const color =
            mode === 'graph-analysis'
              ? getHeatColor(cent)
              : resolveNodeColor(node, groupRulesRef.current, dark);

          const isPrimaryFocus = activeFocusId === node.id;
          const isNeighborFocus = activeFocusId
            ? focusNeighbors?.has(node.id) ?? false
            : false;
          const isLocalCenter =
            scopeModeRef.current === 'local' && localCenterIdRef.current === node.id;

          let nodeAlpha = disp.colorOpacity * (node.resolved ? 0.94 : 0.55);
          if (spotlightWeight > 0.02) {
            const targetAlpha =
              isPrimaryFocus || isNeighborFocus ? 1.0 : disp.colorOpacity * 0.13;
            nodeAlpha = nodeAlpha * (1 - spotlightWeight) + targetAlpha * spotlightWeight;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0.05, Math.min(1, nodeAlpha));

          // Mode 6: Cosmos Nebula Starburst Halo & Cross Flare
          if (mode === 'cosmos-nebula') {
            const glowGrad = ctx.createRadialGradient(
              nx,
              ny,
              radius * 0.2,
              nx,
              ny,
              radius * 2.8
            );
            glowGrad.addColorStop(0, color);
            glowGrad.addColorStop(0.45, `${color}55`);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, radius * 2.8, 0, Math.PI * 2);
            ctx.fill();

            // 4-Point Starburst diffraction spike on high-degree hubs
            if (deg >= 5 || isPrimaryFocus) {
              const spikeLen = radius * (isPrimaryFocus ? 3.4 : 2.5);
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.1 / Math.pow(cam.k, 0.35);
              ctx.beginPath();
              ctx.moveTo(nx - spikeLen, ny);
              ctx.lineTo(nx + spikeLen, ny);
              ctx.moveTo(nx, ny - spikeLen);
              ctx.lineTo(nx, ny + spikeLen);
              ctx.stroke();
            }
          }

          // Mode 9: Neural Knowledge Pulse expanding sonar ripple on focused/hub nodes
          if (mode === 'knowledge-pulse' && (isPrimaryFocus || deg >= 6)) {
            const ripplePhase = ((timeMs * 0.0012 + i * 0.3) % 1);
            const rippleRadius = radius + ripplePhase * radius * 2.4;
            ctx.beginPath();
            ctx.arc(nx, ny, rippleRadius, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.4 / Math.pow(cam.k, 0.35);
            ctx.globalAlpha = nodeAlpha * (1 - ripplePhase) * 0.75;
            ctx.stroke();
            ctx.globalAlpha = Math.max(0.05, Math.min(1, nodeAlpha));
          }

          // Halo ring for active hovered/selected node or local graph center
          if (isPrimaryFocus || isLocalCenter || selectedIdRef.current === node.id) {
            ctx.beginPath();
            ctx.arc(nx, ny, radius + 4.8 / Math.pow(cam.k, 0.3), 0, Math.PI * 2);
            ctx.fillStyle = isPrimaryFocus
              ? 'rgba(139, 124, 246, 0.32)'
              : 'rgba(56, 189, 248, 0.24)';
            ctx.fill();
          }

          // Node Shape Drawing (Juggl uses semantic polygons; others use circular nodes)
          if (mode === 'juggl') {
            if (node.type === 'wiki') {
              drawPolygonPath(ctx, nx, ny, radius * 1.12, 6); // Hexagon for Wiki
            } else if (node.type === 'decision') {
              drawPolygonPath(ctx, nx, ny, radius * 1.18, 4, 0); // Diamond for ADR Decision
            } else if (node.type === 'concept') {
              const w = radius * 2.1;
              const h = radius * 1.55;
              ctx.beginPath();
              ctx.roundRect(nx - w / 2, ny - h / 2, w, h, radius * 0.45);
            } else {
              ctx.beginPath();
              ctx.arc(nx, ny, radius, 0, Math.PI * 2);
            }
          } else {
            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);
          }

          if (!node.resolved || node.type === 'unresolved') {
            ctx.fillStyle = dark ? '#1E2028' : '#F1F5F9';
            ctx.fill();
            ctx.lineWidth = 1.4 / Math.pow(cam.k, 0.3);
            ctx.setLineDash([2.5, 2.5]);
            ctx.strokeStyle = color;
            ctx.stroke();
          } else {
            ctx.fillStyle = color;
            ctx.fill();

            if (isPrimaryFocus || isNeighborFocus || isLocalCenter || mode === 'juggl') {
              ctx.lineWidth = (isPrimaryFocus ? 2.2 : 1.3) / Math.pow(cam.k, 0.3);
              ctx.strokeStyle = dark ? '#FFFFFF' : '#0F172A';
              ctx.stroke();
            }
          }

          // Mode 4: Extended Graph Multi-Tag Concentric Segmented Arcs
          if (mode === 'extended-graph' && node.tags.length > 0 && cam.k > 0.38) {
            const ringRadius = radius + 3.2 / Math.pow(cam.k, 0.25);
            const arcCount = Math.min(4, node.tags.length);
            const arcSpan = (Math.PI * 2) / arcCount;
            const gapAngle = 0.14;
            ctx.lineWidth = 2.2 / Math.pow(cam.k, 0.3);
            ctx.setLineDash([]);

            for (let tIdx = 0; tIdx < arcCount; tIdx++) {
              const tag = node.tags[tIdx];
              const arcColor = TAG_PALETTE[tag] || '#38BDF8';
              ctx.strokeStyle = arcColor;
              ctx.beginPath();
              ctx.arc(
                nx,
                ny,
                ringRadius,
                tIdx * arcSpan + gapAngle / 2,
                (tIdx + 1) * arcSpan - gapAngle / 2
              );
              ctx.stroke();
            }
          }

          ctx.restore();

          visibleNodesForLabels.push({
            node,
            x: nx,
            y: ny,
            radius,
            degree: deg,
            centrality: cent,
            isPrimaryFocus,
            isNeighborFocus,
          });
        }

        // =========================================================================
        // 4. RENDER NODE TITLES (With InfraNodus Proportional Font Scaling & Graph Analysis Score Badges)
        // =========================================================================
        const fadeThreshold = disp.textFadeThreshold;
        const maxLabelsInFrame = nodeCount >= 2000 ? 75 : nodeCount >= 800 ? 120 : 260;
        let drawnLabels = 0;

        visibleNodesForLabels.sort((a, b) => {
          if (a.isPrimaryFocus !== b.isPrimaryFocus) return a.isPrimaryFocus ? -1 : 1;
          if (a.isNeighborFocus !== b.isNeighborFocus) return a.isNeighborFocus ? -1 : 1;
          return b.degree - a.degree;
        });

        const baseFontSize = 11.5 / Math.pow(cam.k, 0.55);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        for (let i = 0; i < visibleNodesForLabels.length; i++) {
          if (drawnLabels >= maxLabelsInFrame) break;
          const item = visibleNodesForLabels[i];

          const importanceBoost = Math.min(0.68, item.degree * 0.058);
          const effectiveZoom = cam.k + importanceBoost;

          let labelAlpha = 0;
          if (item.isPrimaryFocus || item.isNeighborFocus) {
            labelAlpha = 1;
          } else if (effectiveZoom >= fadeThreshold) {
            labelAlpha = Math.min(1, (effectiveZoom - fadeThreshold) / 0.45);
            if (spotlightWeight > 0.02) {
              labelAlpha *= 1 - spotlightWeight * 0.88;
            }
          }

          if (labelAlpha <= 0.05) continue;

          const extraRingOffset = mode === 'extended-graph' ? 4 / Math.pow(cam.k, 0.3) : 0;
          const labelY =
            item.y + item.radius + extraRingOffset + 4 / Math.pow(cam.k, 0.4);
          let title =
            item.node.title.length > 28 && !item.isPrimaryFocus
              ? item.node.title.slice(0, 26) + '…'
              : item.node.title;

          if (mode === 'graph-analysis') {
            title = `${title} [${(item.centrality * 100).toFixed(0)}]`;
          }

          ctx.save();
          ctx.globalAlpha = labelAlpha;

          // InfraNodus scales label typography dynamically with node centrality
          const modeFontScale =
            mode === 'infranodus'
              ? 0.88 + item.centrality * 0.48
              : item.isPrimaryFocus
              ? 1.08
              : 1.0;

          ctx.font = `${
            item.isPrimaryFocus || (mode === 'infranodus' && item.centrality > 0.65)
              ? 600
              : 500
          } ${(baseFontSize * modeFontScale).toFixed(2)}px "Plus Jakarta Sans", -apple-system, sans-serif`;

          ctx.lineWidth = 3.2 / Math.pow(cam.k, 0.55);
          ctx.strokeStyle = dark ? 'rgba(20, 21, 25, 0.92)' : 'rgba(248, 250, 252, 0.94)';
          ctx.lineJoin = 'round';
          ctx.strokeText(title, item.x, labelY);

          ctx.fillStyle = item.isPrimaryFocus
            ? dark
              ? '#FFFFFF'
              : '#0F172A'
            : dark
            ? '#D4D6DF'
            : '#1E293B';
          ctx.fillText(title, item.x, labelY);
          ctx.restore();

          drawnLabels++;
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(renderFrame);
      };

      animationFrameId = requestAnimationFrame(renderFrame);
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

    // Wheel zoom centered on cursor position
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        targetCameraRef.current = null;

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const cam = cameraRef.current;
        const zoomFactor = Math.exp(-e.deltaY * 0.0014);
        const nextK = Math.min(4.5, Math.max(0.12, cam.k * zoomFactor));

        const wx = (mouseX - rect.width / 2 - cam.x) / cam.k;
        const wy = (mouseY - rect.height / 2 - cam.y) / cam.k;

        cam.k = nextK;
        cam.x = mouseX - rect.width / 2 - wx * nextK;
        cam.y = mouseY - rect.height / 2 - wy * nextK;
      };

      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      };
    }, []);

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.setPointerCapture(e.pointerId);
      targetCameraRef.current = null;

      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const state = interactionRef.current;
      state.activePointers.set(e.pointerId, { x: sx, y: sy });

      if (state.longPressTimer) {
        window.clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }

      if (state.activePointers.size === 2) {
        state.isDraggingNode = false;
        if (state.draggedNode) {
          state.draggedNode.fx = null;
          state.draggedNode.fy = null;
          state.draggedNode = null;
        }
        state.isPanning = false;
        const pts = Array.from(state.activePointers.values());
        state.lastPinchDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        state.lastPinchCenter = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };
        return;
      }

      state.pointerDownX = sx;
      state.pointerDownY = sy;
      state.lastPointerX = sx;
      state.lastPointerY = sy;
      state.movedDistance = 0;

      const hitNode = findNodeAtScreenPos(sx, sy);
      if (hitNode) {
        state.isDraggingNode = true;
        state.draggedNode = hitNode;
        const worldPos = screenToWorld(sx, sy, rect.width, rect.height);
        hitNode.fx = worldPos.x;
        hitNode.fy = worldPos.y;
        onHoverNode(hitNode.id);

        if (simulationRef.current && displayRef.current.animatePhysics) {
          simulationRef.current.alphaTarget(0.28);
        }

        if (e.pointerType === 'touch') {
          state.longPressTimer = window.setTimeout(() => {
            if (state.movedDistance < 10) {
              onSelectNode(hitNode.id);
            }
          }, 480);
        }
      } else {
        state.isPanning = true;
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      const state = interactionRef.current;
      if (state.activePointers.has(e.pointerId)) {
        state.activePointers.set(e.pointerId, { x: sx, y: sy });
      }

      if (state.activePointers.size === 2) {
        const pts = Array.from(state.activePointers.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const center = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
        };

        if (state.lastPinchDistance && state.lastPinchCenter && dist > 12) {
          const cam = cameraRef.current;
          const scaleFactor = dist / state.lastPinchDistance;
          const nextK = Math.min(4.5, Math.max(0.12, cam.k * scaleFactor));

          const wx = (center.x - rect.width / 2 - cam.x) / cam.k;
          const wy = (center.y - rect.height / 2 - cam.y) / cam.k;

          cam.k = nextK;
          cam.x =
            center.x -
            rect.width / 2 -
            wx * nextK +
            (center.x - state.lastPinchCenter.x);
          cam.y =
            center.y -
            rect.height / 2 -
            wy * nextK +
            (center.y - state.lastPinchCenter.y);
        }

        state.lastPinchDistance = dist;
        state.lastPinchCenter = center;
        return;
      }

      const dx = sx - state.lastPointerX;
      const dy = sy - state.lastPointerY;
      state.movedDistance += Math.hypot(dx, dy);
      state.lastPointerX = sx;
      state.lastPointerY = sy;

      if (state.isDraggingNode && state.draggedNode) {
        const worldPos = screenToWorld(sx, sy, rect.width, rect.height);
        state.draggedNode.fx = worldPos.x;
        state.draggedNode.fy = worldPos.y;
        state.draggedNode.x = worldPos.x;
        state.draggedNode.y = worldPos.y;
        return;
      }

      if (state.isPanning) {
        cameraRef.current.x += dx;
        cameraRef.current.y += dy;
        return;
      }

      const hovered = findNodeAtScreenPos(sx, sy);
      const nextHoverId = hovered ? hovered.id : null;
      if (nextHoverId !== hoveredIdRef.current) {
        onHoverNode(nextHoverId);
      }
    };

    const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (canvas && canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      const state = interactionRef.current;
      state.activePointers.delete(e.pointerId);

      if (state.longPressTimer) {
        window.clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
      }

      if (state.activePointers.size < 2) {
        state.lastPinchDistance = null;
        state.lastPinchCenter = null;
      }

      if (state.isDraggingNode && state.draggedNode) {
        const releasedNode = state.draggedNode;
        releasedNode.fx = null;
        releasedNode.fy = null;

        if (simulationRef.current) {
          simulationRef.current.alphaTarget(0);
        }

        if (state.movedDistance < 6) {
          const now = performance.now();
          if (
            state.lastClickedNodeId === releasedNode.id &&
            now - state.lastClickTime < 320
          ) {
            onDoubleClickNode(releasedNode.id);
            state.lastClickedNodeId = null;
          } else {
            onSelectNode(releasedNode.id);
            state.lastClickedNodeId = releasedNode.id;
            state.lastClickTime = now;
          }
        }
      } else if (state.isPanning && state.movedDistance < 5) {
        onSelectNode(null);
      }

      state.isDraggingNode = false;
      state.draggedNode = null;
      state.isPanning = false;
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden select-none touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUpOrCancel}
          onPointerCancel={handlePointerUpOrCancel}
          onPointerLeave={() => {
            if (!interactionRef.current.isDraggingNode) {
              onHoverNode(null);
            }
          }}
          className={`w-full h-full block ${
            hoveredNodeId ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
          }`}
        />
      </div>
    );
  }
);
