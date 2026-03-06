'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';
import { cn } from '@/lib/utils';

interface MandalartViewProps {
  sourceNodes: Node<LifeMapNodeData>[];
  sourceEdges: Edge<LifeMapEdgeData>[];
}

// 9x9 그리드 데이터 (81셀)
type MandalartGrid = string[][];

interface MandalartSheet {
  id: string;
  title: string;
  grid: MandalartGrid;
}

function createEmptyGrid(): MandalartGrid {
  return Array.from({ length: 9 }, () => Array(9).fill(''));
}

function createSheet(title: string): MandalartSheet {
  return {
    id: crypto.randomUUID(),
    title,
    grid: createEmptyGrid(),
  };
}

// 중앙 블록(1,1)의 8개 서브 목표 위치 → 대응하는 외곽 블록 중심 위치
const SUB_GOAL_MAP: [number, number, number, number][] = [
  [3, 3, 1, 1], [3, 4, 1, 4], [3, 5, 1, 7],
  [4, 3, 4, 1],               [4, 5, 4, 7],
  [5, 3, 7, 1], [5, 4, 7, 4], [5, 5, 7, 7],
];

const STORAGE_KEY = 'lifemap-mandalart-sheets';

function loadSheets(): MandalartSheet[] {
  if (typeof window === 'undefined') return [createSheet('만다라트 1')];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [createSheet('만다라트 1')];
}

function saveSheets(sheets: MandalartSheet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  } catch { /* ignore */ }
}

// 셀 분류 함수
function isCenterBlock(row: number, col: number) {
  return row >= 3 && row <= 5 && col >= 3 && col <= 5;
}

function isMainCenter(row: number, col: number) {
  return row === 4 && col === 4;
}

function isOuterBlockCenter(row: number, col: number) {
  if (isCenterBlock(row, col)) return false;
  return row % 3 === 1 && col % 3 === 1;
}

function isSubGoalCell(row: number, col: number) {
  return isCenterBlock(row, col) && !isMainCenter(row, col);
}

// === 셀 컴포넌트 ===
interface CellProps {
  value: string;
  row: number;
  col: number;
  onUpdate: (row: number, col: number, value: string) => void;
}

function MandalartCell({ value, row, col, onUpdate }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const mainCenter = isMainCenter(row, col);
  const centerBlock = isCenterBlock(row, col);
  const outerCenter = isOuterBlockCenter(row, col);
  const subGoal = isSubGoalCell(row, col);

  const handleCommit = useCallback(() => {
    setEditing(false);
    if (draft !== value) {
      onUpdate(row, col, draft);
    }
  }, [draft, value, row, col, onUpdate]);

  return (
    <td
      className={cn(
        'relative h-[72px] w-[100px] min-w-[100px] border border-[#E5E8EB] p-1 text-center align-middle transition-colors duration-100',
        mainCenter && 'bg-[#3182F6] text-white font-bold',
        !mainCenter && centerBlock && 'bg-[#E8F3FF]',
        outerCenter && 'bg-[#E8F3FF] font-semibold',
        !mainCenter && !centerBlock && !outerCenter && 'bg-white',
        !editing && 'cursor-pointer hover:bg-[#F2F4F6]',
        mainCenter && !editing && 'hover:bg-[#2B71D9]',
        centerBlock && !mainCenter && !editing && 'hover:bg-[#D4E8FF]',
      )}
      onClick={() => {
        if (!editing) {
          setEditing(true);
          setDraft(value);
        }
      }}
    >
      {editing ? (
        <textarea
          ref={inputRef}
          className="absolute inset-0 resize-none border-2 border-[#3182F6] bg-white p-1.5 text-center text-[12px] leading-snug text-[#191F28] outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleCommit();
            }
            if (e.key === 'Escape') {
              setDraft(value);
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className={cn(
            'block whitespace-pre-wrap text-[12px] leading-snug',
            mainCenter && 'text-[13px] font-bold text-white',
            (subGoal || outerCenter) && 'font-semibold text-[#333D4B]',
            !mainCenter && !subGoal && !outerCenter && 'text-[#4E5968]',
          )}
        >
          {value || (
            <span className={cn(
              'text-[11px]',
              mainCenter ? 'text-white/50' : 'text-[#D1D6DB]',
            )}>
              {mainCenter ? '핵심 목표' : ''}
            </span>
          )}
        </span>
      )}
    </td>
  );
}

