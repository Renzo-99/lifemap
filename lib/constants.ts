import type { NodeType, RelationshipType, EdgeStyle, EdgeDirection, EdgeThickness } from '@/types';

// === 노드 타입별 기본 색상 ===
export const NODE_COLORS: Record<NodeType, string> = {
  person: '#3182F6',
  organization: '#8B5CF6',
  activity: '#10B981',
  goal: '#F97316',
};

// === 노드 타입별 기본 아이콘 (이모지) ===
export const NODE_ICONS: Record<NodeType, string> = {
  person: '👤',
  organization: '🏢',
  activity: '📋',
  goal: '🎯',
};

// === 노드 타입별 한국어 라벨 ===
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  person: '사람',
  organization: '조직',
  activity: '활동',
  goal: '목표',
};

// === 관계 유형별 기본 스타일 ===
export interface RelationshipStyle {
  color: string;
  thickness: EdgeThickness;
  style: EdgeStyle;
  direction: EdgeDirection;
  label: string;
}

export const RELATIONSHIP_STYLES: Record<RelationshipType, RelationshipStyle> = {
  family: { color: '#EF4444', thickness: 3, style: 'solid', direction: 'none', label: '가족' },
  friend: { color: '#3B82F6', thickness: 2, style: 'dashed', direction: 'none', label: '친구' },
  mentor: { color: '#F59E0B', thickness: 3, style: 'solid', direction: 'forward', label: '멘토' },
  colleague: { color: '#9CA3AF', thickness: 1, style: 'dotted', direction: 'none', label: '동료' },
  member: { color: '#8B5CF6', thickness: 2, style: 'solid', direction: 'forward', label: '소속' },
  collaborator: { color: '#10B981', thickness: 2, style: 'solid', direction: 'both', label: '협업' },
  supports: { color: '#06B6D4', thickness: 2, style: 'dashed', direction: 'forward', label: '지원' },
  influences: { color: '#EC4899', thickness: 2, style: 'dashed', direction: 'forward', label: '영향' },
  custom: { color: '#6B7280', thickness: 1, style: 'solid', direction: 'none', label: '사용자 정의' },
};

// === 관계 유형 한국어 라벨 ===
export const RELATIONSHIP_TYPE_LABELS: Record<RelationshipType, string> = {
  family: '가족',
  friend: '친구',
  mentor: '멘토',
  colleague: '동료',
  member: '소속',
  collaborator: '협업',
  supports: '지원',
  influences: '영향',
  custom: '사용자 정의',
};

// === 노드 기본 크기 ===
export const DEFAULT_NODE_SIZE = { width: 140, height: 80 };

// === 줌 범위 ===
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 3.0;
export const ZOOM_DEFAULT = 1.0;

// === 자동 저장 디바운스 (ms) ===
export const AUTO_SAVE_DEBOUNCE = 300;

// === localStorage 키 ===
export const STORAGE_KEY = 'lifemap-data';
