'use client';

import { Map, Search } from 'lucide-react';
import { useViewStore } from '@/stores/useViewStore';
import type { ViewMode } from '@/types';
import { cn } from '@/lib/utils';

const VIEW_TABS: { id: ViewMode; label: string; shortcut: string }[] = [
  { id: 'canvas', label: '캔버스', shortcut: '1' },
  { id: 'mindmap', label: '마인드맵', shortcut: '2' },
  { id: 'mandalart', label: '만다라트', shortcut: '3' },
  // 그래프 뷰는 당분간 숨김 (코드는 GraphView.tsx에 유지)
  // { id: 'graph', label: '그래프', shortcut: '4' },
];

export function TopBar() {
  const { currentView, setCurrentView } = useViewStore();

  return (
    <header className="flex h-12 items-center justify-between border-b border-[#F2F4F6] bg-white px-4">
      {/* 로고 */}
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-[#3182F6]" />
        <span className="text-base font-bold text-[#191F28]">LifeMap</span>
      </div>

      {/* 뷰 전환 탭 */}
      <nav className="flex items-center gap-1 rounded-xl bg-[#F2F4F6] p-1">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentView(tab.id)}
            className={cn(
              'rounded-[10px] px-3.5 py-1.5 text-[13px] font-medium transition-all duration-150 ease-in-out',
              currentView === tab.id
                ? 'bg-white text-[#191F28] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#8B95A1] hover:text-[#4E5968]'
            )}
            title={`${tab.label} (${tab.shortcut})`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* 검색 */}
      <button
        className="flex items-center gap-2 rounded-xl border border-[#E5E8EB] px-3 py-1.5 text-[13px] text-[#8B95A1] transition-all duration-150 hover:border-[#D1D6DB] hover:text-[#4E5968]"
        title="검색 (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" />
        <span>검색</span>
        <kbd className="ml-2 rounded-lg bg-[#F2F4F6] px-1.5 py-0.5 text-[10px] font-mono text-[#B0B8C1]">
          ⌘K
        </kbd>
      </button>
    </header>
  );
}
