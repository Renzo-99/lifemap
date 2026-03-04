'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import dagre from 'dagre';
import { PersonNode } from '@/components/nodes/PersonNode';
import { OrganizationNode } from '@/components/nodes/OrganizationNode';
import { ActivityNode } from '@/components/nodes/ActivityNode';
import { GoalNode } from '@/components/nodes/GoalNode';
import { RelationshipEdge } from '@/components/edges/RelationshipEdge';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  person: PersonNode,
  organization: OrganizationNode,
  activity: ActivityNode,
  goal: GoalNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

interface MindMapViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
}

function getLayoutedElements(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  direction: 'LR' | 'TB' | 'RL' = 'LR',
  collapsedIds: Set<string>
) {
  // BFS로 중심 노드에서 도달 가능한 노드만 (접힌 노드의 자식 제외)
  const adjacency = new Map<string, Set<string>>();
  for (const e of edges) {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
    adjacency.get(e.source)!.add(e.target);
    adjacency.get(e.target)!.add(e.source);
  }

  // 접힌 노드 아래의 노드 숨기기
  const visibleIds = new Set<string>();
  const queue: string[] = [];
  const nodeIds = new Set(nodes.map((n) => n.id));

  // 모든 노드에서 시작 (연결 안 된 노드도 표시)
  for (const n of nodes) {
    if (!visibleIds.has(n.id)) {
      queue.push(n.id);
      visibleIds.add(n.id);
    }
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (collapsedIds.has(current)) continue; // 접힌 노드의 자식으로 진행하지 않음
      const neighbors = adjacency.get(current) || new Set();
      for (const neighbor of neighbors) {
        if (!visibleIds.has(neighbor) && nodeIds.has(neighbor)) {
          visibleIds.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  const visibleNodes = nodes.filter((n) => visibleIds.has(n.id));
  const visibleEdges = edges.filter(
    (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
  );

  // dagre 레이아웃
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 120, marginx: 40, marginy: 40 });

  visibleNodes.forEach((node) => {
    g.setNode(node.id, { width: 160, height: 80 });
  });
  visibleEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = visibleNodes.map((node) => {
    const pos = g.node(node.id);
    // 접힌 노드에 표시 추가
    const hasChildren = (adjacency.get(node.id)?.size || 0) > 0;
    const isCollapsed = collapsedIds.has(node.id);
    return {
      ...node,
      position: { x: pos.x - 80, y: pos.y - 40 },
      data: {
        ...node.data,
        _hasChildren: hasChildren,
        _isCollapsed: isCollapsed,
      } as LifeMapNodeData,
    };
  });

  return { nodes: layoutedNodes, edges: visibleEdges };
}

// 가장 많이 연결된 노드를 중심으로 잡기
function findCenterNodeId(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[]
): string | null {
  const counts = new Map<string, number>();
  for (const n of nodes) counts.set(n.id, 0);
  for (const e of edges) {
    counts.set(e.source, (counts.get(e.source) || 0) + 1);
    counts.set(e.target, (counts.get(e.target) || 0) + 1);
  }
  let maxId: string | null = null;
  let maxCount = -1;
  for (const [id, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxId = id;
    }
  }
  return maxId;
}

export function MindMapView({ sourceNodes, sourceEdges }: MindMapViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes
      .filter((n) => n.type !== 'group')
      .map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const [direction, setDirection] = useState<'LR' | 'TB' | 'RL'>('LR');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);

  // 초기 중심 노드
  useEffect(() => {
    if (!centerNodeId) {
      setCenterNodeId(findCenterNodeId(regularNodes, sourceEdges));
    }
  }, [regularNodes, sourceEdges, centerNodeId]);

  // 중심 노드에서 방사형 정렬: 중심 -> 1차 연결 -> 2차 연결 순서로 edge 방향 정리
  const directedEdges = useMemo(() => {
    if (!centerNodeId) return sourceEdges;
    const visited = new Set<string>();
    const queue: string[] = [centerNodeId];
    visited.add(centerNodeId);
    const directed: Edge<LifeMapEdgeData>[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const edge of sourceEdges) {
        let neighbor: string | null = null;
        if (edge.source === current && !visited.has(edge.target)) {
          neighbor = edge.target;
          directed.push(edge); // 이미 올바른 방향
        } else if (edge.target === current && !visited.has(edge.source)) {
          neighbor = edge.source;
          // 방향 뒤집기 (중심에서 밖으로)
          directed.push({ ...edge, source: current, target: neighbor });
        }
        if (neighbor) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    // 방문 안 된 edge도 포함
    for (const e of sourceEdges) {
      if (!directed.find((d) => d.id === e.id)) {
        directed.push(e);
      }
    }
    return directed;
  }, [sourceEdges, centerNodeId]);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(regularNodes, directedEdges, direction, collapsedIds),
    [regularNodes, directedEdges, direction, collapsedIds]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    const result = getLayoutedElements(regularNodes, directedEdges, direction, collapsedIds);
    setNodes(result.nodes);
  }, [regularNodes, directedEdges, direction, collapsedIds, setNodes]);

  // 노드 더블클릭으로 접기/펼치기
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    },
    []
  );

  // 노드 클릭 시 중심 변경
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setCenterNodeId(node.id);
    },
    []
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
        <Controls className="!bottom-4 !left-4" showInteractive={false} />
        <MiniMap
          className="!bottom-4 !right-4"
          nodeColor={(n) => (n.data as LifeMapNodeData)?.color || '#CBD5E1'}
          pannable
          zoomable
        />

        <Panel position="top-center">
          <div className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg border border-gray-200 backdrop-blur-sm">
            <span className="text-[10px] font-medium text-gray-400">레이아웃:</span>
            {(['LR', 'TB', 'RL'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-medium transition-all',
                  direction === dir
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                {dir === 'LR' ? '좌→우' : dir === 'TB' ? '위→아래' : '우→좌'}
              </button>
            ))}
            <div className="mx-1 h-4 w-px bg-gray-200" />
            <span className="text-[10px] text-gray-400">
              클릭: 중심 변경 | 더블클릭: 접기/펼치기
            </span>
            {collapsedIds.size > 0 && (
              <button
                onClick={() => setCollapsedIds(new Set())}
                className="rounded-md px-2 py-1 text-[10px] font-medium text-orange-600 hover:bg-orange-50"
              >
                모두 펼치기
              </button>
            )}
          </div>
        </Panel>

        <Panel position="top-left">
          {centerNodeId && (
            <div className="mt-2 ml-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 border border-blue-200">
              중심: {regularNodes.find((n) => n.id === centerNodeId)?.data.label || centerNodeId}
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
