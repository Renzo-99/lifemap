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
import { nanoid } from 'nanoid';
import { MindMapNode } from '@/components/nodes/MindMapNode';
import { MindMapEdge } from '@/components/edges/MindMapEdge';
import { findCenterNodeId, buildTree, getLayoutedElements, type LayoutDirection } from '@/lib/mindmap-utils';
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

interface MindMapViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
  onNodesChange: React.Dispatch<React.SetStateAction<Node<LifeMapNodeData>[]>>;
  onEdgesChange: React.Dispatch<React.SetStateAction<Edge<LifeMapEdgeData>[]>>;
}

// 내부 컴포넌트 (자체 ReactFlowProvider 스코프)
function MindMapViewInner({ sourceNodes, sourceEdges, onNodesChange: syncNodes, onEdgesChange: syncEdges }: MindMapViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes
      .filter((n) => n.type !== 'group')
      .map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const [direction, setDirection] = useState<LayoutDirection>('HORIZONTAL');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    // 중심 노드가 없거나, 현재 중심 노드가 노드 목록에서 삭제된 경우 재탐색
    const centerExists = centerNodeId && regularNodes.some((n) => n.id === centerNodeId);
    if (!centerExists) {
      setCenterNodeId(findCenterNodeId(regularNodes, sourceEdges));
    }
  }, [regularNodes, sourceEdges, centerNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<LifeMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<LifeMapEdgeData>>([]);

  // 레이아웃 변경 시 동기화
  useEffect(() => {
    if (!centerNodeId || regularNodes.length === 0) return;
    const result = getLayoutedElements(regularNodes, sourceEdges, centerNodeId, direction, collapsedIds);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, setNodes, setEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // 데이터 변경(라벨 등)은 레이아웃 없이 노드 데이터만 갱신
  useEffect(() => {
    setNodes((prev) =>
      prev.map((node) => {
        const source = regularNodes.find((n) => n.id === node.id);
        if (source && source.data.label !== node.data.label) {
          return { ...node, data: { ...node.data, label: source.data.label } };
        }
        return node;
      })
    );
  }, [regularNodes, setNodes]);

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
    // 인풋/텍스트에리어 편집 중이면 단축키 무시 (입력 팅김 방지)
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Tab') { e.preventDefault(); addChild(selectedNodeId); }
    else if (e.key === 'Enter') { e.preventDefault(); addSibling(selectedNodeId); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteNode(selectedNodeId); }
  }, [selectedNodeId, addChild, addSibling, deleteNode]);

  const onNodeClick = useCallback(
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => setSelectedNodeId(node.id),
    []
  );

  const onNodeDoubleClick = useCallback(
    (evt: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      // 인풋/텍스트에리어에서 더블클릭 시 접기 동작 무시 (편집 모드 보호)
      const tag = (evt.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SPAN') return;
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
            {(['HORIZONTAL', 'LR', 'TB', 'RL'] as LayoutDirection[]).map((dir) => (
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
                {{ HORIZONTAL: '좌←중→우', LR: '좌→우', TB: '위→아래', RL: '우→좌' }[dir]}
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
