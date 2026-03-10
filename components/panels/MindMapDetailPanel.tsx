'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Star, Tag, Calendar } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData, NodeStatus } from '@/types';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS: { value: NodeStatus; label: string; color: string }[] = [
  { value: 'active', label: '진행중', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'done', label: '완료', color: 'bg-green-100 text-green-600 border-green-200' },
  { value: 'hold', label: '보류', color: 'bg-amber-100 text-amber-600 border-amber-200' },
  { value: 'none', label: '미분류', color: 'bg-gray-100 text-gray-500 border-gray-200' },
];

// 메모 입력: 로컬 상태 + blur 시 반영
function MemoInput({ memo, onCommit }: { memo: string; onCommit: (val: string) => void }) {
  const [value, setValue] = useState(memo);

  useEffect(() => {
    setValue(memo);
  }, [memo]);

  return (
    <div className="border-b border-[#F2F4F6] px-4 py-3">
      <div className="mb-2 text-xs font-medium text-[#8B95A1]">메모</div>
      <textarea
        className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] p-3 text-sm text-[#333D4B] outline-none transition-all focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/10"
        rows={5}
        placeholder="메모를 입력하세요..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value !== memo) onCommit(value); }}
      />
    </div>
  );
}

// 로컬 상태로 입력을 관리하고 blur/Enter 시에만 부모에 반영
function NameInput({ label, onCommit }: { label: string; onCommit: (val: string) => void }) {
  const [value, setValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부에서 label이 바뀌면 (다른 노드 선택 등) 동기화
  useEffect(() => {
    setValue(label);
  }, [label]);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== label) {
      onCommit(trimmed);
    } else {
      setValue(label); // 빈 값이면 원래 값 복원
    }
  };

  return (
    <div className="border-b border-[#F2F4F6] px-4 py-3">
      <div className="mb-1 text-xs font-medium text-[#8B95A1]">이름</div>
      <input
        ref={inputRef}
        className="w-full rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] px-2.5 py-1.5 text-sm text-[#333D4B] outline-none transition-all focus:border-[#3182F6] focus:bg-white focus:ring-2 focus:ring-[#3182F6]/10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
      />
    </div>
  );
}

interface MindMapDetailPanelProps {
  selectedNodeId: string | null;
  nodes: Node<LifeMapNodeData>[];
  edges: Edge<LifeMapEdgeData>[];
  onClose: () => void;
  onUpdateNode: (nodeId: string, updates: Partial<LifeMapNodeData>) => void;
}

export function MindMapDetailPanel({ selectedNodeId, nodes, edges, onClose, onUpdateNode }: MindMapDetailPanelProps) {
  const node = nodes.find((n) => n.id === selectedNodeId);
  if (!selectedNodeId || !node) return null;

  const data = node.data;
  const importance = data.importance || 0;
  const status: NodeStatus = data.status || 'none';

  const update = (updates: Partial<LifeMapNodeData>) => {
    onUpdateNode(selectedNodeId, updates);
  };

  const connectedEdges = edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
  const connectedNodes = connectedEdges.map((e) => {
    const otherId = e.source === selectedNodeId ? e.target : e.source;
    const otherNode = nodes.find((n) => n.id === otherId);
    const dir = e.source === selectedNodeId ? '→' : '←';
    return { id: otherId, label: otherNode?.data?.label || '알 수 없음', direction: dir, edgeLabel: e.data?.label };
  });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-l border-[#F2F4F6] bg-white shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[#F2F4F6] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span className={cn(
            'truncate text-sm font-semibold text-[#191F28]',
            status === 'done' && 'line-through text-gray-400',
          )}>
            {data.label}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-[#B0B8C1] transition-all hover:bg-[#F2F4F6] hover:text-[#4E5968]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* 중요도 (별표 1~5) */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#8B95A1]">
            <Star className="h-3.5 w-3.5" />
            중요도
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => update({ importance: importance === star ? 0 : star })}
                className={cn(
                  'rounded-md px-1.5 py-1 text-lg transition-all',
                  star <= importance
                    ? 'text-amber-400 hover:text-amber-500'
                    : 'text-gray-200 hover:text-gray-300'
                )}
                title={`중요도 ${star}`}
              >
                ★
              </button>
            ))}
            {importance > 0 && (
              <span className="ml-2 text-[11px] text-[#8B95A1]">{importance}/5</span>
            )}
          </div>
        </div>

        {/* 상태 분류 */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="mb-2 text-xs font-medium text-[#8B95A1]">상태</div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update({ status: opt.value })}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all',
                  status === opt.value
                    ? cn(opt.color, 'ring-1 ring-current/20')
                    : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {status === 'done' && (
            <p className="mt-2 text-[11px] text-green-500">완료 처리됨 — 마인드맵에서 삭선으로 표시됩니다</p>
          )}
          {status === 'hold' && (
            <p className="mt-2 text-[11px] text-amber-500">보류 처리됨 — 마인드맵에서 점선 테두리로 표시됩니다</p>
          )}
        </div>

        {/* 이름 수정 */}
        <NameInput label={data.label} onCommit={(val) => update({ label: val })} />

        {/* 태그 */}
        <div className="border-b border-[#F2F4F6] px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#8B95A1]">
            <Tag className="h-3.5 w-3.5" />
            태그
          </div>
          <div className="flex flex-wrap gap-1">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="group flex items-center rounded-full bg-[#F2F4F6] px-2 py-0.5 text-xs text-[#6B7684]"
              >
                {tag}
                <button
                  className="ml-1 hidden text-[#B0B8C1] hover:text-[#FF4545] group-hover:inline"
                  onClick={() => update({ tags: data.tags.filter((t) => t !== tag) })}
                >
                  ×
                </button>
              </span>
            ))}
            <button
              className="rounded-full border border-dashed border-[#D1D6DB] px-2 py-0.5 text-xs text-[#B0B8C1] hover:border-[#B0B8C1] hover:text-[#6B7684]"
              onClick={() => {
                const tag = prompt('태그 입력:');
                if (tag?.trim()) update({ tags: [...data.tags, tag.trim()] });
              }}
            >
              + 추가
            </button>
          </div>
        </div>

        {/* 메모 */}
        <MemoInput memo={data.memo} onCommit={(val) => update({ memo: val })} />

        {/* 연결 노드 */}
        {connectedNodes.length > 0 && (
          <div className="border-b border-[#F2F4F6] px-4 py-3">
            <div className="mb-2 text-xs font-medium text-[#8B95A1]">연결 ({connectedNodes.length})</div>
            <div className="flex flex-col gap-1">
              {connectedNodes.map((cn) => (
                <div key={cn.id} className="flex items-center gap-2 rounded-md bg-[#F9FAFB] px-2.5 py-1.5 text-xs">
                  <span className="text-[#B0B8C1]">{cn.direction}</span>
                  <span className="font-medium text-[#4E5968]">{cn.label}</span>
                  {cn.edgeLabel && (
                    <span className="ml-auto text-[10px] text-[#B0B8C1]">{cn.edgeLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메타데이터 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-[#B0B8C1]">
            <Calendar className="h-3 w-3" />
            생성: {formatDate(data.createdAt)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#B0B8C1]">
            <Calendar className="h-3 w-3" />
            수정: {formatDate(data.updatedAt)}
          </div>
        </div>
      </div>
    </aside>
  );
}
