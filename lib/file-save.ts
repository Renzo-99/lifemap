import type { Node, Edge } from '@xyflow/react';
import type { LifeMapNodeData, LifeMapEdgeData } from '@/types';

const BACKUP_KEY = 'lifemap-backups';
const MAX_BACKUPS = 10;

interface SaveData {
  nodes: Node<LifeMapNodeData>[];
  edges: Edge<LifeMapEdgeData>[];
  savedAt: string;
  version: number;
}

interface BackupEntry {
  id: string;
  label: string;
  savedAt: string;
  nodeCount: number;
  edgeCount: number;
  data: SaveData;
}

// 현재 시각 포맷: YYYYMMDD_HHmmss
function formatTimestamp(date: Date = new Date()): string {
  const y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}${M}${d}_${h}${m}${s}`;
}

// JSON 파일로 내보내기
export function exportToFile(nodes: Node<LifeMapNodeData>[], edges: Edge<LifeMapEdgeData>[]) {
  const data: SaveData = {
    nodes,
    edges,
    savedAt: new Date().toISOString(),
    version: 1,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LifeMap_${formatTimestamp()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSON 파일 불러오기
export function importFromFile(): Promise<{ nodes: Node<LifeMapNodeData>[]; edges: Edge<LifeMapEdgeData>[] }> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('파일이 선택되지 않았습니다')); return; }
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
          reject(new Error('올바른 LifeMap 파일이 아닙니다'));
          return;
        }
        resolve({ nodes: data.nodes, edges: data.edges });
      } catch {
        reject(new Error('파일을 읽을 수 없습니다'));
      }
    };
    input.click();
  });
}

// 백업 저장 (localStorage, 최대 MAX_BACKUPS개 유지)
export function createBackup(nodes: Node<LifeMapNodeData>[], edges: Edge<LifeMapEdgeData>[], label?: string) {
  const backups = getBackups();
  const now = new Date();
  const entry: BackupEntry = {
    id: `backup_${formatTimestamp(now)}`,
    label: label || `백업 ${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR')}`,
    savedAt: now.toISOString(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    data: { nodes, edges, savedAt: now.toISOString(), version: 1 },
  };
  backups.unshift(entry);
  // 최대 개수 초과 시 오래된 것 삭제
  while (backups.length > MAX_BACKUPS) backups.pop();
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
  } catch {
    // 용량 초과 시 가장 오래된 백업 삭제 후 재시도
    backups.pop();
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
  }
  return entry;
}

// 백업 목록 조회
export function getBackups(): BackupEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 백업 복원
export function restoreBackup(backupId: string): { nodes: Node<LifeMapNodeData>[]; edges: Edge<LifeMapEdgeData>[] } | null {
  const backups = getBackups();
  const backup = backups.find((b) => b.id === backupId);
  if (!backup) return null;
  return { nodes: backup.data.nodes, edges: backup.data.edges };
}

// 백업 삭제
export function deleteBackup(backupId: string) {
  const backups = getBackups().filter((b) => b.id !== backupId);
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
}
