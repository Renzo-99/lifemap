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

  type OnSelectionChangeParams,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { canvasNodeTypes, canvasEdgeTypes } from '@/lib/flow-types';
import { TopBar } from '@/components/toolbar/TopBar';
import { LeftSidebar } from '@/components/panels/LeftSidebar';
import { RightPanel } from '@/components/panels/RightPanel';
import { ConnectionToolbar } from '@/components/toolbar/ConnectionToolbar';
import { MindMapView } from '@/components/views/MindMapView';
import { MandalartView } from '@/components/views/MandalartView';
import { GraphView } from '@/components/views/GraphView';
import { useViewStore } from '@/stores/useViewStore';
import { RELATIONSHIP_STYLES } from '@/lib/constants';
import { autoLayoutNodes } from '@/lib/layout-utils';
import { createInitialNodes, createInitialEdges, loadSavedData } from '@/lib/initial-data';
import { useAutoSave } from '@/hooks/useAutoSave';
import { SaveIndicator } from '@/components/ui/save-status-toast';
import type { NodeType, LifeMapNodeData, LifeMapEdgeData, RelationshipType } from '@/types';

import { nanoid } from 'nanoid';
import { exportToFile, importFromFile, createBackup, getBackups, restoreBackup, deleteBackup } from '@/lib/file-save';


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

  // 파일 저장/불러오기/백업
  const [backups, setBackups] = useState(() => getBackups().map(({ data: _, ...rest }) => rest));

  const handleExport = useCallback(() => exportToFile(nodes, edges), [nodes, edges]);

  const handleImport = useCallback(async () => {
    try {
      const data = await importFromFile();
      setNodes(data.nodes);
      setEdges(data.edges);
    } catch (e) {
      alert(e instanceof Error ? e.message : '불러오기 실패');
    }
  }, [setNodes, setEdges]);

  const handleBackup = useCallback(() => {
    createBackup(nodes, edges);
    setBackups(getBackups().map(({ data: _, ...rest }) => rest));
  }, [nodes, edges]);

  const handleRestoreBackup = useCallback((id: string) => {
    const data = restoreBackup(id);
    if (data) {
      setNodes(data.nodes);
      setEdges(data.edges);
    }
  }, [setNodes, setEdges]);

  const handleDeleteBackup = useCallback((id: string) => {
    deleteBackup(id);
    setBackups(getBackups().map(({ data: _, ...rest }) => rest));
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50">
      <TopBar
        onExport={handleExport}
        onImport={handleImport}
        onBackup={handleBackup}
        onRestoreBackup={handleRestoreBackup}
        onDeleteBackup={handleDeleteBackup}
        backups={backups}
      />

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
                nodeTypes={canvasNodeTypes}
                edgeTypes={canvasEdgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={3}
                defaultEdgeOptions={{ type: 'relationship' }}
                deleteKeyCode="Delete"
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Shift"
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E5E8EB" />
                <Controls className="!bottom-10 !left-4" showInteractive={false} />
                <MiniMap
                  className="!bottom-10 !right-4"
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
                      className="rounded-xl border border-[#E5E8EB] bg-white/95 px-3 py-1.5 text-[13px] font-medium text-[#4E5968] shadow-[0_2px_12px_rgba(0,0,0,0.06)] backdrop-blur-sm transition-all duration-150 hover:bg-[#F9FAFB] hover:text-[#191F28]"
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
