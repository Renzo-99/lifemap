'use client';

import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';
import type { LifeMapEdgeData, EdgeThickness, EdgeStyle, EdgeDirection } from '@/types';
import { RELATIONSHIP_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type RelationshipEdgeType = Edge<LifeMapEdgeData>;

const THICKNESS_OPTIONS: { value: EdgeThickness; label: string }[] = [
  { value: 1, label: '얇게' },
  { value: 2, label: '보통' },
  { value: 3, label: '굵게' },
  { value: 4, label: '매우 굵게' },
];

const STYLE_OPTIONS: { value: EdgeStyle; label: string; preview: string }[] = [
  { value: 'solid', label: '실선', preview: '───' },
  { value: 'dashed', label: '점선', preview: '- - -' },
  { value: 'dotted', label: '파선', preview: '· · ·' },
];

const DIRECTION_OPTIONS: { value: EdgeDirection; label: string }[] = [
  { value: 'none', label: '방향 없음' },
  { value: 'forward', label: '→ 정방향' },
  { value: 'backward', label: '← 역방향' },
  { value: 'both', label: '↔ 양방향' },
];

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
  const [showPanel, setShowPanel] = useState(false);
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
    borderRadius: 12,
  });

  const color = data?.color || '#6B7280';
  const thickness = data?.thickness || 1;
  const strokeDasharray =
    data?.style === 'dashed' ? '8 4' : data?.style === 'dotted' ? '2 4' : undefined;

  const markerEnd =
    data?.direction === 'forward' || data?.direction === 'both'
      ? `url(#arrow-${color.replace('#', '')})`
      : undefined;
  const markerStart =
    data?.direction === 'backward' || data?.direction === 'both'
      ? `url(#arrow-${color.replace('#', '')})`
      : undefined;

  const handleDelete = () => {
    setEdges((eds) => eds.filter((e) => e.id !== id));
  };

  const handleUpdate = (updates: Partial<LifeMapEdgeData>) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, ...updates, updatedAt: new Date().toISOString() } as LifeMapEdgeData }
          : e
      )
    );
  };

  return (
    <>
      {/* 투명한 넓은 히트 영역 */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setShowPanel((p) => !p);
        }}
      />
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#3182F6' : color,
          strokeWidth: thickness,
          strokeDasharray,
          cursor: 'pointer',
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />

      <EdgeLabelRenderer>
        {/* 라벨 */}
        {data?.label && (
          <div
            className="nodrag nopan pointer-events-auto absolute rounded-md bg-white px-2 py-0.5 text-xs font-medium shadow-sm border border-gray-100 cursor-pointer"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              color: selected ? '#3182F6' : color,
              borderColor: selected ? '#3182F6' : undefined,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowPanel((p) => !p);
            }}
          >
            {data.label}
          </div>
        )}

        {/* 편집 패널 */}
        {(selected || showPanel) && (
          <div
            className="nodrag nopan pointer-events-auto absolute z-50 w-56 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
            style={{
              transform: `translate(-50%, 12px) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 관계 타입 */}
            <div className="mb-2 flex items-center justify-between">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: color + '15', color }}
              >
                {data?.relationshipType ? RELATIONSHIP_TYPE_LABELS[data.relationshipType] || data.relationshipType : '관계'}
              </span>
              <button
                onClick={handleDelete}
                className="rounded-md px-2 py-0.5 text-[10px] font-medium text-red-500 hover:bg-red-50"
              >
                연결 끊기
              </button>
            </div>

            {/* 라벨 수정 */}
            <input
              className="mb-2 w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-blue-300"
              value={data?.label || ''}
              onChange={(e) => handleUpdate({ label: e.target.value })}
              placeholder="라벨"
            />

            {/* 굵기 */}
            <div className="mb-2">
              <span className="mb-1 block text-[10px] font-medium text-gray-400">굵기</span>
              <div className="flex gap-1">
                {THICKNESS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdate({ thickness: opt.value })}
                    className={cn(
                      'flex-1 rounded-md py-1 text-[10px] font-medium transition-all',
                      data?.thickness === opt.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 스타일 */}
            <div className="mb-2">
              <span className="mb-1 block text-[10px] font-medium text-gray-400">종류</span>
              <div className="flex gap-1">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdate({ style: opt.value })}
                    className={cn(
                      'flex-1 rounded-md py-1 text-[10px] font-medium font-mono transition-all',
                      data?.style === opt.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {opt.preview}
                  </button>
                ))}
              </div>
            </div>

            {/* 방향 */}
            <div>
              <span className="mb-1 block text-[10px] font-medium text-gray-400">방향</span>
              <div className="grid grid-cols-2 gap-1">
                {DIRECTION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleUpdate({ direction: opt.value })}
                    className={cn(
                      'rounded-md py-1 text-[10px] font-medium transition-all',
                      data?.direction === opt.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationshipEdge = memo(RelationshipEdgeComponent);
