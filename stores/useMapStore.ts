'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { LifeMapNodeData, LifeMapEdgeData, Frame, NodeType, RelationshipType } from '@/types';
import { NODE_COLORS, NODE_ICONS, DEFAULT_NODE_SIZE, RELATIONSHIP_STYLES, STORAGE_KEY } from '@/lib/constants';

interface MapState {
  nodes: Record<string, LifeMapNodeData>;
  edges: Record<string, LifeMapEdgeData>;
  frames: Record<string, Frame>;

  // 노드 액션
  addNode: (type: NodeType, position: { x: number; y: number }, label?: string) => string;
  updateNode: (id: string, updates: Partial<LifeMapNodeData>) => void;
  deleteNode: (id: string) => void;

  // 엣지 액션
  addEdge: (source: string, target: string, relationshipType: RelationshipType, label?: string) => string;
  updateEdge: (id: string, updates: Partial<LifeMapEdgeData>) => void;
  deleteEdge: (id: string) => void;

  // 프레임 액션
  addFrame: (label: string, position: { x: number; y: number }, size: { width: number; height: number }) => string;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  deleteFrame: (id: string) => void;

  // 유틸
  getConnectedEdges: (nodeId: string) => LifeMapEdgeData[];
  clearAll: () => void;
}

export const useMapStore = create<MapState>()(
  persist(
    immer((set, get) => ({
      nodes: {},
      edges: {},
      frames: {},

      addNode: (type, position, label) => {
        const id = nanoid();
        const now = new Date().toISOString();
        set((state) => {
          state.nodes[id] = {
            id,
            type,
            label: label || `새 ${type === 'person' ? '사람' : type === 'organization' ? '조직' : type === 'activity' ? '활동' : '목표'}`,
            color: NODE_COLORS[type],
            icon: NODE_ICONS[type],
            shape: type === 'goal' ? 'diamond' : 'rounded-rect',
            memo: '',
            tags: [],
            createdAt: now,
            updatedAt: now,
            position,
            size: DEFAULT_NODE_SIZE,
          } as LifeMapNodeData;
        });
        return id;
      },

      updateNode: (id, updates) => {
        set((state) => {
          if (state.nodes[id]) {
            Object.assign(state.nodes[id], updates, { updatedAt: new Date().toISOString() });
          }
        });
      },

      deleteNode: (id) => {
        set((state) => {
          delete state.nodes[id];
          // 연결된 엣지도 삭제
          const edgeIds = Object.keys(state.edges);
          for (const edgeId of edgeIds) {
            const edge = state.edges[edgeId];
            if (edge && ('source' in edge || 'target' in edge)) {
              // 엣지 데이터에서 source/target은 React Flow 엣지 레벨에서 관리
              // 여기서는 스토어의 메타데이터만 삭제
            }
          }
        });
      },

      addEdge: (source, target, relationshipType, label) => {
        const id = nanoid();
        const now = new Date().toISOString();
        const style = RELATIONSHIP_STYLES[relationshipType];
        set((state) => {
          state.edges[id] = {
            label: label || style.label,
            relationshipType,
            color: style.color,
            thickness: style.thickness,
            style: style.style,
            direction: style.direction,
            createdAt: now,
            updatedAt: now,
          };
        });
        return id;
      },

      updateEdge: (id, updates) => {
        set((state) => {
          if (state.edges[id]) {
            Object.assign(state.edges[id], updates, { updatedAt: new Date().toISOString() });
          }
        });
      },

      deleteEdge: (id) => {
        set((state) => {
          delete state.edges[id];
        });
      },

      addFrame: (label, position, size) => {
        const id = nanoid();
        set((state) => {
          state.frames[id] = { id, label, position, size, color: '#E5E7EB', childNodeIds: [] };
        });
        return id;
      },

      updateFrame: (id, updates) => {
        set((state) => {
          if (state.frames[id]) {
            Object.assign(state.frames[id], updates);
          }
        });
      },

      deleteFrame: (id) => {
        set((state) => {
          delete state.frames[id];
        });
      },

      getConnectedEdges: (nodeId) => {
        // React Flow 레벨에서 처리하므로 여기서는 빈 배열 반환
        return [];
      },

      clearAll: () => {
        set((state) => {
          state.nodes = {};
          state.edges = {};
          state.frames = {};
        });
      },
    })),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        frames: state.frames,
      }),
    }
  )
);
