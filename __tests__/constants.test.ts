import { describe, it, expect } from 'vitest';
import {
  NODE_COLORS,
  NODE_ICONS,
  NODE_TYPE_LABELS,
  RELATIONSHIP_STYLES,
  RELATIONSHIP_TYPE_LABELS,
  DEFAULT_NODE_SIZE,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  AUTO_SAVE_DEBOUNCE,
  STORAGE_KEY,
} from '@/lib/constants';

describe('constants', () => {
  describe('NODE_COLORS', () => {
    it('4가지 노드 타입 모두에 색상이 정의되어 있다', () => {
      expect(NODE_COLORS.person).toBe('#3182F6');
      expect(NODE_COLORS.organization).toBe('#8B5CF6');
      expect(NODE_COLORS.activity).toBe('#10B981');
      expect(NODE_COLORS.goal).toBe('#F97316');
    });

    it('모든 색상이 유효한 hex 형식이다', () => {
      Object.values(NODE_COLORS).forEach((color) => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('NODE_ICONS', () => {
    it('4가지 노드 타입 모두에 아이콘이 정의되어 있다', () => {
      expect(NODE_ICONS.person).toBe('👤');
      expect(NODE_ICONS.organization).toBe('🏢');
      expect(NODE_ICONS.activity).toBe('📋');
      expect(NODE_ICONS.goal).toBe('🎯');
    });
  });

  describe('NODE_TYPE_LABELS', () => {
    it('모든 노드 타입에 한국어 라벨이 있다', () => {
      expect(NODE_TYPE_LABELS.person).toBe('사람');
      expect(NODE_TYPE_LABELS.organization).toBe('조직');
      expect(NODE_TYPE_LABELS.activity).toBe('활동');
      expect(NODE_TYPE_LABELS.goal).toBe('목표');
    });
  });

  describe('RELATIONSHIP_STYLES', () => {
    it('9가지 관계 타입 모두에 스타일이 정의되어 있다', () => {
      const types = ['family', 'friend', 'mentor', 'colleague', 'member', 'collaborator', 'supports', 'influences', 'custom'];
      types.forEach((type) => {
        expect(RELATIONSHIP_STYLES[type as keyof typeof RELATIONSHIP_STYLES]).toBeDefined();
      });
    });

    it('각 스타일에 필수 필드가 있다', () => {
      Object.values(RELATIONSHIP_STYLES).forEach((style) => {
        expect(style.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(style.thickness).toBeGreaterThanOrEqual(1);
        expect(style.thickness).toBeLessThanOrEqual(4);
        expect(['solid', 'dashed', 'dotted']).toContain(style.style);
        expect(['none', 'forward', 'backward', 'both']).toContain(style.direction);
        expect(style.label).toBeTruthy();
      });
    });

    it('가족 관계는 두께 3, solid, 빨간색이다', () => {
      const family = RELATIONSHIP_STYLES.family;
      expect(family.thickness).toBe(3);
      expect(family.style).toBe('solid');
      expect(family.color).toBe('#EF4444');
    });
  });

  describe('RELATIONSHIP_TYPE_LABELS', () => {
    it('모든 관계 타입에 한국어 라벨이 있다', () => {
      expect(Object.keys(RELATIONSHIP_TYPE_LABELS)).toHaveLength(9);
      expect(RELATIONSHIP_TYPE_LABELS.family).toBe('가족');
      expect(RELATIONSHIP_TYPE_LABELS.custom).toBe('사용자 정의');
    });

    it('RELATIONSHIP_STYLES의 label과 일치한다', () => {
      Object.entries(RELATIONSHIP_STYLES).forEach(([key, style]) => {
        expect(RELATIONSHIP_TYPE_LABELS[key as keyof typeof RELATIONSHIP_TYPE_LABELS]).toBe(style.label);
      });
    });
  });

  describe('기본 설정 값', () => {
    it('DEFAULT_NODE_SIZE가 합리적인 값이다', () => {
      expect(DEFAULT_NODE_SIZE.width).toBeGreaterThan(0);
      expect(DEFAULT_NODE_SIZE.height).toBeGreaterThan(0);
    });

    it('줌 범위가 합리적이다', () => {
      expect(ZOOM_MIN).toBeLessThan(ZOOM_DEFAULT);
      expect(ZOOM_DEFAULT).toBeLessThan(ZOOM_MAX);
      expect(ZOOM_MIN).toBeGreaterThan(0);
    });

    it('AUTO_SAVE_DEBOUNCE가 양수이다', () => {
      expect(AUTO_SAVE_DEBOUNCE).toBeGreaterThan(0);
    });

    it('STORAGE_KEY가 정의되어 있다', () => {
      expect(STORAGE_KEY).toBe('lifemap-data');
    });
  });
});
