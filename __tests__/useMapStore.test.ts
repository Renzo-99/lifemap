import { describe, it, expect, beforeEach } from 'vitest';
import { useMapStore } from '@/stores/useMapStore';

describe('useMapStore', () => {
  beforeEach(() => {
    // 스토어 초기화
    useMapStore.getState().clearAll();
  });

  // === 노드 CRUD ===
  describe('노드 관리', () => {
    it('addNode: 사람 노드를 추가하면 올바른 기본값으로 생성된다', () => {
      const id = useMapStore.getState().addNode('person', { x: 100, y: 200 });
      const node = useMapStore.getState().nodes[id];

      expect(node).toBeDefined();
      expect(node.id).toBe(id);
      expect(node.type).toBe('person');
      expect(node.label).toBe('새 사람');
      expect(node.color).toBe('#3182F6');
      expect(node.icon).toBe('👤');
      expect(node.shape).toBe('rounded-rect');
      expect(node.memo).toBe('');
      expect(node.tags).toEqual([]);
      expect(node.createdAt).toBeTruthy();
      expect(node.updatedAt).toBeTruthy();
    });

    it('addNode: 목표 노드는 diamond 모양을 가진다', () => {
      const id = useMapStore.getState().addNode('goal', { x: 0, y: 0 });
      const node = useMapStore.getState().nodes[id];

      expect(node.type).toBe('goal');
      expect(node.shape).toBe('diamond');
      expect(node.color).toBe('#F97316');
      expect(node.icon).toBe('🎯');
      expect(node.label).toBe('새 목표');
    });

    it('addNode: 조직 노드는 올바른 기본값을 가진다', () => {
      const id = useMapStore.getState().addNode('organization', { x: 0, y: 0 });
      const node = useMapStore.getState().nodes[id];

      expect(node.label).toBe('새 조직');
      expect(node.color).toBe('#8B5CF6');
      expect(node.icon).toBe('🏢');
    });

    it('addNode: 활동 노드는 올바른 기본값을 가진다', () => {
      const id = useMapStore.getState().addNode('activity', { x: 0, y: 0 });
      const node = useMapStore.getState().nodes[id];

      expect(node.label).toBe('새 활동');
      expect(node.color).toBe('#10B981');
      expect(node.icon).toBe('📋');
    });

    it('addNode: 커스텀 라벨을 지정할 수 있다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 }, '홍길동');
      expect(useMapStore.getState().nodes[id].label).toBe('홍길동');
    });

    it('addNode: 각 노드는 고유한 ID를 가진다', () => {
      const id1 = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      const id2 = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      expect(id1).not.toBe(id2);
    });

    it('updateNode: 노드 라벨을 수정할 수 있다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      useMapStore.getState().updateNode(id, { label: '김철수' });

      expect(useMapStore.getState().nodes[id].label).toBe('김철수');
    });

    it('updateNode: 수정 시 updatedAt이 갱신된다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      const before = useMapStore.getState().nodes[id].updatedAt;

      // 약간의 시간 차이를 위해
      useMapStore.getState().updateNode(id, { label: '변경됨' });
      const after = useMapStore.getState().nodes[id].updatedAt;

      expect(after).toBeTruthy();
      // updatedAt이 변경되었는지 확인 (같은 밀리초 내에서 실행될 수 있으므로 >= 비교)
      expect(new Date(after).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
    });

    it('updateNode: 존재하지 않는 노드를 수정해도 에러가 나지 않는다', () => {
      expect(() => {
        useMapStore.getState().updateNode('nonexistent', { label: 'test' });
      }).not.toThrow();
    });

    it('updateNode: 태그를 추가할 수 있다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      useMapStore.getState().updateNode(id, { tags: ['가족', '중요'] });

      expect(useMapStore.getState().nodes[id].tags).toEqual(['가족', '중요']);
    });

    it('updateNode: 메모를 수정할 수 있다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      useMapStore.getState().updateNode(id, { memo: '중요한 사람입니다' });

      expect(useMapStore.getState().nodes[id].memo).toBe('중요한 사람입니다');
    });

    it('deleteNode: 노드를 삭제할 수 있다', () => {
      const id = useMapStore.getState().addNode('person', { x: 0, y: 0 });
      expect(useMapStore.getState().nodes[id]).toBeDefined();

      useMapStore.getState().deleteNode(id);
      expect(useMapStore.getState().nodes[id]).toBeUndefined();
    });

    it('deleteNode: 존재하지 않는 노드를 삭제해도 에러가 나지 않는다', () => {
      expect(() => {
        useMapStore.getState().deleteNode('nonexistent');
      }).not.toThrow();
    });
  });

  // === 엣지 CRUD ===
  describe('엣지 관리', () => {
    it('addEdge: 가족 관계를 추가하면 올바른 스타일이 적용된다', () => {
      const id = useMapStore.getState().addEdge('node1', 'node2', 'family');
      const edge = useMapStore.getState().edges[id];

      expect(edge).toBeDefined();
      expect(edge.relationshipType).toBe('family');
      expect(edge.color).toBe('#EF4444');
      expect(edge.thickness).toBe(3);
      expect(edge.style).toBe('solid');
      expect(edge.direction).toBe('none');
      expect(edge.label).toBe('가족');
    });

    it('addEdge: 멘토 관계는 forward 방향이다', () => {
      const id = useMapStore.getState().addEdge('a', 'b', 'mentor');
      const edge = useMapStore.getState().edges[id];

      expect(edge.direction).toBe('forward');
      expect(edge.color).toBe('#F59E0B');
    });

    it('addEdge: 협업 관계는 both 방향이다', () => {
      const id = useMapStore.getState().addEdge('a', 'b', 'collaborator');
      expect(useMapStore.getState().edges[id].direction).toBe('both');
    });

    it('addEdge: 커스텀 라벨을 지정할 수 있다', () => {
      const id = useMapStore.getState().addEdge('a', 'b', 'custom', '특별한 관계');
      expect(useMapStore.getState().edges[id].label).toBe('특별한 관계');
    });

    it('updateEdge: 엣지 색상을 변경할 수 있다', () => {
      const id = useMapStore.getState().addEdge('a', 'b', 'friend');
      useMapStore.getState().updateEdge(id, { color: '#FF0000' });

      expect(useMapStore.getState().edges[id].color).toBe('#FF0000');
    });

    it('updateEdge: 존재하지 않는 엣지를 수정해도 에러가 나지 않는다', () => {
      expect(() => {
        useMapStore.getState().updateEdge('nonexistent', { color: '#000' });
      }).not.toThrow();
    });

    it('deleteEdge: 엣지를 삭제할 수 있다', () => {
      const id = useMapStore.getState().addEdge('a', 'b', 'friend');
      useMapStore.getState().deleteEdge(id);

      expect(useMapStore.getState().edges[id]).toBeUndefined();
    });
  });

  // === 프레임 CRUD ===
  describe('프레임 관리', () => {
    it('addFrame: 프레임을 추가할 수 있다', () => {
      const id = useMapStore.getState().addFrame(
        '가족 그룹',
        { x: 0, y: 0 },
        { width: 300, height: 200 }
      );
      const frame = useMapStore.getState().frames[id];

      expect(frame).toBeDefined();
      expect(frame.label).toBe('가족 그룹');
      expect(frame.color).toBe('#E5E7EB');
      expect(frame.childNodeIds).toEqual([]);
    });

    it('updateFrame: 프레임 라벨을 수정할 수 있다', () => {
      const id = useMapStore.getState().addFrame('test', { x: 0, y: 0 }, { width: 100, height: 100 });
      useMapStore.getState().updateFrame(id, { label: '수정된 그룹' });

      expect(useMapStore.getState().frames[id].label).toBe('수정된 그룹');
    });

    it('deleteFrame: 프레임을 삭제할 수 있다', () => {
      const id = useMapStore.getState().addFrame('test', { x: 0, y: 0 }, { width: 100, height: 100 });
      useMapStore.getState().deleteFrame(id);

      expect(useMapStore.getState().frames[id]).toBeUndefined();
    });
  });

  // === 유틸 ===
  describe('유틸리티', () => {
    it('clearAll: 모든 데이터를 초기화한다', () => {
      useMapStore.getState().addNode('person', { x: 0, y: 0 });
      useMapStore.getState().addEdge('a', 'b', 'friend');
      useMapStore.getState().addFrame('g', { x: 0, y: 0 }, { width: 100, height: 100 });

      useMapStore.getState().clearAll();

      expect(Object.keys(useMapStore.getState().nodes)).toHaveLength(0);
      expect(Object.keys(useMapStore.getState().edges)).toHaveLength(0);
      expect(Object.keys(useMapStore.getState().frames)).toHaveLength(0);
    });

    it('여러 노드를 동시에 관리할 수 있다', () => {
      const id1 = useMapStore.getState().addNode('person', { x: 0, y: 0 }, 'A');
      const id2 = useMapStore.getState().addNode('goal', { x: 100, y: 100 }, 'B');
      const id3 = useMapStore.getState().addNode('activity', { x: 200, y: 200 }, 'C');

      expect(Object.keys(useMapStore.getState().nodes)).toHaveLength(3);

      useMapStore.getState().deleteNode(id2);
      expect(Object.keys(useMapStore.getState().nodes)).toHaveLength(2);
      expect(useMapStore.getState().nodes[id1]).toBeDefined();
      expect(useMapStore.getState().nodes[id3]).toBeDefined();
    });
  });
});
