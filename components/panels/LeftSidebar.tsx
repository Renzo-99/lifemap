'use client';

import { User, Building2, ClipboardList, Target, ChevronRight, ChevronLeft } from 'lucide-react';
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
}

export function LeftSidebar({ onAddNode }: LeftSidebarProps) {
  const { leftSidebarExpanded, setLeftSidebarExpanded } = useViewStore();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 bg-gray-50 transition-all duration-200',
        leftSidebarExpanded ? 'w-56' : 'w-14'
      )}
    >
      {/* 접기/펼치기 버튼 */}
      <button
        onClick={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        className="flex h-10 items-center justify-center border-b border-gray-200 text-gray-400 hover:text-gray-600"
      >
        {leftSidebarExpanded ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* 노드 타입 목록 */}
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
            <Icon
              className="h-5 w-5 flex-shrink-0"
              style={{ color: NODE_COLORS[type] }}
            />
            {leftSidebarExpanded && (
              <span>{NODE_TYPE_LABELS[type]}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
}
