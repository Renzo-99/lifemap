import { describe, it, expect, beforeEach } from 'vitest';
import { useViewStore } from '@/stores/useViewStore';

describe('useViewStore', () => {
  beforeEach(() => {
    // 초기 상태로 리셋
    useViewStore.setState({
      currentView: 'canvas',
      selectedNodeIds: [],
      focusNodeId: undefined,
      rightPanelOpen: false,
      leftSidebarExpanded: false,
      filters: {
        nodeTypes: ['person', 'organization', 'activity', 'goal'],
        tags: [],
        relationshipTypes: [
          'family', 'friend', 'mentor', 'colleague', 'member',
          'collaborator', 'supports', 'influences', 'custom',
        ],
      },
    });
  });

  // === 뷰 전환 ===
  describe('뷰 전환', () => {
    it('기본 뷰는 canvas이다', () => {
      expect(useViewStore.getState().currentView).toBe('canvas');
    });

    it('setCurrentView: 마인드맵으로 전환한다', () => {
      useViewStore.getState().setCurrentView('mindmap');
      expect(useViewStore.getState().currentView).toBe('mindmap');
    });

    it('setCurrentView: 만다라트로 전환한다', () => {
      useViewStore.getState().setCurrentView('mandalart');
      expect(useViewStore.getState().currentView).toBe('mandalart');
    });

    it('setCurrentView: 그래프로 전환한다', () => {
      useViewStore.getState().setCurrentView('graph');
      expect(useViewStore.getState().currentView).toBe('graph');
    });
  });

  // === 노드 선택 ===
  describe('노드 선택', () => {
    it('setSelectedNodes: 노드를 선택하면 우측 패널이 열린다', () => {
      useViewStore.getState().setSelectedNodes(['node1']);

      expect(useViewStore.getState().selectedNodeIds).toEqual(['node1']);
      expect(useViewStore.getState().rightPanelOpen).toBe(true);
    });

    it('setSelectedNodes: 빈 배열이면 우측 패널이 닫힌다', () => {
      useViewStore.getState().setSelectedNodes(['node1']);
      useViewStore.getState().setSelectedNodes([]);

      expect(useViewStore.getState().selectedNodeIds).toEqual([]);
      expect(useViewStore.getState().rightPanelOpen).toBe(false);
    });

    it('setSelectedNodes: 여러 노드를 선택할 수 있다', () => {
      useViewStore.getState().setSelectedNodes(['node1', 'node2', 'node3']);
      expect(useViewStore.getState().selectedNodeIds).toHaveLength(3);
    });

    it('toggleNodeSelection: 선택되지 않은 노드를 토글하면 추가된다', () => {
      useViewStore.getState().toggleNodeSelection('node1');

      expect(useViewStore.getState().selectedNodeIds).toContain('node1');
      expect(useViewStore.getState().rightPanelOpen).toBe(true);
    });

    it('toggleNodeSelection: 이미 선택된 노드를 토글하면 제거된다', () => {
      useViewStore.getState().setSelectedNodes(['node1', 'node2']);
      useViewStore.getState().toggleNodeSelection('node1');

      expect(useViewStore.getState().selectedNodeIds).toEqual(['node2']);
      expect(useViewStore.getState().rightPanelOpen).toBe(true);
    });

    it('toggleNodeSelection: 마지막 노드를 제거하면 패널이 닫힌다', () => {
      useViewStore.getState().setSelectedNodes(['node1']);
      useViewStore.getState().toggleNodeSelection('node1');

      expect(useViewStore.getState().selectedNodeIds).toEqual([]);
      expect(useViewStore.getState().rightPanelOpen).toBe(false);
    });

    it('clearSelection: 선택을 초기화하고 패널을 닫는다', () => {
      useViewStore.getState().setSelectedNodes(['node1', 'node2']);
      useViewStore.getState().clearSelection();

      expect(useViewStore.getState().selectedNodeIds).toEqual([]);
      expect(useViewStore.getState().rightPanelOpen).toBe(false);
    });
  });

  // === 패널/사이드바 ===
  describe('패널/사이드바', () => {
    it('setRightPanelOpen: 우측 패널을 열고 닫을 수 있다', () => {
      useViewStore.getState().setRightPanelOpen(true);
      expect(useViewStore.getState().rightPanelOpen).toBe(true);

      useViewStore.getState().setRightPanelOpen(false);
      expect(useViewStore.getState().rightPanelOpen).toBe(false);
    });

    it('setLeftSidebarExpanded: 좌측 사이드바를 확장/축소할 수 있다', () => {
      expect(useViewStore.getState().leftSidebarExpanded).toBe(false);

      useViewStore.getState().setLeftSidebarExpanded(true);
      expect(useViewStore.getState().leftSidebarExpanded).toBe(true);
    });

    it('setFocusNode: 포커스 노드를 설정하고 해제할 수 있다', () => {
      useViewStore.getState().setFocusNode('node1');
      expect(useViewStore.getState().focusNodeId).toBe('node1');

      useViewStore.getState().setFocusNode(undefined);
      expect(useViewStore.getState().focusNodeId).toBeUndefined();
    });
  });

  // === 필터 ===
  describe('필터', () => {
    it('기본 필터는 모든 노드 타입을 포함한다', () => {
      const { nodeTypes } = useViewStore.getState().filters;
      expect(nodeTypes).toContain('person');
      expect(nodeTypes).toContain('organization');
      expect(nodeTypes).toContain('activity');
      expect(nodeTypes).toContain('goal');
      expect(nodeTypes).toHaveLength(4);
    });

    it('기본 필터는 모든 관계 타입을 포함한다', () => {
      const { relationshipTypes } = useViewStore.getState().filters;
      expect(relationshipTypes).toHaveLength(9);
    });

    it('toggleNodeTypeFilter: 노드 타입을 제거할 수 있다', () => {
      useViewStore.getState().toggleNodeTypeFilter('person');

      const { nodeTypes } = useViewStore.getState().filters;
      expect(nodeTypes).not.toContain('person');
      expect(nodeTypes).toHaveLength(3);
    });

    it('toggleNodeTypeFilter: 제거된 노드 타입을 다시 추가할 수 있다', () => {
      useViewStore.getState().toggleNodeTypeFilter('person');
      useViewStore.getState().toggleNodeTypeFilter('person');

      expect(useViewStore.getState().filters.nodeTypes).toContain('person');
    });

    it('toggleRelationshipFilter: 관계 타입 필터를 토글한다', () => {
      useViewStore.getState().toggleRelationshipFilter('family');

      expect(useViewStore.getState().filters.relationshipTypes).not.toContain('family');
      expect(useViewStore.getState().filters.relationshipTypes).toHaveLength(8);
    });

    it('addTagFilter: 태그 필터를 추가한다', () => {
      useViewStore.getState().addTagFilter('중요');

      expect(useViewStore.getState().filters.tags).toContain('중요');
    });

    it('addTagFilter: 중복 태그는 추가되지 않는다', () => {
      useViewStore.getState().addTagFilter('중요');
      useViewStore.getState().addTagFilter('중요');

      expect(useViewStore.getState().filters.tags).toHaveLength(1);
    });

    it('removeTagFilter: 태그 필터를 제거한다', () => {
      useViewStore.getState().addTagFilter('중요');
      useViewStore.getState().addTagFilter('가족');
      useViewStore.getState().removeTagFilter('중요');

      expect(useViewStore.getState().filters.tags).toEqual(['가족']);
    });

    it('clearFilters: 필터를 초기 상태로 리셋한다', () => {
      useViewStore.getState().toggleNodeTypeFilter('person');
      useViewStore.getState().addTagFilter('test');
      useViewStore.getState().toggleRelationshipFilter('family');

      useViewStore.getState().clearFilters();

      const { filters } = useViewStore.getState();
      expect(filters.nodeTypes).toHaveLength(4);
      expect(filters.tags).toHaveLength(0);
      expect(filters.relationshipTypes).toHaveLength(9);
    });
  });
});