// === 메인 컴포넌트 ===
export function MandalartView({ sourceNodes, sourceEdges }: MandalartViewProps) {
  const [sheets, setSheets] = useState<MandalartSheet[]>([createSheet('만다라트 1')]);
  const [activeSheetId, setActiveSheetId] = useState<string>('');
  const [initialized, setInitialized] = useState(false);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabDraft, setTabDraft] = useState('');
  const tabInputRef = useRef<HTMLInputElement>(null);

  // 초기 로드
  useEffect(() => {
    const loaded = loadSheets();
    setSheets(loaded);
    setActiveSheetId(loaded[0]?.id || '');
    setInitialized(true);
  }, []);

  // 자동 저장
  useEffect(() => {
    if (initialized) saveSheets(sheets);
  }, [sheets, initialized]);

  const activeSheet = sheets.find((s) => s.id === activeSheetId);
  const grid = activeSheet?.grid || createEmptyGrid();

  // 기존 goal 노드가 있고 첫 번째 시트가 비어있으면 자동 채우기
  useEffect(() => {
    if (!initialized || !activeSheet) return;
    const goalNodes = sourceNodes.filter((n) => n.type !== 'group' && n.data.type === 'goal');
    if (goalNodes.length === 0) return;
    if (grid[4][4] !== '') return;

    const newGrid = grid.map((r) => [...r]);
    const mainGoal = goalNodes[0];
    newGrid[4][4] = mainGoal.data.label;

    const connectedIds = new Set<string>();
    sourceEdges.forEach((e) => {
      if (e.source === mainGoal.id) connectedIds.add(e.target);
      if (e.target === mainGoal.id) connectedIds.add(e.source);
    });
    const connected = sourceNodes.filter(
      (n) => connectedIds.has(n.id) && n.type !== 'group'
    );

    const subPositions: [number, number][] = [
      [3, 3], [3, 4], [3, 5],
      [4, 3],         [4, 5],
      [5, 3], [5, 4], [5, 5],
    ];
    connected.slice(0, 8).forEach((node, i) => {
      const [r, c] = subPositions[i];
      newGrid[r][c] = node.data.label;
    });

    SUB_GOAL_MAP.forEach(([sr, sc, or, oc]) => {
      if (newGrid[sr][sc]) newGrid[or][oc] = newGrid[sr][sc];
    });

    setSheets((prev) =>
      prev.map((s) => (s.id === activeSheetId ? { ...s, grid: newGrid } : s))
    );
  }, [initialized, sourceNodes, sourceEdges]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellUpdate = useCallback((row: number, col: number, value: string) => {
    setSheets((prev) =>
      prev.map((s) => {
        if (s.id !== activeSheetId) return s;
        const newGrid = s.grid.map((r) => [...r]);
        newGrid[row][col] = value;

        // 서브 목표 ↔ 외곽 블록 중심 양방향 동기화
        const subMapping = SUB_GOAL_MAP.find(([sr, sc]) => sr === row && sc === col);
        if (subMapping) {
          const [, , or, oc] = subMapping;
          newGrid[or][oc] = value;
        }
        const outerMapping = SUB_GOAL_MAP.find(([, , or, oc]) => or === row && oc === col);
        if (outerMapping) {
          const [sr, sc] = outerMapping;
          newGrid[sr][sc] = value;
        }

        return { ...s, grid: newGrid };
      })
    );
  }, [activeSheetId]);

  const handleAddSheet = useCallback(() => {
    const newSheet = createSheet(`만다라트 ${sheets.length + 1}`);
    setSheets((prev) => [...prev, newSheet]);
    setActiveSheetId(newSheet.id);
  }, [sheets.length]);

  const handleDeleteSheet = useCallback((id: string) => {
    if (sheets.length <= 1) return;
    if (!confirm('이 만다라트를 삭제하시겠습니까?')) return;
    setSheets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(next[0]?.id || '');
      }
      return next;
    });
  }, [sheets.length, activeSheetId]);

  const handleReset = useCallback(() => {
    if (confirm('현재 만다라트를 초기화하시겠습니까? 모든 내용이 삭제됩니다.')) {
      setSheets((prev) =>
        prev.map((s) => (s.id === activeSheetId ? { ...s, grid: createEmptyGrid() } : s))
      );
    }
  }, [activeSheetId]);

  const handleRenameTab = useCallback((id: string) => {
    setEditingTabId(id);
    const sheet = sheets.find((s) => s.id === id);
    setTabDraft(sheet?.title || '');
    setTimeout(() => tabInputRef.current?.focus(), 0);
  }, [sheets]);

  const commitTabRename = useCallback(() => {
    if (editingTabId && tabDraft.trim()) {
      setSheets((prev) =>
        prev.map((s) => (s.id === editingTabId ? { ...s, title: tabDraft.trim() } : s))
      );
    }
    setEditingTabId(null);
  }, [editingTabId, tabDraft]);

  // 완성도 계산
  const filledCount = useMemo(() => {
    let count = 0;
    grid.forEach((row) => row.forEach((cell) => { if (cell.trim()) count++; }));
    return count;
  }, [grid]);

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-[#F9FAFB]">
      {/* 헤더: 탭 + 액션 */}
      <div className="flex items-center justify-between border-b border-[#F2F4F6] bg-white px-4 py-0">
        {/* 시트 탭 */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {sheets.map((sheet) => (
            <div
              key={sheet.id}
              className={cn(
                'group relative flex items-center gap-1 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer',
                activeSheetId === sheet.id
                  ? 'border-[#3182F6] text-[#191F28]'
                  : 'border-transparent text-[#8B95A1] hover:text-[#4E5968]',
              )}
              onClick={() => setActiveSheetId(sheet.id)}
              onDoubleClick={() => handleRenameTab(sheet.id)}
            >
              {editingTabId === sheet.id ? (
                <input
                  ref={tabInputRef}
                  className="w-20 border-b border-[#3182F6] bg-transparent text-center text-[13px] font-medium outline-none"
                  value={tabDraft}
                  onChange={(e) => setTabDraft(e.target.value)}
                  onBlur={commitTabRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTabRename();
                    if (e.key === 'Escape') setEditingTabId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span>{sheet.title}</span>
              )}
              {sheets.length > 1 && activeSheetId === sheet.id && (
                <button
                  className="ml-1 hidden rounded p-0.5 text-[#B0B8C1] hover:bg-[#F2F4F6] hover:text-[#4E5968] group-hover:block"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSheet(sheet.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddSheet}
            className="flex items-center gap-1 px-3 py-2.5 text-[#B0B8C1] transition-all duration-150 hover:text-[#4E5968]"
            title="만다라트 추가"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* 우측 정보 + 초기화 */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#8B95A1]">
            {filledCount}/81 ({Math.round((filledCount / 81) * 100)}%)
          </span>
          <button
            onClick={handleReset}
            className="rounded-xl border border-[#E5E8EB] px-3 py-1 text-[12px] font-medium text-[#8B95A1] transition-all duration-150 hover:border-[#D1D6DB] hover:text-[#4E5968]"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 9x9 그리드 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="rounded-2xl border border-[#E5E8EB] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="mandalart-grid border-collapse">
            <tbody>
              {grid.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((cell, colIdx) => (
                    <MandalartCell
                      key={`${activeSheetId}-${rowIdx}-${colIdx}`}
                      value={cell}
                      row={rowIdx}
                      col={colIdx}
                      onUpdate={handleCellUpdate}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 사용법 안내 */}
      <div className="border-t border-[#F2F4F6] bg-white px-6 py-2.5">
        <p className="text-[11px] text-[#B0B8C1]">
          셀 클릭으로 입력 · 중앙 서브 목표 ↔ 외곽 블록 중심 자동 동기화 · 탭 더블클릭으로 이름 변경 · + 버튼으로 새 만다라트 추가
        </p>
      </div>
    </div>
  );
}
