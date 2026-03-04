'use client';

import { useCallback, useRef, useState, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeParams,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { PersonNode } from '@/components/nodes/PersonNode';
import { OrganizationNode } from '@/components/nodes/OrganizationNode';
import { ActivityNode } from '@/components/nodes/ActivityNode';
import { GoalNode } from '@/components/nodes/GoalNode';
import { GroupNode } from '@/components/nodes/GroupNode';
import { RelationshipEdge } from '@/components/edges/RelationshipEdge';
import { TopBar } from '@/components/toolbar/TopBar';
import { LeftSidebar } from '@/components/panels/LeftSidebar';
import { RightPanel } from '@/components/panels/RightPanel';
import { ConnectionToolbar } from '@/components/toolbar/ConnectionToolbar';
import { MindMapView } from '@/components/views/MindMapView';
import { MandalartView } from '@/components/views/MandalartView';
import { GraphView } from '@/components/views/GraphView';
import { useViewStore } from '@/stores/useViewStore';
import { RELATIONSHIP_STYLES } from '@/lib/constants';
import type { NodeType, LifeMapNodeData, LifeMapEdgeData, RelationshipType } from '@/types';
import { useAutoSave, SaveIndicator } from '@/components/ui/save-status-toast';

import { nanoid } from 'nanoid';

const nodeTypes: NodeTypes = {
  person: PersonNode,
  organization: OrganizationNode,
  activity: ActivityNode,
  goal: GoalNode,
  group: GroupNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

// dagre 자동 레이아웃: 노드를 겹치지 않게 자동 배치
function autoLayoutNodes(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[],
  direction: 'TB' | 'LR' = 'TB'
): Node<LifeMapNodeData>[] {
  const regularNds = nodes.filter((n) => n.type !== 'group');
  if (regularNds.length === 0) return nodes;

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120, marginx: 60, marginy: 60 });

  regularNds.forEach((node) => {
    g.setNode(node.id, { width: 180, height: 80 });
  });
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  return nodes.map((node) => {
    if (node.type === 'group') return node;
    const pos = g.node(node.id);
    if (!pos) return node;
    return { ...node, position: { x: pos.x - 90, y: pos.y - 40 } };
  });
}

function createInitialNodes(): Node<LifeMapNodeData>[] {
  const now = new Date().toISOString();
  const n = (id: string, type: NodeType, label: string, tags: string[] = [], icon?: string): Node<LifeMapNodeData> => ({
    id,
    type: type === 'goal' ? 'goal' : type,
    position: { x: 0, y: 0 }, // dagre가 자동 배치
    data: {
      id, type, label,
      color: { person: '#3182F6', organization: '#8B5CF6', activity: '#10B981', goal: '#F97316' }[type],
      icon: icon || { person: '👤', organization: '🏢', activity: '📋', goal: '🎯' }[type],
      shape: type === 'goal' ? 'diamond' : 'rounded-rect',
      memo: '', tags, createdAt: now, updatedAt: now,
    } as LifeMapNodeData,
  });

  return [
    n('n1', 'person', '나 (전서원)', ['core']),
    n('n10', 'goal', '삶의 8대 영역 균형', ['핵심목표']),
    n('n2', 'person', '멘토 M', ['멘토', '삼성']),
    n('n3', 'person', 'Y', ['대학', '경영학과']),
    n('n4', 'organization', '건국대학교 경영학과', ['학업']),
    n('n5', 'organization', '소망교회 새움지구', ['신앙']),
    n('n6', 'organization', '홍대 직장', ['커리어']),
    n('n7', 'activity', '투자 분석 (제1원칙)', ['투자']),
    n('n8', 'activity', '재벌 지배구조 프로젝트', ['코딩']),
    n('n9', 'activity', '비즈니스 밋업', ['네트워킹']),
  ];
}

function createInitialEdges(): Edge<LifeMapEdgeData>[] {
  const s = RELATIONSHIP_STYLES;
  const now = new Date().toISOString();
  const e = (id: string, src: string, tgt: string, rel: RelationshipType, label: string): Edge<LifeMapEdgeData> => ({
    id, source: src, target: tgt, type: 'relationship',
    data: { ...s[rel], label, relationshipType: rel, createdAt: now, updatedAt: now },
  });

  return [
    e('e1', 'n1', 'n2', 'mentor', '멘토'),
    e('e2', 'n1', 'n3', 'friend', '대학동기'),
    e('e3', 'n1', 'n4', 'member', '야간 재학'),
    e('e4', 'n1', 'n5', 'member', '교인'),
    e('e5', 'n1', 'n6', 'member', '근무중'),
    e('e6', 'n1', 'n7', 'collaborator', '주도'),
    e('e7', 'n2', 'n7', 'influences', '전략 조언'),
    e('e8', 'n3', 'n4', 'member', '동기'),
    e('e9', 'n1', 'n8', 'collaborator', '개발중'),
    e('e10', 'n1', 'n9', 'member', '참여'),
    e('e11', 'n10', 'n1', 'influences', '핵심가치'),
    e('e12', 'n10', 'n7', 'supports', '투자목표'),
    e('e13', 'n10', 'n8', 'supports', '프로젝트목표'),
  ];
}

