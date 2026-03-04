'use client';

import { useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
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
  direction = 'TB'
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 160, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 80,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export function MindMapView({ sourceNodes, sourceEdges }: MindMapViewProps) {
  // 그룹 노드 제외
  const regularNodes = useMemo(
    () => sourceNodes.filter((n) => n.type !== 'group').map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(regularNodes, sourceEdges),
    [regularNodes, sourceEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    const { nodes: ln } = getLayoutedElements(regularNodes, sourceEdges);
    setNodes(ln);
  }, [regularNodes, sourceEdges, setNodes]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
      </ReactFlow>
    </div>
  );
}
