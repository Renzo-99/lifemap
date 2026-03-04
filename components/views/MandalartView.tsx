'use client';

import { useMemo, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';
import { NODE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MandalartViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
}

export function MandalartView({ sourceNodes, sourceEdges }: MandalartViewProps) {
  const regularNodes = useMemo(
    () => sourceNodes.filter((n) => n.type !== 'group'),
    [sourceNodes]
  );

  // 목표 노드를 중심으로 만다라트 구성
  const goalNodes = useMemo(
    () => regularNodes.filter((n) => n.data.type === 'goal'),
    [regularNodes]
  );

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(
    goalNodes[0]?.id || null
  );

  // 선택된 목표에 연결된 노드들 가져오기
  const connectedNodes = useMemo(() => {
    if (!selectedGoalId) return [];
    const connectedIds = new Set<string>();
    sourceEdges.forEach((e) => {
      if (e.source === selectedGoalId) connectedIds.add(e.target);
      if (e.target === selectedGoalId) connectedIds.add(e.source);
    });
    return regularNodes.filter((n) => connectedIds.has(n.id));
  }, [selectedGoalId, sourceEdges, regularNodes]);

  // 3x3 그리드에 배치 (중앙 = 목표, 주변 8칸 = 연결 노드)
  const centerGoal = regularNodes.find((n) => n.id === selectedGoalId);
  const gridItems = useMemo(() => {
    const items: (Node<LifeMapNodeData> | null)[] = Array(9).fill(null);
    items[4] = centerGoal || null; // 중앙
    connectedNodes.slice(0, 8).forEach((node, i) => {
      const positions = [0, 1, 2, 3, 5, 6, 7, 8];
      items[positions[i]] = node;
    });
    return items;
  }, [centerGoal, connectedNodes]);

  // 2단계: 각 주변 노드에 연결된 노드들의 3x3 그리드
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const expandedGrid = useMemo(() => {
    if (!expandedNodeId) return null;
    const connIds = new Set<string>();
    sourceEdges.forEach((e) => {
      if (e.source === expandedNodeId) connIds.add(e.target);
      if (e.target === expandedNodeId) connIds.add(e.source);
    });
    // 원래 목표 제외
    const subNodes = regularNodes.filter(
      (n) => connIds.has(n.id) && n.id !== selectedGoalId
    );
    const items: (Node<LifeMapNodeData> | null)[] = Array(9).fill(null);
    const center = regularNodes.find((n) => n.id === expandedNodeId);
    items[4] = center || null;
    subNodes.slice(0, 8).forEach((node, i) => {
      const positions = [0, 1, 2, 3, 5, 6, 7, 8];
      items[positions[i]] = node;
    });
    return items;
  }, [expandedNodeId, sourceEdges, regularNodes, selectedGoalId]);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-gray-50 p-6">
      {/* 목표 선택 */}
      {goalNodes.length > 0 && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">목표 선택:</span>
          <div className="flex gap-2">
            {goalNodes.map((goal) => (
              <button
                key={goal.id}
                onClick={() => {
                  setSelectedGoalId(goal.id);
                  setExpandedNodeId(null);
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  selectedGoalId === goal.id
                    ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                )}
              >
                {goal.data.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 만다라트 메인 그리드 */}
      <div className="flex flex-1 items-center justify-center gap-8">
        {/* 메인 3x3 */}
        <div className="grid grid-cols-3 gap-2">
          {gridItems.map((item, index) => {
            const isCenter = index === 4;
            return (
              <div
                key={index}
                onClick={() => {
                  if (item && !isCenter) setExpandedNodeId(item.id);
                }}
                className={cn(
                  'flex h-28 w-28 flex-col items-center justify-center rounded-xl border-2 p-2 text-center transition-all',
                  isCenter
                    ? 'border-orange-400 bg-orange-50 shadow-md'
                    : item
                    ? 'cursor-pointer border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                    : 'border-dashed border-gray-200 bg-gray-50/50',
                  expandedNodeId === item?.id && !isCenter && 'ring-2 ring-blue-400'
                )}
              >
                {item ? (
                  <>
                    <span className="text-lg">{item.data.icon}</span>
                    <span
                      className="mt-1 text-xs font-semibold leading-tight"
                      style={{ color: item.data.color }}
                    >
                      {item.data.label}
                    </span>
                    {item.data.tags.length > 0 && (
                      <span className="mt-0.5 text-[9px] text-gray-400">
                        {item.data.tags[0]}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] text-gray-300">빈 칸</span>
                )}
              </div>
            );
          })}
        </div>

        {/* 확장 3x3 (선택 시) */}
        {expandedGrid && (
          <div className="flex flex-col items-center">
            <span className="mb-2 text-xs font-medium text-gray-400">
              세부 연결
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {expandedGrid.map((item, index) => {
                const isCenter = index === 4;
                return (
                  <div
                    key={index}
                    className={cn(
                      'flex h-20 w-20 flex-col items-center justify-center rounded-lg border p-1 text-center',
                      isCenter
                        ? 'border-blue-400 bg-blue-50'
                        : item
                        ? 'border-gray-200 bg-white'
                        : 'border-dashed border-gray-100 bg-gray-50/30'
                    )}
                  >
                    {item ? (
                      <>
                        <span className="text-sm">{item.data.icon}</span>
                        <span
                          className="mt-0.5 text-[10px] font-medium leading-tight"
                          style={{ color: item.data.color }}
                        >
                          {item.data.label}
                        </span>
                      </>
                    ) : (
                      <span className="text-[9px] text-gray-200">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 목표가 없을 때 안내 */}
      {goalNodes.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-gray-400">
            <span className="text-4xl">🎯</span>
            <p className="mt-3 text-sm">목표 노드를 추가하면 만다라트가 생성됩니다</p>
            <p className="mt-1 text-xs">캔버스 뷰에서 목표(Goal) 노드를 추가해보세요</p>
          </div>
        </div>
      )}
    </div>
  );
}
