import { afterEach, describe, expect, it, vi } from 'vitest';
import { pinnedStyle, pinOf } from './page-pin.util';

/** A page in a screen that has scrolled, its boxes as the browser would measure them. */
function pageIn({
  pageTop,
  screenTop,
  scrollTop,
  paddingTop,
}: {
  pageTop: number;
  screenTop: number;
  scrollTop: number;
  paddingTop: string;
}) {
  const screen = document.createElement('div');
  const page = document.createElement('div');
  screen.append(page);
  screen.style.paddingTop = paddingTop;
  screen.scrollTop = scrollTop;
  Object.defineProperty(screen, 'scrollTop', { value: scrollTop });
  vi.spyOn(screen, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ y: screenTop, height: 900 }),
  );
  vi.spyOn(page, 'getBoundingClientRect').mockReturnValue(
    DOMRect.fromRect({ y: pageTop, height: 600 }),
  );
  return page;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('pinOf', () => {
  it('holds the page where it stands in its screen, its padding taken off, with how far it scrolled', () => {
    const page = pageIn({
      pageTop: 87.5,
      screenTop: 0,
      scrollTop: 20,
      paddingTop: '16px',
    });

    // 87.5 on the window, 20 scrolled away above it, less the screen's 16 of padding.
    expect(pinOf(page)).toEqual({ top: 91.5, scrollTop: 20, height: 600 });
  });

  it('is nothing for a page not in a screen', () => {
    expect(pinOf(document.createElement('div'))).toBeNull();
    expect(pinOf(null)).toBeNull();
  });
});

describe('pinnedStyle', () => {
  it('leaves the page to centre itself until a switch pins it', () => {
    expect(pinnedStyle(null)).toBeUndefined();
    expect(pinnedStyle({ top: 91.5, scrollTop: 20, height: 600 })).toEqual({
      marginTop: 91.5,
      marginBottom: 'auto',
      minHeight: 600,
    });
  });
});
