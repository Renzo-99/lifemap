'use client';

import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'lifemap-autosave';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 * 자동저장 훅 — 토스트 없이, 상태만 반환
 */
export function useAutoSave(data: { nodes: unknown[]; edges: unknown[] }) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveState('saving');

    saveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...data, savedAt: new Date().toISOString() })
        );
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data]);

  return { saveState };
}

/**
 * 신호등 스타일 저장 상태 인디케이터
 * - idle: 회색 dot
 * - saving: 노란 dot (깜빡임)
 * - saved: 초록 dot
 * - error: 빨간 dot
 */
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
