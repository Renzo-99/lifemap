import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';

export const BRANCH_COLORS = [
  '#3182F6', '#8B5CF6', '#10B981', '#F97316', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F59E0B', '#6366F1',
];

export function findCenterNodeId(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[]
): string | null {
  const meNode = nodes.find((n) => n.data.label.includes('나'));
  if (meNode) return meNode.id;

  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.id, 0);
  for (const e of edges) {
    counts.set(e.source, (counts.get(e.source) || 0) + 1);
    counts.set(e.target, (counts.get(e.target) || 0) + 1);
  }
  let maxId: string | null = null;
  let maxCount = -1;
  for (const [id, count] of counts) {
    if (count > maxCount) { maxCount = count; maxId = id; }
  }
  return maxId;
}

export function buildTree(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  centerId: string
) {
  const adjacency = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  }

  const depthMap = new Map<string, number>();
  const parentMap = new Map<string, string>();
  const childrenMap = new Map<string, string[]>();
  const visited = new Set<string>();
  const queue: string[] = [centerId];
  visited.add(centerId);
  depthMap.set(centerId, 0);

  const directedEdges: Edge<LifeMapEdgeData>[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adjacency.get(current) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        depthMap.set(neighbor, (depthMap.get(current) || 0) + 1);
        parentMap.set(neighbor, current);
        if (!childrenMap.has(current)) childrenMap.set(current, []);
        childrenMap.get(current)!.push(neighbor);

        const edge = edges.find(
          (e) => (e.source === current && e.target === neighbor) ||
                 (e.source === neighbor && e.target === current)
        );
        if (edge) {
          directedEdges.push({ ...edge, source: current, target: neighbor });
        }
      }
    }
  }

  for (const e of edges) {
    if (!directedEdges.find((d) => d.id === e.id)) {
      directedEdges.push(e);
    }
  }

  return { depthMap, parentMap, childrenMap, directedEdges };
}

// 노드 크기 계산
function getNodeSize(depth: number, label: string) {
  const labelLen = label?.length || 4;
  const baseW = depth === 0 ? 160 : depth === 1 ? 140 : 120;
  const w = Math.max(baseW, labelLen * 14 + 60);
  const h = depth === 0 ? 50 : depth === 1 ? 44 : 36;
  return { w, h };
}

// 브랜치의 모든 자손 ID 수집
function collectDescendants(nodeId: string, childrenMap: Map<string, string[]>, visibleIds: Set<string>): Set<string> {
  const result = new Set<string>();
  function traverse(id: string) {
    if (!visibleIds.has(id)) return;
    result.add(id);
    const children = childrenMap.get(id) || [];
    for (const child of children) traverse(child);
  }
  traverse(nodeId);
  return result;
}

// hidden 노드 계산 (접힌 노드의 자손)
function computeHiddenIds(collapsedIds: Set<string>, childrenMap: Map<string, string[]>): Set<string> {
  const hiddenIds = new Set<string>();
  function hideChildren(nodeId: string) {
    const children = childrenMap.get(nodeId) || [];
    for (const child of children) {
      hiddenIds.add(child);
      hideChildren(child);
    }
  }
  for (const cid of collapsedIds) hideChildren(cid);
  return hiddenIds;
}

// 브랜치 색상 맵 생성
function createBranchColorResolver(
  centerId: string,
  childrenMap: Map<string, string[]>,
  parentMap: Map<string, string>
) {
  const branchColorMap = new Map<string, string>();
  const centerChildren = childrenMap.get(centerId) || [];
  centerChildren.forEach((childId, i) => {
    branchColorMap.set(childId, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });

  return function getBranchColor(nodeId: string): string {
    if (nodeId === centerId) return BRANCH_COLORS[0];
    if (branchColorMap.has(nodeId)) return branchColorMap.get(nodeId)!;
    const parent = parentMap.get(nodeId);
    if (parent) {
      const color = getBranchColor(parent);
      branchColorMap.set(nodeId, color);
      return color;
    }
    return '#6B7280';
  };
}

// 깊이별 최대 노드 폭 계산 (같은 깊이의 노드를 동일 폭으로 정렬)
function computeMaxWidthPerDepth(
  nodes: Node<LifeMapNodeData>[],
  depthMap: Map<string, number>
): Map<number, number> {
  const maxWidthPerDepth = new Map<number, number>();
  nodes.forEach((node) => {
    const depth = depthMap.get(node.id) || 0;
    const { w } = getNodeSize(depth, node.data.label);
    maxWidthPerDepth.set(depth, Math.max(maxWidthPerDepth.get(depth) || 0, w));
  });
  return maxWidthPerDepth;
}

// dagre 실행 유틸
function runDagre(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  direction: 'LR' | 'RL' | 'TB',
  depthMap: Map<string, number>
): Map<string, { x: number; y: number; width: number; height: number }> {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 160, marginx: 40, marginy: 40 });

  // 같은 깊이의 노드는 동일 폭을 사용하여 핸들 위치 정렬
  const maxWidthPerDepth = computeMaxWidthPerDepth(nodes, depthMap);

  nodes.forEach((node) => {
    const depth = depthMap.get(node.id) || 0;
    const { h } = getNodeSize(depth, node.data.label);
    const w = maxWidthPerDepth.get(depth) || getNodeSize(depth, node.data.label).w;
    g.setNode(node.id, { width: w, height: h });
  });
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  nodes.forEach((node) => {
    const pos = g.node(node.id);
    if (pos) positions.set(node.id, { x: pos.x, y: pos.y, width: pos.width || 160, height: pos.height || 50 });
  });
  return positions;
}

