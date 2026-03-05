'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
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
import { nanoid } from 'nanoid';
import { MindMapNode } from '@/components/nodes/MindMapNode';
import { MindMapEdge } from '@/components/edges/MindMapEdge';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';
import { cn } from '@/lib/utils';

const nodeTypes: NodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes: EdgeTypes = {
  relationship: MindMapEdge,
  'mindmap-edge': MindMapEdge,
  default: MindMapEdge,
};

const BRANCH_COLORS = [
  '#3182F6', '#8B5CF6', '#10B981', '#F97316', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F59E0B', '#6366F1',
];

interface MindMapViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
  onNodesChange: React.Dispatch<React.SetStateAction<Node<LifeMapNodeData>[]>>;
  onEdgesChange: React.Dispatch<React.SetStateAction<Edge<LifeMapEdgeData>[]>>;
}

function findCenterNodeId(
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

function buildTree(
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

function getLayoutedElements(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  centerId: string,
  direction: 'LR' | 'TB' | 'RL',
  collapsedIds: Set<string>
) {
  const { depthMap, parentMap, childrenMap, directedEdges } = buildTree(nodes, edges, centerId);

  const hiddenIds = new Set<string>();
  function hideChildren(nodeId: string) {
    const children = childrenMap.get(nodeId) || [];
    for (const child of children) {
      hiddenIds.add(child);
      hideChildren(child);
    }
  }
  for (const cid of collapsedIds) hideChildren(cid);

  const visibleNodes = nodes.filter((n) => !hiddenIds.has(n.id));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = directedEdges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 30, ranksep: 160, marginx: 40, marginy: 40 });

  visibleNodes.forEach((node) => {
    const depth = depthMap.get(node.id) || 0;
    const labelLen = node.data.label?.length || 4;
    const baseW = depth === 0 ? 160 : depth === 1 ? 140 : 120;
    const w = Math.max(baseW, labelLen * 14 + 60);
    const h = depth === 0 ? 50 : depth === 1 ? 44 : 36;
    g.setNode(node.id, { width: w, height: h });
  });
  visibleEdges.forEach((edge) => g.setEdge(edge.source, edge.target));
  dagre.layout(g);

  const branchColorMap = new Map<string, string>();
  const centerChildren = childrenMap.get(centerId) || [];
  centerChildren.forEach((childId, i) => {
    branchColorMap.set(childId, BRANCH_COLORS[i % BRANCH_COLORS.length]);
  });

  function getBranchColor(nodeId: string): string {
    if (nodeId === centerId) return BRANCH_COLORS[0];
    if (branchColorMap.has(nodeId)) return branchColorMap.get(nodeId)!;
    const parent = parentMap.get(nodeId);
    if (parent) {
      const color = getBranchColor(parent);
      branchColorMap.set(nodeId, color);
      return color;
    }
    return '#6B7280';
  }

  // 방향에 따라 핸들 위치
  const sourceHandlePos = direction === 'LR' ? 'right' : direction === 'RL' ? 'left' : 'bottom';
  const targetHandlePos = direction === 'LR' ? 'left' : direction === 'RL' ? 'right' : 'top';

  const layoutedNodes: Node<LifeMapNodeData>[] = visibleNodes.map((node) => {
    const pos = g.node(node.id);
    const depth = depthMap.get(node.id) || 0;
    const isCenter = node.id === centerId;
    const isCollapsed = collapsedIds.has(node.id);
    const childCount = childrenMap.get(node.id)?.length || 0;
    const color = getBranchColor(node.id);

    return {
      ...node,
      type: 'mindmap',
      position: { x: pos.x - (pos.width || 160) / 2, y: pos.y - (pos.height || 50) / 2 },
      data: {
        ...node.data,
        color,
        _isCenter: isCenter,
        _isCollapsed: isCollapsed,
        _childCount: childCount,
        _depth: depth,
        _direction: direction,
      } as LifeMapNodeData,
    };
  });

  const layoutedEdges: Edge<LifeMapEdgeData>[] = visibleEdges.map((edge) => {
    const edgeColor = getBranchColor(edge.target);
    return {
      ...edge,
      type: 'relationship',
      sourceHandle: sourceHandlePos,
      targetHandle: targetHandlePos,
      data: { ...edge.data, color: edgeColor } as LifeMapEdgeData,
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

// 내부 컴포넌트 (자체 ReactFlowProvider 스코프)
function MindMapViewInner({ sourceNodes, sourceEdges, onNodesChange: syncNodes, onEdgesChange: syncEdges }: MindMapViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes
      .filter((n) => n.type !== 'group')
      .map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const [direction, setDirection] = useState<'LR' | 'TB' | 'RL'>('LR');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!centerNodeId) {
      setCenterNodeId(findCenterNodeId(regularNodes, sourceEdges));
    }
  }, [regularNodes, sourceEdges, centerNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<LifeMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<LifeMapEdgeData>>([]);

  // 레이아웃 변경 시 동기화
  useEffect(() => {
    if (!centerNodeId) return;
    const result = getLayoutedElements(regularNodes, sourceEdges, centerNodeId, direction, collapsedIds);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, setNodes, setEdges]);

  const addChild = useCallback((parentId: string) => {
    const id = nanoid();
    const now = new Date().toISOString();
    const newNode: Node<LifeMapNodeData> = {
      id,
      type: 'person',
      position: { x: 0, y: 0 },
      data: {
        id, type: 'person', label: '새 항목',
        color: '#3182F6', icon: '📌', shape: 'rounded-rect',
        memo: '', tags: [], createdAt: now, updatedAt: now,
      } as LifeMapNodeData,
    };
    const newEdge: Edge<LifeMapEdgeData> = {
      id: nanoid(),
      source: parentId,
      target: id,
      type: 'relationship',
      data: {
        label: '',
        relationshipType: 'custom',
        color: '#6B7280',
        thickness: 1,
        style: 'solid',
        direction: 'none',
        createdAt: now,
        updatedAt: now,
      },
    };

    syncNodes((prev) => [...prev, newNode]);
    syncEdges((prev) => [...prev, newEdge]);
    setSelectedNodeId(id);

    setCollapsedIds((prev) => {
      if (prev.has(parentId)) {
        const next = new Set(prev);
        next.delete(parentId);
        return next;
      }
      return prev;
    });
  }, [syncNodes, syncEdges]);

  const addSibling = useCallback((nodeId: string) => {
    if (!centerNodeId) return;
    const { parentMap } = buildTree(regularNodes, sourceEdges, centerNodeId);
    const parentId = parentMap.get(nodeId);
    if (!parentId) return;
    addChild(parentId);
  }, [regularNodes, sourceEdges, centerNodeId, addChild]);

  const deleteNode = useCallback((nodeId: string) => {
    if (!centerNodeId || nodeId === centerNodeId) return;
    const { childrenMap } = buildTree(regularNodes, sourceEdges, centerNodeId);

    const toDelete = new Set<string>();
    function collect(nid: string) {
      toDelete.add(nid);
      const children = childrenMap.get(nid) || [];
      for (const child of children) collect(child);
    }
    collect(nodeId);

    syncNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
    syncEdges((prev) => prev.filter((e) => !toDelete.has(e.source) && !toDelete.has(e.target)));
    setSelectedNodeId(null);
  }, [regularNodes, sourceEdges, centerNodeId, syncNodes, syncEdges]);

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedNodeId) return;
    if (e.key === 'Tab') { e.preventDefault(); addChild(selectedNodeId); }
    else if (e.key === 'Enter') { e.preventDefault(); addSibling(selectedNodeId); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteNode(selectedNodeId); }
  }, [selectedNodeId, addChild, addSibling, deleteNode]);

  const onNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => setSelectedNodeId(node.id),
    []
  );

  const onNodeDoubleClick = useCallback(
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setCollapsedIds((prev) => {
        const next = new Set(prev);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    },
    []
  );

  const autoLayout = useCallback(() => {
    if (!centerNodeId) return;
    const result = getLayoutedElements(regularNodes, sourceEdges, centerNodeId, direction, collapsedIds);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, setNodes, setEdges]);

  return (
    <div className="h-full w-full" onKeyDown={onKeyDown} tabIndex={0}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'relationship' }}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        deleteKeyCode={null}
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

            <button
              onClick={autoLayout}
              className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200 transition-all"
            >
              자동 정렬
            </button>

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
          <div className="mt-2 ml-2 flex flex-col gap-1.5">
            {centerNodeId && (
              <div className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs text-blue-700 border border-blue-200">
                중심: {regularNodes.find((n) => n.id === centerNodeId)?.data.label || centerNodeId}
              </div>
            )}
            <div className="rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500 border border-gray-200 leading-relaxed">
              <span className="font-semibold">Tab</span> 자식 추가 · <span className="font-semibold">Enter</span> 형제 추가 · <span className="font-semibold">Delete</span> 삭제
              <br />
              <span className="font-semibold">클릭</span> 선택 · <span className="font-semibold">더블클릭</span> 접기/펼치기 · <span className="font-semibold">드래그</span> 이동
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

// 자체 ReactFlowProvider로 래핑 (LifeMapCanvas의 Provider와 격리)
export function MindMapView(props: MindMapViewProps) {
  return (
    <ReactFlowProvider>
      <MindMapViewInner {...props} />
    </ReactFlowProvider>
  );
}
