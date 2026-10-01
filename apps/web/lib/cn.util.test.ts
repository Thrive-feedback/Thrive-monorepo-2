import { describe, expect, it } from 'vitest';
import { cn } from './cn.util';

describe('cn', () => {
  it('keeps a type role and a text colour together', () => {
    expect(cn('text-body2', 'text-foreground-muted')).toBe(
      'text-body2 text-foreground-muted',
    );
  });

  it('lets a later type role replace an earlier one', () => {
    expect(cn('text-h6', 'text-display3')).toBe('text-display3');
  });

  it('lets the caller’s padding replace the component’s', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('lets the caller’s radius replace a shape role', () => {
    expect(cn('rounded-control', 'rounded-full')).toBe('rounded-full');
    expect(cn('rounded-full', 'rounded-floating')).toBe('rounded-floating');
  });
});
