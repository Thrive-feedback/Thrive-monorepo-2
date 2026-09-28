import { describe, expect, it } from 'vitest';
import { cn } from '@/lib/cn.util';

describe('merging class names', () => {
  it('lets a later class replace a conflicting earlier one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
