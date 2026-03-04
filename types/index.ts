// LifeMap 중앙 타입 정의

// === 노드 타입 ===
export type NodeType = 'person' | 'organization' | 'activity' | 'goal';

export type NodeShape = 'rounded-rect' | 'circle' | 'diamond' | 'hexagon';

export type MandalartLevel = 'core' | 'sub' | 'action';

export interface MandalartData {
  level: MandalartLevel;
  parentGoalId?: string;
  gridPosition?: number; // 0-8
}

export type LifeMapNodeData = {
  id: string;
  type: NodeType;
  label: string;
  color: string;
  icon?: string;
  avatar?: string;
  shape: NodeShape;
  memo: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  mandalart?: MandalartData;
  [key: string]: unknown;
}

// === 엣지(연결선) 타입 ===
export type RelationshipType =
  | 'family'
  | 'friend'
  | 'mentor'
  | 'colleague'
  | 'member'
  | 'collaborator'
  | 'supports'
  | 'influences'
  | 'custom';

export type EdgeThickness = 1 | 2 | 3 | 4;

export type EdgeStyle = 'solid' | 'dashed' | 'dotted';

export type EdgeDirection = 'none' | 'forward' | 'backward' | 'both';

export type LifeMapEdgeData = {
  label?: string;
  relationshipType: RelationshipType;
  color: string;
  thickness: EdgeThickness;
  style: EdgeStyle;
  direction: EdgeDirection;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

// === 프레임 타입 ===
export interface Frame {
  id: string;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  childNodeIds: string[];
}

// === 뷰 타입 ===
export type ViewMode = 'canvas' | 'mindmap' | 'mandalart' | 'graph';

export interface ViewState {
  currentView: ViewMode;
  canvas: {
    panX: number;
    panY: number;
    zoom: number;
  };
  selectedNodeIds: string[];
  focusNodeId?: string;
  filters: {
    nodeTypes: NodeType[];
    tags: string[];
    relationshipTypes: RelationshipType[];
  };
}

// === 스냅샷 (Undo/Redo) ===
export interface Snapshot {
  nodes: Record<string, LifeMapNodeData>;
  edges: Record<string, LifeMapEdgeData>;
  frames: Record<string, Frame>;
}
