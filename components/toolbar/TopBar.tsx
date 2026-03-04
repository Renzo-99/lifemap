'use client';

import { Map, Search } from 'lucide-react';
import { useViewStore } from '@/stores/useViewStore';
import type { ViewMode } from '@/types';
import { cn } from '@/lib/utils';

const VIEW_TABS: { id: ViewMode; label: string; shortcut: string }[] = [
  { id: 'canvas', label: '캔버스', shortcut: '1' },
  { id: 'mindmap', label: '마인드맵', shortcut: '2' },
  { id: 'mandalart', label: '만다라트', shortcut: '3' },
  { id: 'graph', label: '그래프', shortcut: '4' },
];

export function TopBar() {
  const { currentView, setCurrentView } = useViewStore();

  return (
    <header className="flex h-12 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* 로고 */}
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-blue-600" />
        <span className="text-base font-bold text-gray-900">LifeMap</span>
      </div>

      {/* 뷰 전환 탭 */}
      <nav className="flex items-center gap-1 rounded-lg bg-gray-100 p-1">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              currentView === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
            title={`${tab.label} (${tab.shortcut})`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 검색 */}
      <button
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
        title="검색 (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>검색</span>
        <kbd className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
