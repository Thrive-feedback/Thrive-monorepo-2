import { describe, expect, it } from 'vitest';
import { countLabel } from './count-label.util';

describe('countLabel', () => {
  it('draws a count up to ninety-nine as it is', () => {
    expect(countLabel(1)).toBe('1');
    expect(countLabel(99)).toBe('99');
  });

  it('draws anything past ninety-nine as 99+', () => {
    expect(countLabel(100)).toBe('99+');
    expect(countLabel(1000)).toBe('99+');
  });
});