const STORAGE_KEY = 'lifemap-autosave';

function loadSavedData(): { nodes: Node<LifeMapNodeData>[]; edges: Edge<LifeMapEdgeData>[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.nodes?.length > 0) return parsed;
  } catch {}
  return null;
}

function LifeMapCanvasInner() {
  const saved = useMemo(() => loadSavedData(), []);
  const fallbackEdges = useMemo(() => createInitialEdges(), []);
  const fallbackNodes = useMemo(() => autoLayoutNodes(createInitialNodes(), fallbackEdges), [fallbackEdges]);
  const [nodes, setNodes, onNodesChange] = useNodesState(saved?.nodes ?? fallbackNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(saved?.edges ?? fallbackEdges);
  const { currentView, setSelectedNodes, clearSelection } = useViewStore();
  const { screenToFlowPosition } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [activeRelationType, setActiveRelationType] = useState<RelationshipType>('custom');

  // 자동저장 (1초 디바운스 + 신호등 인디케이터)
  const { saveState } = useAutoSave({ nodes, edges });

  const onConnect = useCallback(
    (params: Connection) => {
      const now = new Date().toISOString();
      const style = RELATIONSHIP_STYLES[activeRelationType];
      const newEdge: Edge<LifeMapEdgeData> = {
        ...params,
        id: nanoid(),
        type: 'relationship',
        data: {
          label: style.label,
          relationshipType: activeRelationType,
          color: style.color,
          thickness: style.thickness,
          style: style.style,
          direction: style.direction,
          createdAt: now,
          updatedAt: now,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, activeRelationType]
  );

  const onSelectionChange = useCallback(
    ({ nodes: sel }: OnSelectionChangeParams) => {
      if (sel.length > 0) setSelectedNodes(sel.map((n) => n.id));
      else clearSelection();
    },
    [setSelectedNodes, clearSelection]
  );

  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const id = nanoid();
      const now = new Date().toISOString();
      setNodes((nds) => [...nds, {
        id, type: 'person', position,
        data: { id, type: 'person', label: '새 사람', color: '#3182F6', icon: '👤', shape: 'rounded-rect', memo: '', tags: [], createdAt: now, updatedAt: now } as LifeMapNodeData,
      }]);
    },
    [setNodes, screenToFlowPosition]
  );

  const handleAddNode = useCallback((type: NodeType) => {
    const id = nanoid();
    const now = new Date().toISOString();
    const cfg = {
      person: { color: '#3182F6', icon: '👤', label: '새 사람' },
      organization: { color: '#8B5CF6', icon: '🏢', label: '새 조직' },
      activity: { color: '#10B981', icon: '📋', label: '새 활동' },
      goal: { color: '#F97316', icon: '🎯', label: '새 목표' },
    }[type];
    setNodes((nds) => [...nds, {
      id, type,
      position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: { id, type, label: cfg.label, color: cfg.color, icon: cfg.icon, shape: type === 'goal' ? 'diamond' : 'rounded-rect', memo: '', tags: [], createdAt: now, updatedAt: now } as LifeMapNodeData,
    }]);
  }, [setNodes]);

  const handleGroupSelected = useCallback(() => {
    const { selectedNodeIds } = useViewStore.getState();
    if (selectedNodeIds.length < 2) return;
    const sel = nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (sel.length < 2) return;

    const pad = 40;
    const minX = Math.min(...sel.map((n) => n.position.x)) - pad;
    const minY = Math.min(...sel.map((n) => n.position.y)) - pad;
    const maxX = Math.max(...sel.map((n) => n.position.x + 160)) + pad;
    const maxY = Math.max(...sel.map((n) => n.position.y + 80)) + pad;
    const gid = nanoid();
    const now = new Date().toISOString();

    setNodes((nds) => {
      const updated = nds.map((n) =>
        selectedNodeIds.includes(n.id)
          ? { ...n, parentId: gid, position: { x: n.position.x - minX, y: n.position.y - minY }, extent: 'parent' as const }
          : n
      );
      return [{
        id: gid, type: 'group', position: { x: minX, y: minY },
        style: { width: maxX - minX, height: maxY - minY },
        data: { id: gid, type: 'organization' as NodeType, label: '새 그룹', color: '#94A3B8', icon: '📁', shape: 'rounded-rect', memo: '', tags: [], createdAt: now, updatedAt: now } as LifeMapNodeData,
      } as Node<LifeMapNodeData>, ...updated];
    });
  }, [nodes, setNodes]);

  const handleUngroupSelected = useCallback(() => {
    const { selectedNodeIds } = useViewStore.getState();
    const sid = selectedNodeIds[0];
    if (!sid) return;
    const group = nodes.find((n) => n.id === sid);
    if (!group || group.type !== 'group') return;
    const gpos = group.position;

    setNodes((nds) =>
      nds.filter((n) => n.id !== sid).map((n) =>
        n.parentId === sid
          ? { ...n, parentId: undefined, extent: undefined, position: { x: n.position.x + gpos.x, y: n.position.y + gpos.y } }
          : n
      )
    );
  }, [nodes, setNodes]);

  // 자동 정렬 (dagre)
  const handleAutoLayout = useCallback(() => {
    setNodes((nds) => autoLayoutNodes(nds, edges));
  }, [edges, setNodes]);

  const nodeCount = nodes.filter((n) => n.type !== 'group').length;
  const edgeCount = edges.length;
  const groupCount = nodes.filter((n) => n.type === 'group').length;

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* 캔버스 뷰일 때만 사이드바 표시 */}
        {currentView === 'canvas' && (
          <LeftSidebar
            onAddNode={handleAddNode}
            onGroupSelected={handleGroupSelected}
            onUngroupSelected={handleUngroupSelected}
          />
        )}

        {/* 뷰 전환 */}
        <div className="relative flex-1" ref={reactFlowWrapper}>
          {currentView === 'canvas' && (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                onDoubleClick={onDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={3}
                defaultEdgeOptions={{ type: 'relationship' }}
                deleteKeyCode="Delete"
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Shift"
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E7EB" />
                <Controls className="!bottom-10 !left-4 !shadow-md !border-gray-200 !rounded-lg" showInteractive={false} />
                <MiniMap
                  className="!bottom-10 !right-4 !shadow-md !border-gray-200 !rounded-lg"
                  nodeColor={(n) => (n.data as LifeMapNodeData)?.color || '#CBD5E1'}
                  maskColor="rgba(250, 251, 252, 0.7)"
                  pannable
                  zoomable
                />
                <Panel position="top-center">
                  <div className="flex items-center gap-2">
                    <ConnectionToolbar
                      activeRelationType={activeRelationType}
                      onChangeRelationType={setActiveRelationType}
                      connectMode={false}
                      onToggleConnectMode={() => {}}
                    />
                    <button
                      onClick={handleAutoLayout}
                      className="rounded-lg border border-gray-200 bg-white/95 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      자동 정렬
                    </button>
                  </div>
                </Panel>
              </ReactFlow>
            </>
          )}

          {currentView === 'mindmap' && (
            <MindMapView
              sourceNodes={nodes}
              sourceEdges={edges}
              onNodesChange={setNodes}
              onEdgesChange={setEdges}
            />
          )}

          {currentView === 'mandalart' && (
            <MandalartView sourceNodes={nodes} sourceEdges={edges} />
          )}

          {currentView === 'graph' && (
            <GraphView sourceNodes={nodes} sourceEdges={edges} />
          )}
        </div>

        {currentView === 'canvas' && (
          <RightPanel flowNodes={nodes} flowEdges={edges} />
        )}
      </div>

      <footer className="flex h-8 items-center justify-between border-t border-[#F2F4F6] bg-white px-4 text-[11px] text-[#8B95A1]">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#4E5968]">
            노드 {nodeCount}
          </span>
          <span className="text-[#D1D6DB]">·</span>
          <span className="font-medium text-[#4E5968]">
            연결 {edgeCount}
          </span>
          {groupCount > 0 && (
            <>
              <span className="text-[#D1D6DB]">·</span>
              <span className="font-medium text-[#4E5968]">
                그룹 {groupCount}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} />
          <span className="text-[#B0B8C1]">LifeMap</span>
        </div>
      </footer>
    </div>
  );
}

export default function LifeMapCanvas() {
  return (
    <ReactFlowProvider>
      <LifeMapCanvasInner />
    </ReactFlowProvider>
  );
}
