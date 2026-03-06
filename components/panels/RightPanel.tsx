'use client';

import { X, Calendar, Tag, Link2 } from 'lucide-react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { useViewStore } from '@/stores/useViewStore';
import { NODE_TYPE_LABELS, RELATIONSHIP_TYPE_LABELS } from '@/lib/constants';
import type { NodeType, RelationshipType, LifeMapNodeData, LifeMapEdgeData } from '@/types';

interface RightPanelProps {
  flowNodes: Node<LifeMapNodeData>[];
  flowEdges: Edge<LifeMapEdgeData>[];
}

export function RightPanel({ flowNodes, flowEdges }: RightPanelProps) {
  const { selectedNodeIds, rightPanelOpen, setRightPanelOpen } = useViewStore();
  const { updateNodeData } = useReactFlow();

  if (!rightPanelOpen || selectedNodeIds.length === 0) return null;

  const nodeId = selectedNodeIds[0];
  const flowNode = flowNodes.find((n) => n.id === nodeId);
  if (!flowNode) return null;

  const node = flowNode.data;

  const connectedEdges = flowEdges.filter(
    (e) => e.source === nodeId || e.target === nodeId
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleUpdateNode = (updates: Partial<LifeMapNodeData>) => {
    updateNodeData(nodeId, { ...updates, updatedAt: new Date().toISOString() });
  };

  return (
    <aside className="flex w-80 flex-col border-l border-[#F2F4F6] bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#F2F4F6] px-4 py-3">
        <span className="text-sm font-semibold text-[#191F28]">{node.label}</span>
        <button
          onClick={() => setRightPanelOpen(false)}
          className="rounded-lg p-1 text-[#B0B8C1] transition-all duration-150 hover:bg-[#F2F4F6] hover:text-[#4E5968]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 기본 정보 */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#8B95A1]">타입:</span>
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: node.color + '15', color: node.color }}
            >
              {NODE_TYPE_LABELS[node.type as NodeType]}
            </span>
          </div>

          {/* 라벨 수정 */}
          <div className="mt-3">
            <span className="text-xs text-[#8B95A1]">이름:</span>
            <input
              className="mt-1 w-full rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] px-2.5 py-1.5 text-sm text-[#333D4B] outline-none transition-all duration-150 focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/10"
              value={node.label}
              onChange={(e) => handleUpdateNode({ label: e.target.value })}
            />
          </div>

          {/* 태그 */}
          <div className="mt-3 flex items-start gap-2">
            <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#B0B8C1]" />
            <div className="flex flex-wrap gap-1">
              {node.tags.map((tag) => (
                <span
                  key={tag}
                  className="group flex items-center rounded-full bg-[#F2F4F6] px-2 py-0.5 text-xs text-[#6B7684]"
                >
                  {tag}
                  <button
                    className="ml-1 hidden text-[#B0B8C1] hover:text-[#FF4545] group-hover:inline"
                    onClick={() => handleUpdateNode({ tags: node.tags.filter((t) => t !== tag) })}
                  >
                    x
                  </button>
                </span>
              ))}
              <button
                className="rounded-full border border-dashed border-[#D1D6DB] px-2 py-0.5 text-xs text-[#B0B8C1] hover:border-[#B0B8C1] hover:text-[#6B7684]"
                onClick={() => {
                  const tag = prompt('태그 입력:');
                  if (tag) {
                    handleUpdateNode({ tags: [...node.tags, tag] });
                  }
                }}
              >
                + 추가
              </button>
            </div>
          </div>
        </div>

        {/* 메모 */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#8B95A1]">
            메모
          </div>
          <textarea
            className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] p-3 text-sm text-[#333D4B] outline-none transition-all duration-150 focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/10"
            rows={6}
            placeholder="메모를 입력하세요..."
            value={node.memo}
            onChange={(e) => handleUpdateNode({ memo: e.target.value })}
          />
        </div>

        {/* 연결된 관계 */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#8B95A1]">
            <Link2 className="h-3.5 w-3.5" />
            연결된 관계 ({connectedEdges.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {connectedEdges.map((edge) => {
              const isSource = edge.source === nodeId;
              const otherNodeId = isSource ? edge.target : edge.source;
              const otherNode = flowNodes.find((n) => n.id === otherNodeId);
              const direction = isSource ? '→' : '←';
              const relType = edge.data?.relationshipType as RelationshipType | undefined;

              return (
                <div
                  key={edge.id}
                  className="flex items-center gap-2 rounded-md bg-[#F9FAFB] px-2.5 py-1.5 text-xs"
                >
                  <span className="text-[#B0B8C1]">{direction}</span>
                  <span className="font-medium text-[#4E5968]">
                    {otherNode?.data?.label || '알 수 없음'}
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
              <span className="text-xs text-[#B0B8C1]">연결된 관계가 없습니다</span>
            )}
          </div>
        </div>

        {/* 메타데이터 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-[#B0B8C1]">
            <Calendar className="h-3 w-3" />
            생성: {formatDate(node.createdAt)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#B0B8C1]">
            <Calendar className="h-3 w-3" />
            수정: {formatDate(node.updatedAt)}
          </div>
        </div>
      </div>
    </aside>
  );
}
