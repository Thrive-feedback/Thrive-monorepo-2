import { afterEach, describe, expect, it, vi } from 'vitest';
import { MD_AND_UP, XL_AND_UP } from './breakpoint.constant';
import {
  SIDEBAR_INIT_SCRIPT,
  SIDEBAR_STORAGE_KEY,
  SIDEBAR_TABLET_STORAGE_KEY,
  savedSidebarWidth,
  sidebarFoldOf,
} from './sidebar-fold.constant';

/** Nothing chosen on a tablet. */
const NONE_ON_A_TABLET = { savedOnTablet: null } as const;

describe('sidebarFoldOf', () => {
  it('is wide on a desktop until the person chooses', () => {
    expect(
      sidebarFoldOf({
        saved: null,
        ...NONE_ON_A_TABLET,
        atMd: true,
        atXl: true,
      }),
    ).toEqual({
      width: 'wide',
      locked: false,
    });
  });

  it.each(['wide', 'rail'] as const)(
    'keeps what the person chose on a desktop: %s',
    (saved) => {
      expect(
        sidebarFoldOf({ saved, ...NONE_ON_A_TABLET, atMd: true, atXl: true }),
      ).toEqual({
        width: saved,
        locked: false,
      });
    },
  );

  it('is the rail on a tablet until the person widens it there, whatever they chose on a desktop', () => {
    expect(
      sidebarFoldOf({
        saved: 'wide',
        ...NONE_ON_A_TABLET,
        atMd: true,
        atXl: false,
      }),
    ).toEqual({ width: 'rail', locked: false });
  });

  it.each(['wide', 'rail'] as const)(
    'keeps what the person chose on a tablet: %s',
    (savedOnTablet) => {
      expect(
        sidebarFoldOf({ saved: null, savedOnTablet, atMd: true, atXl: false }),
      ).toEqual({ width: savedOnTablet, locked: false });
    },
  );

  it('is wide on a phone, where it opens in the menu drawer, whatever was chosen', () => {
    expect(
      sidebarFoldOf({
        saved: 'rail',
        savedOnTablet: 'rail',
        atMd: false,
        atXl: false,
      }),
    ).toEqual({
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
    widths.flatMap((width) =>
      saved.flatMap((value) =>
        saved.map((onTablet) => [width, value, onTablet] as const),
      ),
    ),
  )(
    'draws what sidebarFoldOf says, on %o with %s saved and %s on a tablet',
    (width, value, onTablet) => {
      if (value !== null) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, value);
      }
      if (onTablet !== null) {
        localStorage.setItem(SIDEBAR_TABLET_STORAGE_KEY, onTablet);
      }
      aWindowAs({ ...width });

      new Function(SIDEBAR_INIT_SCRIPT)();

      expect(drawn()).toEqual(
        sidebarFoldOf({
          saved: savedSidebarWidth(value),
          savedOnTablet: savedSidebarWidth(onTablet),
          ...width,
        }),
      );
    },
  );

  it('draws it again as the window crosses a breakpoint', () => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, 'wide');
    const width = { atMd: true, atXl: true };
    const crossed = aWindowAs(width);
    new Function(SIDEBAR_INIT_SCRIPT)();
    expect(drawn()).toEqual({ width: 'wide', locked: false });

    width.atXl = false;
    crossed();
    expect(drawn()).toEqual({ width: 'rail', locked: false });

    width.atMd = false;
    crossed();
    expect(drawn()).toEqual({ width: 'wide', locked: true });
  });
});
