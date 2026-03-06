'use client';

import type { SaveState } from '@/hooks/useAutoSave';

export type { SaveState };

export function SaveIndicator({ state }: { state: SaveState }) {
  const colors: Record<SaveState, string> = {
    idle: 'bg-[#D1D6DB]',
    saving: 'bg-[#F59E0B] animate-pulse',
    saved: 'bg-[#34C759]',
    error: 'bg-[#FF4545]',
  };

  const labels: Record<SaveState, string> = {
    idle: '',
    saving: '저장 중',
    saved: '저장됨',
    error: '저장 실패',
  };

  return (
    <span className="flex items-center gap-1.5" title={labels[state] || '자동저장'}>
      <span className={`inline-block h-2 w-2 rounded-full transition-colors duration-300 ${colors[state]}`} />
      {state !== 'idle' && (
        <span className="text-[11px] font-medium text-[#8B95A1] transition-opacity duration-300">
          {labels[state]}
        </span>
      )}
    </span>
  );
}
