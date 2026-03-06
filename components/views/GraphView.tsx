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
} from '@xyflow/react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import { canvasNodeTypes, canvasEdgeTypes } from '@/lib/flow-types';
import type { LifeMapNodeData, LifeMapEdgeData, RelationshipType, NodeType } from '@/types';
import { RELATIONSHIP_TYPE_LABELS, NODE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  fx?: number | null;
  fy?: number | null;
}

const ALL_REL_TYPES: RelationshipType[] = [
  'family', 'friend', 'mentor', 'colleague', 'member',
  'collaborator', 'supports', 'influences', 'custom',
];

const ALL_NODE_TYPES: NodeType[] = ['person', 'organization', 'activity', 'goal'];

export function GraphView({ sourceNodes, sourceEdges }: GraphViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes
      .filter((n) => n.type !== 'group')
      .map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const [activeRelTypes, setActiveRelTypes] = useState<Set<RelationshipType>>(new Set(ALL_REL_TYPES));
  const [activeNodeTypes, setActiveNodeTypes] = useState<Set<NodeType>>(new Set(ALL_NODE_TYPES));
  const [strength, setStrength] = useState(-300);
  const [fixedNodes, setFixedNodes] = useState<Set<string>>(new Set());

  const filteredEdges = useMemo(
    () => sourceEdges.filter((e) => {
      const relType = e.data?.relationshipType;
      return relType ? activeRelTypes.has(relType) : true;
    }),
    [sourceEdges, activeRelTypes]
  );

  const filteredNodes = useMemo(
    () => regularNodes.filter((n) => activeNodeTypes.has(n.data.type as NodeType)),
    [regularNodes, activeNodeTypes]
  );

  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredEdges.forEach((e) => {
      counts.set(e.source, (counts.get(e.source) || 0) + 1);
      counts.set(e.target, (counts.get(e.target) || 0) + 1);
    });
    return counts;
  }, [filteredEdges]);

  const layoutedNodes = useMemo(() => {
    const simNodes: SimNode[] = filteredNodes.map((n) => ({
      id: n.id,
      x: n.position.x || Math.random() * 800,
      y: n.position.y || Math.random() * 600,
      fx: fixedNodes.has(n.id) ? n.position.x : null,
      fy: fixedNodes.has(n.id) ? n.position.y : null,
    }));

    const nodeIdSet = new Set(filteredNodes.map((n) => n.id));
    const simLinks: SimulationLinkDatum<SimNode>[] = filteredEdges
      .filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
      .map((e) => ({ source: e.source, target: e.target }));

    const simulation = forceSimulation(simNodes)
      .force('link', forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).id((d) => d.id).distance(150))
      .force('charge', forceManyBody().strength(strength))
      .force('center', forceCenter(400, 300))
      .force('collide', forceCollide(60))
      .force('x', forceX(400).strength(0.05))
      .force('y', forceY(300).strength(0.05))
      .stop();

    for (let i = 0; i < 300; i++) simulation.tick();

    return filteredNodes.map((node, i) => ({
      ...node,
      position: {
        x: simNodes[i].x ?? node.position.x,
        y: simNodes[i].y ?? node.position.y,
      },
      style: {
        ...node.style,
        opacity: filteredEdges.some((e) => e.source === node.id || e.target === node.id) ? 1 : 0.5,
      },
    }));
  }, [filteredNodes, filteredEdges, strength, fixedNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(filteredEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  const onNodeDragStop = useCallback(
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setFixedNodes((prev) => new Set([...prev, node.id]));
    },
    []
  );

  const onNodeDoubleClick = useCallback(
    (_evt: React.MouseEvent, node: Node<LifeMapNodeData>) => {
      setFixedNodes((prev) => {
        const next = new Set(prev);
        next.delete(node.id);
        return next;
      });
    },
    []
  );

  const toggleRelType = (type: RelationshipType) => {
    setActiveRelTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleNodeType = (type: NodeType) => {
    setActiveNodeTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const stats = useMemo(() => {
    const vals = Array.from(connectionCounts.values());
    const avgConn = vals.length > 0
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : '0';
    return { avgConn, totalNodes: filteredNodes.length, totalEdges: filteredEdges.length };
  }, [connectionCounts, filteredNodes, filteredEdges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
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
          <div className="flex flex-col gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg border border-gray-200 backdrop-blur-sm">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-medium text-gray-400 mr-1">관계:</span>
              {ALL_REL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleRelType(type)}
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all',
                    activeRelTypes.has(type)
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-400 line-through'
                  )}
                >
                  {RELATIONSHIP_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] font-medium text-gray-400 mr-1">노드:</span>
              {ALL_NODE_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleNodeType(type)}
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all',
                    activeNodeTypes.has(type) ? '' : 'opacity-30 line-through'
                  )}
                  style={activeNodeTypes.has(type) ? {
                    backgroundColor: NODE_COLORS[type] + '20',
                    color: NODE_COLORS[type],
                  } : undefined}
                >
                  {{ person: '사람', organization: '조직', activity: '활동', goal: '목표' }[type]}
                </button>
              ))}
              <div className="mx-1 h-4 w-px bg-gray-200" />
              <span className="text-[10px] text-gray-400">인력</span>
              <input
                type="range"
                min={-800}
                max={-50}
                step={50}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="h-1 w-16 accent-gray-600"
              />
            </div>
          </div>
        </Panel>

        <Panel position="bottom-center">
          <div className="flex items-center gap-3 rounded-lg bg-white/90 px-3 py-1.5 text-[10px] text-gray-400 shadow border border-gray-100">
            <span>노드 {stats.totalNodes} | 연결 {stats.totalEdges} | 평균 {stats.avgConn}개</span>
            <div className="h-3 w-px bg-gray-200" />
            <span>드래그: 위치 고정 | 더블클릭: 고정 해제</span>
            {fixedNodes.size > 0 && (
              <button
                onClick={() => setFixedNodes(new Set())}
                className="font-medium text-blue-500 hover:text-blue-700"
              >
                모두 해제 ({fixedNodes.size})
              </button>
            )}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
