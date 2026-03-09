'use client';

import { useState, useCallback } from 'react';
import { Map, Search, Download, Upload, Archive, Trash2, RotateCcw } from 'lucide-react';
import { useViewStore } from '@/stores/useViewStore';
import type { ViewMode } from '@/types';
import { cn } from '@/lib/utils';

const VIEW_TABS: { id: ViewMode; label: string; shortcut: string }[] = [
  { id: 'canvas', label: '캔버스', shortcut: '1' },
  { id: 'mindmap', label: '마인드맵', shortcut: '2' },
  { id: 'mandalart', label: '만다라트', shortcut: '3' },
];

interface TopBarProps {
  onExport?: () => void;
  onImport?: () => void;
  onBackup?: () => void;
  onRestoreBackup?: (backupId: string) => void;
  onDeleteBackup?: (backupId: string) => void;
  backups?: { id: string; label: string; savedAt: string; nodeCount: number; edgeCount: number }[];
}

export function TopBar({ onExport, onImport, onBackup, onRestoreBackup, onDeleteBackup, backups = [] }: TopBarProps) {
  const { currentView, setCurrentView } = useViewStore();
  const [showBackups, setShowBackups] = useState(false);

  const toggleBackups = useCallback(() => setShowBackups((v) => !v), []);

  return (
    <header className="relative flex h-12 items-center justify-between border-b border-[#F2F4F6] bg-white px-4">
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

      {/* 저장/불러오기/백업 */}
      <div className="flex items-center gap-1.5">
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] px-2.5 py-1.5 text-[12px] font-medium text-[#4E5968] transition-all hover:bg-[#F9FAFB] hover:text-[#191F28]"
            title="파일로 저장"
          >
            <Download className="h-3.5 w-3.5" />
            저장
          </button>
        )}
        {onImport && (
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] px-2.5 py-1.5 text-[12px] font-medium text-[#4E5968] transition-all hover:bg-[#F9FAFB] hover:text-[#191F28]"
            title="파일에서 불러오기"
          >
            <Upload className="h-3.5 w-3.5" />
            불러오기
          </button>
        )}
        {onBackup && (
          <div className="relative">
            <button
              onClick={() => { onBackup(); toggleBackups(); }}
              className="flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] px-2.5 py-1.5 text-[12px] font-medium text-[#4E5968] transition-all hover:bg-[#F9FAFB] hover:text-[#191F28]"
              title="백업 생성 및 관리"
            >
              <Archive className="h-3.5 w-3.5" />
              백업
              {backups.length > 0 && (
                <span className="rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-600">{backups.length}</span>
              )}
            </button>

            {/* 백업 드롭다운 */}
            {showBackups && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBackups(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-[#E5E8EB] bg-white shadow-xl">
                  <div className="border-b border-[#F2F4F6] px-3 py-2">
                    <h3 className="text-[13px] font-semibold text-[#191F28]">백업 목록</h3>
                    <p className="text-[11px] text-[#8B95A1]">최대 10개 보관 (새 백업이 방금 생성됨)</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {backups.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[12px] text-[#8B95A1]">백업이 없습니다</p>
                    ) : (
                      backups.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between border-b border-[#F2F4F6] px-3 py-2 last:border-0"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium text-[#191F28]">{b.label}</p>
                            <p className="text-[10px] text-[#8B95A1]">
                              노드 {b.nodeCount} / 연결 {b.edgeCount}
                            </p>
                          </div>
                          <div className="ml-2 flex items-center gap-1">
                            {onRestoreBackup && (
                              <button
                                onClick={() => { onRestoreBackup(b.id); setShowBackups(false); }}
                                className="rounded-md p-1 text-blue-500 hover:bg-blue-50"
                                title="이 백업으로 복원"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onDeleteBackup && (
                              <button
                                onClick={() => onDeleteBackup(b.id)}
                                className="rounded-md p-1 text-red-400 hover:bg-red-50"
                                title="백업 삭제"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mx-1 h-5 w-px bg-[#E5E8EB]" />

        {/* 검색 */}
        <button
          className="flex items-center gap-2 rounded-lg border border-[#E5E8EB] px-2.5 py-1.5 text-[12px] text-[#8B95A1] transition-all hover:border-[#D1D6DB] hover:text-[#4E5968]"
          title="검색 (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <kbd className="rounded bg-[#F2F4F6] px-1 py-0.5 text-[10px] font-mono text-[#B0B8C1]">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
