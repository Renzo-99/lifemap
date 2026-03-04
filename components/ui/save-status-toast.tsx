'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Check, Loader2, CloudOff } from 'lucide-react';

const STORAGE_KEY = 'lifemap-autosave';

/**
 * Toss 스타일 자동저장 토스트 훅
 * - 변경 감지 → 1초 디바운스 → localStorage 저장
 * - 저장 상태를 Toss 스타일 플로팅 토스트로 표시
 * - 깔끔한 아이콘 + 짧은 메시지 + 부드러운 애니메이션
 */
export function useAutoSave(data: { nodes: unknown[]; edges: unknown[] }) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | number | undefined>(undefined);
  const isFirstRender = useRef(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const save = useCallback(() => {
    try {
      const savedAt = new Date().toISOString();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...data, savedAt })
      );
      setLastSavedAt(savedAt);

      // 저장 완료 토스트 — Toss 스타일: 짧고 명확
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
      toastIdRef.current = toast.success('변경사항이 저장되었어요', {
        icon: <Check className="h-4 w-4 text-[#3182F6]" strokeWidth={3} />,
        duration: 1500,
        className: '!bg-white !border-[#E5E8EB]',
      });
    } catch {
      toast.error('저장에 실패했어요', {
        icon: <CloudOff className="h-4 w-4 text-[#FF4545]" />,
        duration: 3000,
        description: '브라우저 저장 공간이 부족할 수 있어요',
      });
    }
  }, [data]);

  useEffect(() => {
    // 최초 렌더링은 무시 (초기 데이터 로드)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(save, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, save]);

  return { lastSavedAt };
}

/**
 * 저장 상태 뱃지 — 하단 상태바에 표시되는 인라인 컴포넌트
 * Toss 스타일: 미니멀, 아이콘 + 텍스트, 색상으로 상태 구분
 */
export function SaveStatusBadge({ lastSavedAt }: { lastSavedAt: string | null }) {
  if (!lastSavedAt) return null;

  const time = new Date(lastSavedAt);
  const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  return (
    <span className="flex items-center gap-1.5 text-[#8B95A1]">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#3182F6]" />
      <span className="text-[11px] font-medium">{timeStr} 저장됨</span>
    </span>
  );
}
