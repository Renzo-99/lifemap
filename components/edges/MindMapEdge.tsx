'use client';

import { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
  Position,
} from '@xyflow/react';
import type { LifeMapEdgeData } from '@/types';

type MindMapEdgeType = Edge<LifeMapEdgeData>;

// 직각 트리 커넥터 경로 계산
// 패턴: 부모 →── 수평선 ──┬── 수평선 → 자식1
//                         ├── 수평선 → 자식2
//                         └── 수평선 → 자식3
function getOrthogonalPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
): { path: string; labelX: number; labelY: number } {
  const isHorizontal =
    sourcePosition === Position.Right || sourcePosition === Position.Left;

  if (isHorizontal) {
    // LR 또는 RL: 수평 → 수직 스파인 → 수평
    const midX = sourceX + (targetX - sourceX) / 2;
    const path = `M ${sourceX},${sourceY} H ${midX} V ${targetY} H ${targetX}`;
    return { path, labelX: (sourceX + midX) / 2, labelY: sourceY };
  } else {
    // TB: 수직 → 수평 스파인 → 수직
    const midY = sourceY + (targetY - sourceY) / 2;
    const path = `M ${sourceX},${sourceY} V ${midY} H ${targetX} V ${targetY}`;
    return { path, labelX: sourceX, labelY: (sourceY + midY) / 2 };
  }
}

function MindMapEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<MindMapEdgeType>) {
  const { path: edgePath, labelX, labelY } = getOrthogonalPath(
    sourceX, sourceY, targetX, targetY, sourcePosition,
  );

  const color = data?.color || '#94A3B8';
  const strokeDasharray =
    data?.style === 'dashed' ? '8 4' : data?.style === 'dotted' ? '2 4' : undefined;

  return (
    <>
      {/* 투명한 넓은 히트 영역 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="cursor-pointer"
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3182F6' : color,
          strokeWidth: selected ? 2 : 1.5,
          strokeDasharray,
        }}
      />

      <EdgeLabelRenderer>
        {data?.label && (
          <div
            className="nodrag nopan pointer-events-none absolute rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: selected ? '#3182F6' : '#94A3B8',
              backgroundColor: 'white',
            }}
          >
            {data.label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const MindMapEdge = memo(MindMapEdgeComponent);
