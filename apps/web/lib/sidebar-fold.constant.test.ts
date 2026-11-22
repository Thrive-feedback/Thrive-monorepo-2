import { afterEach, describe, expect, it, vi } from 'vitest';
import { MD_AND_UP, XL_AND_UP } from './breakpoint.constant';
import {
  SIDEBAR_INIT_SCRIPT,
  SIDEBAR_STORAGE_KEY,
  savedSidebarWidth,
  sidebarFoldOf,
} from './sidebar-fold.constant';

describe('sidebarFoldOf', () => {
  it('is wide on a desktop until the person chooses', () => {
    expect(sidebarFoldOf({ saved: null, atMd: true, atXl: true })).toEqual({
      width: 'wide',
      locked: false,
    });
  });

  it.each(['wide', 'rail'] as const)(
    'keeps what the person chose on a desktop: %s',
    (saved) => {
      expect(sidebarFoldOf({ saved, atMd: true, atXl: true })).toEqual({
        width: saved,
        locked: false,
      });
    },
  );

  it('folds to the rail on a tablet, even when the person widened it, and says so', () => {
    expect(sidebarFoldOf({ saved: 'wide', atMd: true, atXl: false })).toEqual({
      width: 'rail',
      locked: true,
    });
  });

  it('is wide on a phone, where it opens in the menu drawer, whatever was chosen', () => {
    expect(sidebarFoldOf({ saved: 'rail', atMd: false, atXl: false })).toEqual({
      width: 'wide',
      locked: true,
    });
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

describe('SIDEBAR_INIT_SCRIPT', () => {
  /** A window as wide as `atMd` and `atXl` say, which calls back whoever listens when told to. */
  function aWindowAs(width: { atMd: boolean; atXl: boolean }) {
    const listeners: (() => void)[] = [];
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query === XL_AND_UP
          ? width.atXl
          : query === MD_AND_UP && width.atMd;
      },
      addEventListener: (_type: string, listener: () => void) =>
        listeners.push(listener),
    }));
    return () => {
      for (const listener of listeners) {
        listener();
      }
    };
  }

  function drawn() {
    const root = document.documentElement;
    return {
      width: root.dataset.sidebar,
      locked: root.dataset.sidebarLocked !== undefined,
    };
  }

  afterEach(() => {
    const root = document.documentElement;
    delete root.dataset.sidebar;
    delete root.dataset.sidebarLocked;
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  const widths = [
    { atMd: false, atXl: false },
    { atMd: true, atXl: false },
    { atMd: true, atXl: true },
  ] as const;
  const saved = [null, 'wide', 'rail', 'junk'] as const;

  it.each(
    widths.flatMap((width) => saved.map((value) => [width, value] as const)),
  )('draws what sidebarFoldOf says, on %o with %s saved', (width, value) => {
    if (value !== null) {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, value);
    }
    aWindowAs({ ...width });

    new Function(SIDEBAR_INIT_SCRIPT)();

    expect(drawn()).toEqual(
      sidebarFoldOf({ saved: savedSidebarWidth(value), ...width }),
    );
  });

  it('draws it again as the window crosses a breakpoint', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'wide');
    const width = { atMd: true, atXl: true };
    const crossed = aWindowAs(width);
    new Function(SIDEBAR_INIT_SCRIPT)();
    expect(drawn()).toEqual({ width: 'wide', locked: false });

    width.atXl = false;
    crossed();

    expect(drawn()).toEqual({ width: 'rail', locked: true });
  });
});
