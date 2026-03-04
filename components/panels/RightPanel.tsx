'use client';

import { X, Calendar, Tag, Link2 } from 'lucide-react';
import { useViewStore } from '@/stores/useViewStore';
import { useMapStore } from '@/stores/useMapStore';
import { NODE_TYPE_LABELS, NODE_COLORS, RELATIONSHIP_TYPE_LABELS } from '@/lib/constants';
import type { NodeType, RelationshipType } from '@/types';
import { cn } from '@/lib/utils';
import type { Edge } from '@xyflow/react';
import type { LifeMapEdgeData } from '@/types';

interface RightPanelProps {
  flowEdges: Edge<LifeMapEdgeData>[];
}

export function RightPanel({ flowEdges }: RightPanelProps) {
  const { selectedNodeIds, rightPanelOpen, setRightPanelOpen } = useViewStore();
  const { nodes, updateNode } = useMapStore();

  if (!rightPanelOpen || selectedNodeIds.length === 0) return null;

  const nodeId = selectedNodeIds[0];
  const node = nodes[nodeId];
  if (!node) return null;

  // 연결된 관계 찾기
  const connectedEdges = flowEdges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <aside className="flex w-80 flex-col border-l border-gray-200 bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-semibold text-gray-800">{node.label}</span>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 기본 정보 */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">타입:</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: node.color + '15', color: node.color }}
            >
              {NODE_TYPE_LABELS[node.type as NodeType]}
            </span>
          </div>

          {/* 태그 */}
          <div className="mt-3 flex items-start gap-2">
            <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
              <button
                className="rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-xs text-gray-400 hover:border-gray-400 hover:text-gray-500"
                onClick={() => {
                  const tag = prompt('태그 입력:');
                  if (tag) {
                    updateNode(nodeId, { tags: [...node.tags, tag] });
                  }
                }}
              >
                + 추가
              </button>
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            📝 메모
          </div>
          <textarea
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 outline-none focus:border-blue-300 focus:bg-white"
            rows={6}
            placeholder="메모를 입력하세요..."
            value={node.memo}
            onChange={(e) => updateNode(nodeId, { memo: e.target.value })}
          />
        </div>

        {/* 연결된 관계 */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Link2 className="h-3.5 w-3.5" />
            연결된 관계 ({connectedEdges.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {connectedEdges.map((edge) => {
              const isSource = edge.source === nodeId;
              const otherNodeId = isSource ? edge.target : edge.source;
              const otherNode = nodes[otherNodeId];
              const direction = isSource ? '→' : '←';
              const relType = edge.data?.relationshipType as RelationshipType | undefined;

              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 rounded-md bg-gray-50 px-2.5 py-1.5 text-xs"
                >
                  <span className="text-gray-400">{direction}</span>
                  <span className="font-medium text-gray-700">
                    {otherNode?.label || '알 수 없음'}
                  </span>
                  {relType && (
                    <span
                      className="ml-auto rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: (edge.data?.color || '#6B7280') + '15',
                        color: edge.data?.color || '#6B7280',
                      }}
                    >
                      {RELATIONSHIP_TYPE_LABELS[relType] || relType}
                    </span>
                  )}
                </div>
              );
            })}
            {connectedEdges.length === 0 && (
              <span className="text-xs text-gray-400">연결된 관계가 없습니다</span>
            )}
          </div>
        </div>

        {/* 메타데이터 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            생성: {formatDate(node.createdAt)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            수정: {formatDate(node.updatedAt)}
          </div>
        </div>
      </div>
    </aside>
  );
}
