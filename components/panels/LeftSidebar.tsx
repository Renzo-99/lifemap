'use client';

import { User, Building2, ClipboardList, Target, ChevronRight, ChevronLeft, Group, Ungroup } from 'lucide-react';
import { useViewStore } from '@/stores/useViewStore';
import type { NodeType } from '@/types';
import { NODE_TYPE_LABELS, NODE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NODE_ITEMS: { type: NodeType; icon: typeof User }[] = [
  { type: 'person', icon: User },
  { type: 'organization', icon: Building2 },
  { type: 'activity', icon: ClipboardList },
  { type: 'goal', icon: Target },
];

interface LeftSidebarProps {
  onAddNode: (type: NodeType) => void;
  onGroupSelected?: () => void;
  onUngroupSelected?: () => void;
}

export function LeftSidebar({ onAddNode, onGroupSelected, onUngroupSelected }: LeftSidebarProps) {
  const { leftSidebarExpanded, setLeftSidebarExpanded, selectedNodeIds } = useViewStore();
  const hasMultipleSelected = selectedNodeIds.length >= 2;

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-[#F2F4F6] bg-[#F9FAFB] transition-all duration-200 ease-in-out',
        leftSidebarExpanded ? 'w-56' : 'w-14'
      )}
    >
      <button
        onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        className="flex h-10 items-center justify-center border-b border-[#F2F4F6] text-[#B0B8C1] transition-all duration-150 hover:text-[#4E5968]"
      >
        {leftSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* 노드 추가 */}
      <div className="flex flex-col gap-1 p-2">
        {leftSidebarExpanded && (
          <span className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-[#B0B8C1]">
            노드 추가
          </span>
        )}
        {NODE_ITEMS.map(({ type, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddNode(type)}
            className={cn(
              'flex items-center gap-3 rounded-xl p-2 text-sm font-medium text-[#4E5968] transition-all duration-150 hover:bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
              !leftSidebarExpanded && 'justify-center'
            )}
            title={NODE_TYPE_LABELS[type]}
          >
            <Icon className="h-5 w-5 flex-shrink-0" style={{ color: NODE_COLORS[type] }} />
            {leftSidebarExpanded && <span>{NODE_TYPE_LABELS[type]}</span>}
          </button>
        ))}
      </div>

      {/* 그룹 도구 */}
      <div className="mt-2 flex flex-col gap-1 border-t border-[#F2F4F6] p-2">
        {leftSidebarExpanded && (
          <span className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-[#B0B8C1]">
            그룹
          </span>
        )}
        <button
          onClick={onGroupSelected}
          disabled={!hasMultipleSelected}
          className={cn(
            'flex items-center gap-3 rounded-xl p-2 text-sm font-medium transition-all duration-150',
            hasMultipleSelected
              ? 'text-[#4E5968] hover:bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
              : 'cursor-not-allowed text-[#D1D6DB]',
            !leftSidebarExpanded && 'justify-center'
          )}
          title="선택 노드 그룹화 (2개 이상 선택)"
        >
          <Group className="h-5 w-5 flex-shrink-0" />
          {leftSidebarExpanded && <span>그룹화</span>}
        </button>
        <button
          onClick={onUngroupSelected}
          className={cn(
            'flex items-center gap-3 rounded-xl p-2 text-sm font-medium text-[#4E5968] transition-all duration-150 hover:bg-white hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
            !leftSidebarExpanded && 'justify-center'
          )}
          title="그룹 해제 (그룹 노드 선택 후)"
        >
          <Ungroup className="h-5 w-5 flex-shrink-0" />
          {leftSidebarExpanded && <span>그룹 해제</span>}
        </button>
      </div>

      {/* 안내 */}
      {leftSidebarExpanded && (
        <div className="mt-auto border-t border-[#F2F4F6] p-3">
          <p className="text-[10px] leading-relaxed text-[#B0B8C1]">
            노드 핸들에서 드래그하여 연결선 생성.
            상단 툴바에서 관계 타입 선택 후 연결.
          </p>
        </div>
      )}
    </aside>
  );
}
