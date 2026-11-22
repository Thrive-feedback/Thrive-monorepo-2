import { useCallback, useSyncExternalStore } from 'react';
import { MD_AND_UP, XL_AND_UP } from '@/lib/breakpoint.constant';
import {
  SIDEBAR_STORAGE_KEY,
  type SidebarWidth,
  savedSidebarWidth,
  sidebarFoldOf,
} from '@/lib/sidebar-fold.constant';

function readSaved(): SidebarWidth | null {
  try {
    return savedSidebarWidth(localStorage.getItem(SIDEBAR_STORAGE_KEY));
  } catch {
    return null;
  }
}

function matches(query: string): boolean {
  return typeof matchMedia === 'function' && matchMedia(query).matches;
}

/**
 * Sets `data-sidebar` and `data-sidebar-locked` on `<html>` from the person's choice and the window.
 * The script before paint does the same on load and as the window crosses a breakpoint
 * (`SIDEBAR_INIT_SCRIPT`); this runs when the person presses the button, which no load follows.
 */
function applySidebarFold(): void {
  const { width, locked } = sidebarFoldOf({
    saved: readSaved(),
    atMd: matches(MD_AND_UP),
    atXl: matches(XL_AND_UP),
  });
  const root = document.documentElement;
  root.dataset.sidebar = width;
  if (locked) {
    root.dataset.sidebarLocked = '';
  } else {
    delete root.dataset.sidebarLocked;
  }
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-sidebar', 'data-sidebar-locked'],
  });
  return () => observer.disconnect();
}

function readFolded(): boolean {
  return document.documentElement.dataset.sidebar === 'rail';
}

function readLocked(): boolean {
  return document.documentElement.dataset.sidebarLocked !== undefined;
}

/**
 * Whether the sidebar is the rail of its icons, whether the window holds it at its width (below
 * `xl`), and a way to fold or widen it. Both are read from `<html>` rather than held here, because the script before paint
 * sets them before hydration. The server renders it wide and unlocked, and React swaps in the real
 * values straight after hydrating; what is drawn follows the attribute in CSS, so nothing jumps.
 */
export function useSidebarFold(): {
  folded: boolean;
  locked: boolean;
  toggle: () => void;
} {
  const folded = useSyncExternalStore(subscribe, readFolded, () => false);
  const locked = useSyncExternalStore(subscribe, readLocked, () => false);

  const toggle = useCallback(() => {
    const next: SidebarWidth = readFolded() ? 'wide' : 'rail';
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, next);
    } catch {
      // A browser that will not keep it still folds or widens now; it just forgets on reload.
    }
    applySidebarFold();
  }, []);

  return { folded, locked, toggle };
}
