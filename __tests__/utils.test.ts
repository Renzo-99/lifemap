import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (Tailwind 클래스 병합)', () => {
  it('단일 클래스를 반환한다', () => {
    expect(cn('text-sm')).toBe('text-sm');
  });

  it('여러 클래스를 병합한다', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('조건부 클래스를 처리한다', () => {
    expect(cn('base', true && 'active', false && 'disabled')).toBe('base active');
  });

  it('undefined/null을 무시한다', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('빈 문자열을 무시한다', () => {
    expect(cn('base', '')).toBe('base');
  });

  it('Tailwind 충돌 클래스를 올바르게 병합한다', () => {
    // twMerge가 뒤의 클래스를 우선시
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('배열 형태도 처리한다', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold');
  });

  it('객체 형태도 처리한다 (clsx 스타일)', () => {
    expect(cn({ 'text-sm': true, 'font-bold': false })).toBe('text-sm');
  });
});
