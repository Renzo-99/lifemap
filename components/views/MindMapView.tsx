'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  useReactFlow,
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
import { MindMapDetailPanel } from '@/components/panels/MindMapDetailPanel';

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
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  // 중심 노드 자식별 좌/우 오버라이드 (드래그로 변경)
  const [sideOverrides, setSideOverrides] = useState<Map<string, 'left' | 'right'>>(new Map());

  // 레이아웃 재계산을 트리거하는 구조적 변경 추적용
  // (노드 추가/삭제/구조 변경만 레이아웃 재실행, 데이터 수정은 제외)
  const structureKey = useMemo(() => {
    const nodeIds = regularNodes.map((n) => n.id).sort().join(',');
    const edgeIds = sourceEdges.map((e) => `${e.source}-${e.target}`).sort().join(',');
    return `${nodeIds}|${edgeIds}`;
  }, [regularNodes, sourceEdges]);

  useEffect(() => {
    // 중심 노드가 없거나, 현재 중심 노드가 노드 목록에서 삭제된 경우 재탐색
    const centerExists = centerNodeId && regularNodes.some((n) => n.id === centerNodeId);
    if (!centerExists) {
      setCenterNodeId(findCenterNodeId(regularNodes, sourceEdges));
    }
  }, [regularNodes, sourceEdges, centerNodeId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<LifeMapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<LifeMapEdgeData>>([]);

  // 중심 노드 자식들의 좌/우 배치 자동 초기화 및 유지
  // 새 자식이 추가되면 기존 배치를 유지하면서 새 자식만 균형 맞춰 배치
  useEffect(() => {
    if (!centerNodeId || regularNodes.length === 0) return;
    const { childrenMap } = buildTree(regularNodes, sourceEdges, centerNodeId);
    const centerChildren = childrenMap.get(centerNodeId) || [];
    if (centerChildren.length === 0) return;

    setSideOverrides((prev) => {
      const newChildren = centerChildren.filter((id) => !prev.has(id));
      if (newChildren.length === 0 && prev.size >= centerChildren.length) return prev;

      const next = new Map(prev);
      // 삭제된 노드 제거
      const childSet = new Set(centerChildren);
      for (const key of next.keys()) {
        if (!childSet.has(key)) next.delete(key);
      }

      if (next.size === 0) {
        // 최초 배치: 인덱스 기반 반분할
        const half = Math.ceil(centerChildren.length / 2);
        centerChildren.forEach((id, i) => {
          next.set(id, i < half ? 'right' : 'left');
        });
      } else {
        // 새 자식만 추가: 적은 쪽에 배치
        for (const id of newChildren) {
          const rightCount = [...next.values()].filter((v) => v === 'right').length;
          const leftCount = [...next.values()].filter((v) => v === 'left').length;
          next.set(id, rightCount <= leftCount ? 'right' : 'left');
        }
      }
      return next;
    });
  }, [structureKey, centerNodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 레이아웃 재계산: 구조 변경(노드 추가/삭제), 방향 변경, 접기 상태 변경 시만 실행
  useEffect(() => {
    if (!centerNodeId || regularNodes.length === 0) return;
    const result = getLayoutedElements(regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, sideOverrides);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [structureKey, centerNodeId, direction, collapsedIds, sideOverrides, setNodes, setEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  // 원본 → 내부 데이터 동기화 (레이아웃 변경 없이 데이터만 갱신)
  // label, importance, status, memo, tags 등 모든 데이터 필드를 동기화
  useEffect(() => {
    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        const source = regularNodes.find((n) => n.id === node.id);
        if (!source) return node;
        const s = source.data;
        const d = node.data;
        if (
          s.label !== d.label ||
          s.importance !== d.importance ||
          s.status !== d.status ||
          s.memo !== d.memo ||
          s.tags !== d.tags
        ) {
          changed = true;
          return {
            ...node,
            data: {
              ...node.data,
              label: s.label,
              importance: s.importance,
              status: s.status,
              memo: s.memo,
              tags: s.tags,
            },
          };
        }
        return node;
      });
      return changed ? next : prev;
    });
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
    setDetailPanelOpen(false);
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
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setSelectedNodeId(node.id);
      setDetailPanelOpen(true);
    },
    []
  );

  const closeDetailPanel = useCallback(() => setDetailPanelOpen(false), []);

  // 빈 캔버스 클릭 시 패널 닫기
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setDetailPanelOpen(false);
  }, []);

  const { updateNodeData } = useReactFlow();

  // 노드 데이터 업데이트: ReactFlow 내부 스토어 직접 갱신 + 원본 동기화
  const handleUpdateNode = useCallback((nodeId: string, updates: Partial<LifeMapNodeData>) => {
    const now = new Date().toISOString();
    const merged = { ...updates, updatedAt: now };

    // 1. ReactFlow 내부 스토어 직접 업데이트 (확실한 리렌더)
    updateNodeData(nodeId, merged);

    // 2. 원본(캔버스) 노드 업데이트 (자동저장 대상)
    syncNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...merged } } : n
      )
    );
  }, [updateNodeData, syncNodes]);

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

  // 드래그 종료 시: 중심 노드 x좌표 기준으로 브랜치 좌/우 재할당
  const onNodeDragStop = useCallback(
    (_evt: React.MouseEvent, draggedNode: Node<LifeMapNodeData>) => {
      if (!centerNodeId || direction !== 'HORIZONTAL') return;

      // 중심 노드의 현재 위치
      const centerNode = nodes.find((n) => n.id === centerNodeId);
      if (!centerNode) return;
      const centerX = centerNode.position.x;

      // 드래그된 노드의 브랜치 루트(중심의 직계 자식) 찾기
      const { parentMap } = buildTree(regularNodes, sourceEdges, centerNodeId);
      let branchRoot = draggedNode.id;
      let parent = parentMap.get(branchRoot);
      while (parent && parent !== centerNodeId) {
        branchRoot = parent;
        parent = parentMap.get(branchRoot);
      }
      // 브랜치 루트의 부모가 중심이 아니면 무시 (중심 노드 자체를 드래그한 경우 등)
      if (parent !== centerNodeId) return;

      // 드래그된 노드의 x위치로 side 결정
      const newSide: 'left' | 'right' = draggedNode.position.x < centerX ? 'left' : 'right';
      const currentSide = sideOverrides.get(branchRoot);

      // 기존 side와 다르면 업데이트 → 레이아웃 재실행
      if (currentSide !== newSide) {
        setSideOverrides((prev) => {
          const next = new Map(prev);
          next.set(branchRoot, newSide);
          return next;
        });
      }
    },
    [centerNodeId, direction, nodes, regularNodes, sourceEdges, sideOverrides]
  );

  const autoLayout = useCallback(() => {
    if (!centerNodeId) return;
    const result = getLayoutedElements(regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, sideOverrides);
    setNodes(result.nodes);
    setEdges(result.edges);
  }, [regularNodes, sourceEdges, centerNodeId, direction, collapsedIds, sideOverrides, setNodes, setEdges]);

  return (
    <div className="flex h-full w-full">
      <div className="relative h-full flex-1" onKeyDown={onKeyDown} tabIndex={0}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
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

      {detailPanelOpen && selectedNodeId && (
        <MindMapDetailPanel
          selectedNodeId={selectedNodeId}
          nodes={nodes}
          edges={edges}
          onClose={closeDetailPanel}
          onUpdateNode={handleUpdateNode}
        />
      )}
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
