import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';

export function autoLayoutNodes(
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
