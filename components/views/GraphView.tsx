'use client';

import { useEffect, useMemo, useRef, useCallback } from 'react';
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
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
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

interface GraphViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
}

interface SimNode extends SimulationNodeDatum {
  id: string;
}

function getForceLayout(
  nodes: Node<LifeMapNodeData>[],
  edges: Edge<LifeMapEdgeData>[]
): Node<LifeMapNodeData>[] {
  const simNodes: SimNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
  }));

  const simLinks: SimulationLinkDatum<SimNode>[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const simulation = forceSimulation(simNodes)
    .force('link', forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).id((d) => d.id).distance(180))
    .force('charge', forceManyBody().strength(-400))
    .force('center', forceCenter(400, 300))
    .force('collide', forceCollide(80))
    .stop();

  // Run simulation synchronously
  for (let i = 0; i < 300; i++) {
    simulation.tick();
  }

  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: simNodes[i].x ?? node.position.x,
      y: simNodes[i].y ?? node.position.y,
    },
  }));
}

export function GraphView({ sourceNodes, sourceEdges }: GraphViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes.filter((n) => n.type !== 'group').map((n) => ({ ...n, parentId: undefined, extent: undefined })),
    [sourceNodes]
  );

  const layoutedNodes = useMemo(
    () => getForceLayout(regularNodes, sourceEdges),
    [regularNodes, sourceEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, , onEdgesChange] = useEdgesState(sourceEdges);

  useEffect(() => {
    const ln = getForceLayout(regularNodes, sourceEdges);
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
