'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { LifeMapEdgeData } from '@/types';

type RelationshipEdgeType = Edge<LifeMapEdgeData>;

function RelationshipEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationshipEdgeType>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const color = data?.color || '#6B7280';
  const thickness = data?.thickness || 1;
  const strokeDasharray =
    data?.style === 'dashed' ? '8 4' : data?.style === 'dotted' ? '2 4' : undefined;

  // 화살표 마커 결정
  const markerEnd =
    data?.direction === 'forward' || data?.direction === 'both'
      ? `url(#arrow-${color.replace('#', '')})`
      : undefined;
  const markerStart =
    data?.direction === 'backward' || data?.direction === 'both'
      ? `url(#arrow-${color.replace('#', '')})`
      : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: color,
          strokeWidth: thickness,
          strokeDasharray,
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute rounded-md bg-white px-2 py-0.5 text-xs font-medium shadow-sm border border-gray-100"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color,
              borderColor: selected ? color : undefined,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
