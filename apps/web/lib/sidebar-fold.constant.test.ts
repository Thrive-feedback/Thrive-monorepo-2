import { describe, expect, it } from 'vitest';
import { savedSidebarWidth, sidebarFoldOf } from './sidebar-fold.constant';

describe('sidebarFoldOf', () => {
  it('is a rail on a tablet until the person chooses', () => {
    expect(
      sidebarFoldOf({ saved: null, atXl: false, inSettings: false }),
    ).toEqual({ width: 'rail', locked: false });
  });

  it('is wide on a desktop until the person chooses', () => {
    expect(
      sidebarFoldOf({ saved: null, atXl: true, inSettings: false }),
    ).toEqual({ width: 'wide', locked: false });
  });

  it.each([
    ['widened on a tablet', 'wide', false],
    ['folded on a desktop', 'rail', true],
  ] as const)('keeps what the person chose: %s', (_case, saved, atXl) => {
    expect(sidebarFoldOf({ saved, atXl, inSettings: false }).width).toBe(saved);
  });

  it('holds the rail in Settings below xl, whatever was chosen, and says so', () => {
    expect(
      sidebarFoldOf({ saved: 'wide', atXl: false, inSettings: true }),
    ).toEqual({ width: 'rail', locked: true });
  });

  it('lets Settings keep the choice from xl, where there is room', () => {
    expect(
      sidebarFoldOf({ saved: 'wide', atXl: true, inSettings: true }),
    ).toEqual({ width: 'wide', locked: false });
  });
});

describe('savedSidebarWidth', () => {
  it.each([
    ['wide', 'wide'],
    ['rail', 'rail'],
    ['narrow', null],
    [null, null],
  ] as const)('reads %s as %s', (value, width) => {
    expect(savedSidebarWidth(value)).toBe(width);
  });
});
