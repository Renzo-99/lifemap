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

// 고정 오프셋 직각 경로 + 라운드 코너
// 핵심: sourceX 기준 고정 SPINE_OFFSET을 사용하여
// 같은 부모의 모든 자식 엣지가 동일한 수직 스파인 라인을 공유
const SPINE_OFFSET = 50;
const CORNER_RADIUS = 6;

function getAlignedPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
): { path: string; labelX: number; labelY: number } {
  const isHorizontal =
    sourcePosition === Position.Right || sourcePosition === Position.Left;

  if (isHorizontal) {
    const dy = targetY - sourceY;

    // 같은 높이면 직선
    if (Math.abs(dy) < 1) {
      return {
        path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: sourceY,
      };
    }

    // sourceX 기준 고정 오프셋으로 스파인 위치 결정
    const dir = targetX > sourceX ? 1 : -1;
    let midX = sourceX + dir * SPINE_OFFSET;

    // 타겟을 넘어가지 않도록 클램프
    if (dir > 0) midX = Math.min(midX, targetX - 10);
    else midX = Math.max(midX, targetX + 10);

    const sy = dy > 0 ? 1 : -1;
    const r = Math.min(
      CORNER_RADIUS,
      Math.abs(dy) / 2,
      Math.abs(midX - sourceX),
      Math.abs(targetX - midX),
    );

    // 수평 → 라운드 코너 → 수직 스파인 → 라운드 코너 → 수평
    const path = [
      `M ${sourceX},${sourceY}`,
      `H ${midX - dir * r}`,
      `Q ${midX},${sourceY} ${midX},${sourceY + sy * r}`,
      `V ${targetY - sy * r}`,
      `Q ${midX},${targetY} ${midX + dir * r},${targetY}`,
      `H ${targetX}`,
    ].join(' ');

    return { path, labelX: midX, labelY: (sourceY + targetY) / 2 };
  } else {
    // TB 레이아웃
    const dx = targetX - sourceX;

    if (Math.abs(dx) < 1) {
      return {
        path: `M ${sourceX},${sourceY} L ${targetX},${targetY}`,
        labelX: sourceX,
        labelY: (sourceY + targetY) / 2,
      };
    }

    const dir = targetY > sourceY ? 1 : -1;
    let midY = sourceY + dir * SPINE_OFFSET;

    if (dir > 0) midY = Math.min(midY, targetY - 10);
    else midY = Math.max(midY, targetY + 10);

    const sx = dx > 0 ? 1 : -1;
    const r = Math.min(
      CORNER_RADIUS,
      Math.abs(dx) / 2,
      Math.abs(midY - sourceY),
      Math.abs(targetY - midY),
    );

    const path = [
      `M ${sourceX},${sourceY}`,
      `V ${midY - dir * r}`,
      `Q ${sourceX},${midY} ${sourceX + sx * r},${midY}`,
      `H ${targetX - sx * r}`,
      `Q ${targetX},${midY} ${targetX},${midY + dir * r}`,
      `V ${targetY}`,
    ].join(' ');

    return { path, labelX: (sourceX + targetX) / 2, labelY: midY };
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
  const { path: edgePath, labelX, labelY } = getAlignedPath(
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
