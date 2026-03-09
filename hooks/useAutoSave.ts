'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

const STORAGE_KEY = 'lifemap-autosave';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(data: { nodes: unknown[]; edges: unknown[] }) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // 데이터 참조 안정화: 내용이 실질적으로 바뀔 때만 저장 트리거
  const stableKey = useMemo(() => {
    const nodeKey = (data.nodes as { id?: string; position?: { x: number; y: number }; data?: { label?: string } }[])
      .map((n) => `${n.id}:${n.position?.x?.toFixed(0)},${n.position?.y?.toFixed(0)}:${n.data?.label || ''}`)
      .join('|');
    const edgeKey = (data.edges as { id?: string; source?: string; target?: string; data?: { label?: string } }[])
      .map((e) => `${e.id}:${e.source}-${e.target}:${e.data?.label || ''}`)
      .join('|');
    return `${nodeKey}||${edgeKey}`;
  }, [data.nodes, data.edges]);

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
  }, [stableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { saveState };
}
