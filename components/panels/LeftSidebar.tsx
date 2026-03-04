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
        'flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-200',
        leftSidebarExpanded ? 'w-56' : 'w-14'
      )}
    >
      <button
        onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        className="flex h-10 items-center justify-center border-b border-gray-200 text-gray-400 hover:text-gray-600"
      >
        {leftSidebarExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* 노드 추가 */}
      <div className="flex flex-col gap-1 p-2">
        {leftSidebarExpanded && (
          <span className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            노드 추가
          </span>
        )}
        {NODE_ITEMS.map(({ type, icon: Icon }) => (
          <button
            key={type}
            onClick={() => onAddNode(type)}
            className={cn(
              'flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:shadow-sm',
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
      <div className="mt-2 flex flex-col gap-1 border-t border-gray-200 p-2">
        {leftSidebarExpanded && (
          <span className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
            그룹
          </span>
        )}
        <button
          onClick={onGroupSelected}
          disabled={!hasMultipleSelected}
          className={cn(
            'flex items-center gap-3 rounded-lg p-2 text-sm font-medium transition-colors',
            hasMultipleSelected
              ? 'text-gray-600 hover:bg-white hover:shadow-sm'
              : 'cursor-not-allowed text-gray-300',
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
            'flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white hover:shadow-sm',
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
        <div className="mt-auto border-t border-gray-200 p-3">
          <p className="text-[10px] leading-relaxed text-gray-400">
            노드 핸들에서 드래그하여 연결선 생성.
            상단 툴바에서 관계 타입 선택 후 연결.
          </p>
        </div>
      )}
    </aside>
  );
}
