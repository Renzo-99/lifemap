'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

const STORAGE_KEY = 'lifemap-autosave';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function useAutoSave(data: { nodes: unknown[]; edges: unknown[] }) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // 데이터 참조 안정화: 길이가 같고 ID 목록이 같으면 같은 참조 유지
  const stableKey = useMemo(() => {
    const nodeIds = (data.nodes as { id?: string }[]).map((n) => n.id || '').join(',');
    const edgeIds = (data.edges as { id?: string }[]).map((e) => e.id || '').join(',');
    return `${nodeIds}|${edgeIds}|${data.nodes.length}|${data.edges.length}`;
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