export type LayoutDirection = 'LR' | 'TB' | 'RL' | 'HORIZONTAL';

export function getLayoutedElements(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  centerId: string,
  direction: LayoutDirection,
  collapsedIds: Set<string>,
  sideOverrides?: Map<string, 'left' | 'right'>
) {
  const { depthMap, parentMap, childrenMap, directedEdges } = buildTree(nodes, edges, centerId);
  const hiddenIds = computeHiddenIds(collapsedIds, childrenMap);
  const visibleNodes = nodes.filter((n) => !hiddenIds.has(n.id));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = directedEdges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );
  const getBranchColor = createBranchColorResolver(centerId, childrenMap, parentMap);

  // 양방향 레이아웃
  if (direction === 'HORIZONTAL') {
    return layoutBidirectional(
      visibleNodes, visibleEdges, centerId, depthMap, childrenMap, collapsedIds, getBranchColor, visibleNodeIds, sideOverrides
    );
  }

  // 단방향 레이아웃
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 40, ranksep: 160, marginx: 40, marginy: 40 });

  // 같은 깊이의 노드는 동일 폭으로 정렬
  const maxWidthPerDepth = computeMaxWidthPerDepth(visibleNodes, depthMap);

  visibleNodes.forEach((node) => {
    const depth = depthMap.get(node.id) || 0;
    const { h } = getNodeSize(depth, node.data.label);
    const w = maxWidthPerDepth.get(depth) || getNodeSize(depth, node.data.label).w;
    g.setNode(node.id, { width: w, height: h });
  });
  visibleEdges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  const layoutedNodes: Node<LifeMapNodeData>[] = visibleNodes.map((node) => {
    const pos = g.node(node.id);
    const depth = depthMap.get(node.id) || 0;
    return {
      ...node,
      type: 'mindmap',
      position: { x: pos.x - (pos.width || 160) / 2, y: pos.y - (pos.height || 50) / 2 },
      data: {
        ...node.data,
        color: getBranchColor(node.id),
        _isCenter: node.id === centerId,
        _isCollapsed: collapsedIds.has(node.id),
        _childCount: childrenMap.get(node.id)?.length || 0,
        _depth: depth,
        _direction: direction,
      } as LifeMapNodeData,
    };
  });

  const layoutedEdges: Edge<LifeMapEdgeData>[] = visibleEdges.map((edge) => ({
    ...edge,
    type: 'relationship',
    sourceHandle: direction === 'LR' ? 'right' : direction === 'RL' ? 'left' : 'bottom',
    targetHandle: direction === 'LR' ? 'left' : direction === 'RL' ? 'right' : 'top',
    data: { ...edge.data, color: getBranchColor(edge.target) } as LifeMapEdgeData,
  }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// 양방향 레이아웃: 중심 기준 좌/우 분배
function layoutBidirectional(
  visibleNodes: Node<LifeMapNodeData>[],
  visibleEdges: Edge<LifeMapEdgeData>[],
  centerId: string,
  depthMap: Map<string, number>,
  childrenMap: Map<string, string[]>,
  collapsedIds: Set<string>,
  getBranchColor: (nodeId: string) => string,
  visibleNodeIds: Set<string>,
  sideOverrides?: Map<string, 'left' | 'right'>
) {
  const centerChildren = (childrenMap.get(centerId) || []).filter((id) => visibleNodeIds.has(id));

  // sideOverrides가 있으면 그것을 기준으로, 없으면 인덱스 기반 반분할
  let rightChildren: string[];
  let leftChildren: string[];
  if (sideOverrides && sideOverrides.size > 0) {
    rightChildren = centerChildren.filter((id) => sideOverrides.get(id) !== 'left');
    leftChildren = centerChildren.filter((id) => sideOverrides.get(id) === 'left');
  } else {
    const half = Math.ceil(centerChildren.length / 2);
    rightChildren = centerChildren.slice(0, half);
    leftChildren = centerChildren.slice(half);
  }

  // 각 브랜치 소속 노드 ID 수집
  const rightIds = new Set<string>();
  rightChildren.forEach((id) => collectDescendants(id, childrenMap, visibleNodeIds).forEach((d) => rightIds.add(d)));
  const leftIds = new Set<string>();
  leftChildren.forEach((id) => collectDescendants(id, childrenMap, visibleNodeIds).forEach((d) => leftIds.add(d)));

  const sideMap = new Map<string, 'left' | 'right'>();
  rightIds.forEach((id) => sideMap.set(id, 'right'));
  leftIds.forEach((id) => sideMap.set(id, 'left'));

  const centerNode = visibleNodes.find((n) => n.id === centerId)!;
  const centerSize = getNodeSize(depthMap.get(centerId) || 0, centerNode.data.label);

  // 오른쪽 서브트리 (LR)
  const rightNodes = visibleNodes.filter((n) => n.id === centerId || rightIds.has(n.id));
  const rightEdges = visibleEdges.filter(
    (e) => (e.source === centerId || rightIds.has(e.source)) &&
           (e.target === centerId || rightIds.has(e.target))
  );
  const rightPositions = runDagre(rightNodes, rightEdges, 'LR', depthMap);

  // 왼쪽 서브트리 (RL)
  const leftNodes = visibleNodes.filter((n) => n.id === centerId || leftIds.has(n.id));
  const leftEdges = visibleEdges.filter(
    (e) => (e.source === centerId || leftIds.has(e.source)) &&
           (e.target === centerId || leftIds.has(e.target))
  );
  const leftPositions = runDagre(leftNodes, leftEdges, 'RL', depthMap);

  // 중심 노드를 (0, 0)에 고정하기 위한 오프셋
  const rightCenter = rightPositions.get(centerId);
  const leftCenter = leftPositions.get(centerId);
  const rOffX = rightCenter ? -rightCenter.x : 0;
  const rOffY = rightCenter ? -rightCenter.y : 0;
  const lOffX = leftCenter ? -leftCenter.x : 0;
  const lOffY = leftCenter ? -leftCenter.y : 0;

  const layoutedNodes: Node<LifeMapNodeData>[] = visibleNodes.map((node) => {
    const depth = depthMap.get(node.id) || 0;
    const isCenter = node.id === centerId;
    const side = sideMap.get(node.id);

    let x = 0, y = 0;
    if (isCenter) {
      x = -centerSize.w / 2;
      y = -centerSize.h / 2;
    } else if (side === 'right') {
      const pos = rightPositions.get(node.id);
      if (pos) { x = pos.x + rOffX - pos.width / 2; y = pos.y + rOffY - pos.height / 2; }
    } else {
      const pos = leftPositions.get(node.id);
      if (pos) { x = pos.x + lOffX - pos.width / 2; y = pos.y + lOffY - pos.height / 2; }
    }

    return {
      ...node,
      type: 'mindmap',
      position: { x, y },
      data: {
        ...node.data,
        color: getBranchColor(node.id),
        _isCenter: isCenter,
        _isCollapsed: collapsedIds.has(node.id),
        _childCount: childrenMap.get(node.id)?.length || 0,
        _depth: depth,
        _direction: isCenter ? 'HORIZONTAL' : (side === 'left' ? 'RL' : 'LR'),
      } as LifeMapNodeData,
    };
  });

  const layoutedEdges: Edge<LifeMapEdgeData>[] = visibleEdges.map((edge) => {
    const isLeft = sideMap.get(edge.target) === 'left';
    return {
      ...edge,
      type: 'relationship',
      sourceHandle: isLeft ? 'left' : 'right',
      targetHandle: isLeft ? 'right' : 'left',
      data: { ...edge.data, color: getBranchColor(edge.target) } as LifeMapEdgeData,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
