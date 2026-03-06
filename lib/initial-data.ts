import type { Node, Edge } from '@xyflow/react';
import type { NodeType, LifeMapNodeData, LifeMapEdgeData, RelationshipType } from '@/types';
import { RELATIONSHIP_STYLES } from '@/lib/constants';

export function createInitialNodes(): Node<LifeMapNodeData>[] {
  const now = new Date().toISOString();
  const n = (id: string, type: NodeType, label: string, tags: string[] = [], icon?: string): Node<LifeMapNodeData> => ({
    id,
    type: type === 'goal' ? 'goal' : type,
    position: { x: 0, y: 0 },
    data: {
      id, type, label,
      color: { person: '#3182F6', organization: '#8B5CF6', activity: '#10B981', goal: '#F97316' }[type],
      icon: icon || { person: '👤', organization: '🏢', activity: '📋', goal: '🎯' }[type],
      shape: type === 'goal' ? 'diamond' : 'rounded-rect',
      memo: '', tags, createdAt: now, updatedAt: now,
    } as LifeMapNodeData,
  });

  return [
    n('n1', 'person', '나 (전서원)', ['core']),
    n('n10', 'goal', '삶의 8대 영역 균형', ['핵심목표']),
    n('n2', 'person', '멘토 M', ['멘토', '삼성']),
    n('n3', 'person', 'Y', ['대학', '경영학과']),
    n('n4', 'organization', '건국대학교 경영학과', ['학업']),
    n('n5', 'organization', '소망교회 새움지구', ['신앙']),
    n('n6', 'organization', '홍대 직장', ['커리어']),
    n('n7', 'activity', '투자 분석 (제1원칙)', ['투자']),
    n('n8', 'activity', '재벌 지배구조 프로젝트', ['코딩']),
    n('n9', 'activity', '비즈니스 밋업', ['네트워킹']),
  ];
}

export function createInitialEdges(): Edge<LifeMapEdgeData>[] {
  const s = RELATIONSHIP_STYLES;
  const now = new Date().toISOString();
  const e = (id: string, src: string, tgt: string, rel: RelationshipType, label: string): Edge<LifeMapEdgeData> => ({
    id, source: src, target: tgt, type: 'relationship',
    data: { ...s[rel], label, relationshipType: rel, createdAt: now, updatedAt: now },
  });

  return [
    e('e1', 'n1', 'n2', 'mentor', '멘토'),
    e('e2', 'n1', 'n3', 'friend', '대학동기'),
    e('e3', 'n1', 'n4', 'member', '야간 재학'),
    e('e4', 'n1', 'n5', 'member', '교인'),
    e('e5', 'n1', 'n6', 'member', '근무중'),
    e('e6', 'n1', 'n7', 'collaborator', '주도'),
    e('e7', 'n2', 'n7', 'influences', '전략 조언'),
    e('e8', 'n3', 'n4', 'member', '동기'),
    e('e9', 'n1', 'n8', 'collaborator', '개발중'),
    e('e10', 'n1', 'n9', 'member', '참여'),
    e('e11', 'n10', 'n1', 'influences', '핵심가치'),
    e('e12', 'n10', 'n7', 'supports', '투자목표'),
    e('e13', 'n10', 'n8', 'supports', '프로젝트목표'),
  ];
}

const AUTOSAVE_KEY = 'lifemap-autosave';

export function loadSavedData(): { nodes: Node<LifeMapNodeData>[]; edges: Edge<LifeMapEdgeData>[] } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.nodes?.length > 0) return parsed;
  } catch {}
  return null;
}
