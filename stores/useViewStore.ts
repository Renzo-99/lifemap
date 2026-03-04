'use client';

import { create } from 'zustand';
import type { ViewMode, NodeType, RelationshipType } from '@/types';

interface ViewStoreState {
  currentView: ViewMode;
  selectedNodeIds: string[];
  focusNodeId?: string;
  rightPanelOpen: boolean;
  leftSidebarExpanded: boolean;
  filters: {
    nodeTypes: NodeType[];
    tags: string[];
    relationshipTypes: RelationshipType[];
  };

  // 액션
  setCurrentView: (view: ViewMode) => void;
  setSelectedNodes: (ids: string[]) => void;
  toggleNodeSelection: (id: string) => void;
  clearSelection: () => void;
  setFocusNode: (id: string | undefined) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLeftSidebarExpanded: (expanded: boolean) => void;
  toggleNodeTypeFilter: (type: NodeType) => void;
  toggleRelationshipFilter: (type: RelationshipType) => void;
  addTagFilter: (tag: string) => void;
  removeTagFilter: (tag: string) => void;
  clearFilters: () => void;
}

const ALL_NODE_TYPES: NodeType[] = ['person', 'organization', 'activity', 'goal'];
const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  'family', 'friend', 'mentor', 'colleague', 'member',
  'collaborator', 'supports', 'influences', 'custom',
];

export const useViewStore = create<ViewStoreState>()((set) => ({
  currentView: 'canvas',
  selectedNodeIds: [],
  focusNodeId: undefined,
  rightPanelOpen: false,
  leftSidebarExpanded: false,
  filters: {
    nodeTypes: [...ALL_NODE_TYPES],
    tags: [],
    relationshipTypes: [...ALL_RELATIONSHIP_TYPES],
  },

  setCurrentView: (view) => set({ currentView: view }),

  setSelectedNodes: (ids) => set({ selectedNodeIds: ids, rightPanelOpen: ids.length > 0 }),

  toggleNodeSelection: (id) =>
    set((state) => {
      const exists = state.selectedNodeIds.includes(id);
      const newIds = exists
        ? state.selectedNodeIds.filter((nid) => nid !== id)
        : [...state.selectedNodeIds, id];
      return { selectedNodeIds: newIds, rightPanelOpen: newIds.length > 0 };
    }),

  clearSelection: () => set({ selectedNodeIds: [], rightPanelOpen: false }),

  setFocusNode: (id) => set({ focusNodeId: id }),

  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),

  setLeftSidebarExpanded: (expanded) => set({ leftSidebarExpanded: expanded }),

  toggleNodeTypeFilter: (type) =>
    set((state) => {
      const types = state.filters.nodeTypes;
      const exists = types.includes(type);
      return {
        filters: {
          ...state.filters,
          nodeTypes: exists ? types.filter((t) => t !== type) : [...types, type],
        },
      };
    }),

  toggleRelationshipFilter: (type) =>
    set((state) => {
      const types = state.filters.relationshipTypes;
      const exists = types.includes(type);
      return {
        filters: {
          ...state.filters,
          relationshipTypes: exists ? types.filter((t) => t !== type) : [...types, type],
        },
      };
    }),

  addTagFilter: (tag) =>
    set((state) => ({
      filters: {
        ...state.filters,
        tags: state.filters.tags.includes(tag)
          ? state.filters.tags
          : [...state.filters.tags, tag],
      },
    })),

  removeTagFilter: (tag) =>
    set((state) => ({
      filters: {
        ...state.filters,
        tags: state.filters.tags.filter((t) => t !== tag),
      },
    })),

  clearFilters: () =>
    set({
      filters: {
        nodeTypes: [...ALL_NODE_TYPES],
        tags: [],
        relationshipTypes: [...ALL_RELATIONSHIP_TYPES],
      },
    }),
}));
