import { useSyncExternalStore } from 'react';

/** Where the list remembers being folded, for this viewer only. */
export const COLLAPSED_KEY = 'one-on-ones:list-collapsed';

const listeners = new Set<() => void>();
/** What this tab chose, which holds even where storage is refused, as in a private window. */
let chosen: boolean | null = null;

function read(): boolean {
  if (chosen !== null) {
    return chosen;
  }
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function subscribe(listener: () => void): () => void {
  // Folded in another tab, it folds here too: what that tab stored wins over this tab's choice.
  const fromAnotherTab = () => {
    chosen = null;
    listener();
  };
  listeners.add(listener);
  window.addEventListener('storage', fromAnotherTab);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', fromAnotherTab);
  };
}

/** The server draws it open, as it cannot know what this browser remembers. */
function openOnTheServer(): boolean {
  return false;
}

/**
 * Whether the 1:1s list is folded to faces, and folding or opening it. Open by default; folded once
 * this viewer folds it, which the browser remembers. Read as the page hydrates rather than in an
 * effect after it, so a folded list does not show open first.
 */
export function useListCollapsed(): readonly [
  boolean,
  (next: boolean) => void,
] {
  const isCollapsed = useSyncExternalStore(subscribe, read, openOnTheServer);
  function setCollapsed(next: boolean) {
    chosen = next;
    try {
      window.localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Not remembered past this tab, which only costs folding it again next time.
    }
    for (const listener of listeners) {
      listener();
    }
  }
  return [isCollapsed, setCollapsed];
}

/** Forgets what this tab chose, so a test starts from what storage holds. */
export function forgetListCollapsed(): void {
  chosen = null;
}
