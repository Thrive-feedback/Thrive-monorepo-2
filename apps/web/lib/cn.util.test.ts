import { describe, expect, it } from 'vitest';
import { cn } from './cn.util';

describe('cn', () => {
  it('keeps a type role and a text colour together', () => {
    expect(cn('text-body-2', 'text-fg-secondary')).toBe(
      'text-body-2 text-fg-secondary',
    );
  });

  it('lets a later type role replace an earlier one', () => {
    expect(cn('text-h6', 'text-display-3')).toBe('text-display-3');
  });

  it('lets the caller’s padding replace the component’s', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('lets the caller’s radius replace a shape role', () => {
    expect(cn('rounded-element', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-full', 'rounded-page')).toBe('rounded-page');
  });
});
