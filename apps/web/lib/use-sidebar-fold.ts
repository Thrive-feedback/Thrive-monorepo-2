import { useCallback, useSyncExternalStore } from 'react';
import { XL_AND_UP } from '@/lib/breakpoint.constant';
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

function atXl(): boolean {
  return typeof matchMedia === 'function' && matchMedia(XL_AND_UP).matches;
}

/**
 * Sets `data-sidebar` and `data-sidebar-locked` on `<html>` from the person's choice, the window and
 * whether the page is one of Settings'. The script before paint does the same on load
 * (`SIDEBAR_INIT_SCRIPT`); this runs when the client navigates in or out of Settings and when the
 * person presses the button, which no load follows.
 */
export function applySidebarFold(inSettings: boolean): void {
  const { width, locked } = sidebarFoldOf({
    saved: readSaved(),
    atXl: atXl(),
    inSettings,
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
 * Whether the sidebar is the rail of its icons, whether Settings holds it there, and a way to fold
 * or widen it. Both are read from `<html>` rather than held here, because the script before paint
 * sets them before hydration. The server renders it wide and unlocked, and React swaps in the real
 * values straight after hydrating; what is drawn follows the attribute in CSS, so nothing jumps.
 */
export function useSidebarFold(inSettings: boolean): {
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
    applySidebarFold(inSettings);
  }, [inSettings]);

  return { folded, locked, toggle };
}
