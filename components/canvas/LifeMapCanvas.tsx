'use client';

import { useCallback, useMemo, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PersonNode } from '@/components/nodes/PersonNode';
import { OrganizationNode } from '@/components/nodes/OrganizationNode';
import { ActivityNode } from '@/components/nodes/ActivityNode';
import { GoalNode } from '@/components/nodes/GoalNode';
import { RelationshipEdge } from '@/components/edges/RelationshipEdge';
import { TopBar } from '@/components/toolbar/TopBar';
import { LeftSidebar } from '@/components/panels/LeftSidebar';
import { RightPanel } from '@/components/panels/RightPanel';
import { useMapStore } from '@/stores/useMapStore';
import { useViewStore } from '@/stores/useViewStore';
import { RELATIONSHIP_STYLES } from '@/lib/constants';
import type { NodeType, LifeMapNodeData, LifeMapEdgeData, RelationshipType } from '@/types';

import { nanoid } from 'nanoid';

// React Flow에 커스텀 노드 타입 등록
const nodeTypes: NodeTypes = {
  person: PersonNode,
  organization: OrganizationNode,
  activity: ActivityNode,
  goal: GoalNode,
};

const edgeTypes: EdgeTypes = {
  relationship: RelationshipEdge,
};

// 샘플 데이터를 React Flow 노드로 변환
function createInitialNodes(): Node<LifeMapNodeData>[] {
  return [
    {
      id: 'n1',
      type: 'person',
      position: { x: 400, y: 300 },
      data: {
        id: 'n1', type: 'person', label: '나 (전서원)', color: '#3182F6',
        icon: '👤', shape: 'rounded-rect', memo: '', tags: ['core'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n2',
      type: 'person',
      position: { x: 150, y: 100 },
      data: {
        id: 'n2', type: 'person', label: '멘토 M', color: '#3182F6',
        icon: '👤', shape: 'rounded-rect', memo: '', tags: ['멘토', '삼성'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n3',
      type: 'person',
      position: { x: 650, y: 100 },
      data: {
        id: 'n3', type: 'person', label: 'Y', color: '#3182F6',
        icon: '👤', shape: 'rounded-rect', memo: '', tags: ['대학', '경영학과'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n4',
      type: 'organization',
      position: { x: 700, y: 300 },
      data: {
        id: 'n4', type: 'organization', label: '건국대학교 경영학과', color: '#8B5CF6',
        icon: '🏢', shape: 'rounded-rect', memo: '', tags: ['학업'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n5',
      type: 'organization',
      position: { x: 100, y: 500 },
      data: {
        id: 'n5', type: 'organization', label: '소망교회 새움지구', color: '#8B5CF6',
        icon: '🏢', shape: 'rounded-rect', memo: '', tags: ['신앙'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n6',
      type: 'organization',
      position: { x: 700, y: 500 },
      data: {
        id: 'n6', type: 'organization', label: '홍대 직장', color: '#8B5CF6',
        icon: '🏢', shape: 'rounded-rect', memo: '', tags: ['커리어'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n7',
      type: 'activity',
      position: { x: 50, y: 250 },
      data: {
        id: 'n7', type: 'activity', label: '투자 분석 (제1원칙)', color: '#10B981',
        icon: '📋', shape: 'rounded-rect', memo: '', tags: ['투자'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n8',
      type: 'activity',
      position: { x: 350, y: 550 },
      data: {
        id: 'n8', type: 'activity', label: '재벌 지배구조 프로젝트', color: '#10B981',
        icon: '📋', shape: 'rounded-rect', memo: '', tags: ['코딩'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n9',
      type: 'activity',
      position: { x: 550, y: 550 },
      data: {
        id: 'n9', type: 'activity', label: '비즈니스 밋업', color: '#10B981',
        icon: '📋', shape: 'rounded-rect', memo: '', tags: ['네트워킹'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
    {
      id: 'n10',
      type: 'goal',
      position: { x: 400, y: 100 },
      data: {
        id: 'n10', type: 'goal', label: '삶의 8대 영역 균형', color: '#F97316',
        icon: '🎯', shape: 'diamond', memo: '', tags: ['핵심목표'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      } as LifeMapNodeData,
    },
  ];
}

function createInitialEdges(): Edge<LifeMapEdgeData>[] {
  const s = RELATIONSHIP_STYLES;
  const now = new Date().toISOString();
  return [
    { id: 'e1', source: 'n1', target: 'n2', type: 'relationship', data: { ...s.mentor, label: '멘토', relationshipType: 'mentor' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e2', source: 'n1', target: 'n3', type: 'relationship', data: { ...s.friend, label: '대학동기', relationshipType: 'friend' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e3', source: 'n1', target: 'n4', type: 'relationship', data: { ...s.member, label: '야간 재학', relationshipType: 'member' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e4', source: 'n1', target: 'n5', type: 'relationship', data: { ...s.member, label: '교인', relationshipType: 'member' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e5', source: 'n1', target: 'n6', type: 'relationship', data: { ...s.member, label: '근무중', relationshipType: 'member' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e6', source: 'n1', target: 'n7', type: 'relationship', data: { ...s.collaborator, label: '주도', relationshipType: 'collaborator' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e7', source: 'n2', target: 'n7', type: 'relationship', data: { ...s.influences, label: '전략 조언', relationshipType: 'influences' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e8', source: 'n3', target: 'n4', type: 'relationship', data: { ...s.member, label: '동기', relationshipType: 'member' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e9', source: 'n1', target: 'n8', type: 'relationship', data: { ...s.collaborator, label: '개발중', relationshipType: 'collaborator' as RelationshipType, createdAt: now, updatedAt: now } },
    { id: 'e10', source: 'n1', target: 'n9', type: 'relationship', data: { ...s.member, label: '참여', relationshipType: 'member' as RelationshipType, createdAt: now, updatedAt: now } },
  ];
}

function LifeMapCanvasInner() {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitialNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(createInitialEdges());
  const { setSelectedNodes, clearSelection } = useViewStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // 새 연결선 생성
  const onConnect = useCallback(
    (params: Connection) => {
      const now = new Date().toISOString();
      const style = RELATIONSHIP_STYLES.custom;
      const newEdge: Edge<LifeMapEdgeData> = {
        ...params,
        id: nanoid(),
        type: 'relationship',
        data: {
          label: '관계',
          relationshipType: 'custom' as RelationshipType,
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
    [setEdges]
  );

  // 노드 선택 변경 시
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length > 0) {
        setSelectedNodes(selectedNodes.map((n) => n.id));
      } else {
        clearSelection();
      }
    },
    [setSelectedNodes, clearSelection]
  );

  // 캔버스 더블클릭 시 새 노드 생성
  const onDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      // React Flow의 screenToFlowPosition은 ReactFlowInstance에서 사용
      // 여기서는 간단히 기본 person 노드 추가
      const id = nanoid();
      const now = new Date().toISOString();
      const newNode: Node<LifeMapNodeData> = {
        id,
        type: 'person',
        position: { x: event.clientX - 200, y: event.clientY - 100 },
        data: {
          id, type: 'person', label: '새 사람', color: '#3182F6',
          icon: '👤', shape: 'rounded-rect', memo: '', tags: [],
          createdAt: now, updatedAt: now,
        } as LifeMapNodeData,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // 좌측 사이드바에서 노드 추가
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const id = nanoid();
      const now = new Date().toISOString();
      const colors: Record<NodeType, string> = {
        person: '#3182F6', organization: '#8B5CF6',
        activity: '#10B981', goal: '#F97316',
      };
      const icons: Record<NodeType, string> = {
        person: '👤', organization: '🏢',
        activity: '📋', goal: '🎯',
      };
      const labels: Record<NodeType, string> = {
        person: '새 사람', organization: '새 조직',
        activity: '새 활동', goal: '새 목표',
      };
      const newNode: Node<LifeMapNodeData> = {
        id,
        type,
        position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
        data: {
          id, type, label: labels[type], color: colors[type],
          icon: icons[type], shape: type === 'goal' ? 'diamond' : 'rounded-rect',
          memo: '', tags: [], createdAt: now, updatedAt: now,
        } as LifeMapNodeData,
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  // 노드 개수, 엣지 개수
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar onAddNode={handleAddNode} />

        {/* 메인 캔버스 */}
        <div className="relative flex-1" ref={reactFlowWrapper}>
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
            <Controls
              className="!bottom-10 !left-4 !shadow-md !border-gray-200 !rounded-lg"
              showInteractive={false}
            />
            <MiniMap
              className="!bottom-10 !right-4 !shadow-md !border-gray-200 !rounded-lg"
              nodeColor={(n) => {
                const data = n.data as LifeMapNodeData;
                return data?.color || '#CBD5E1';
              }}
              maskColor="rgba(250, 251, 252, 0.7)"
              pannable
              zoomable
            />
          </ReactFlow>
        </div>

        <RightPanel flowEdges={edges} />
      </div>

      {/* 상태 바 */}
      <footer className="flex h-7 items-center justify-between border-t border-gray-200 bg-white px-4 text-xs text-gray-400">
        <span>노드 {nodeCount}개 | 연결 {edgeCount}개</span>
        <span>LifeMap v0.1.0</span>
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
