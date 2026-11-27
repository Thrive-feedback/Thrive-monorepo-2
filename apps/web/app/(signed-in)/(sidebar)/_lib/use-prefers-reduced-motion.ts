import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(listener: () => void): () => void {
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', listener);
  return () => list.removeEventListener('change', listener);
}

function read(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know; it draws as if motion is fine, and the browser corrects it at once. */
function onTheServer(): boolean {
  return false;
}

/**
 * Whether the person asked their system for less motion, kept up to date if they change it. For
 * motion set inline, such as a dragged row's slide, which a CSS `motion-reduce:` class cannot reach.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, read, onTheServer);
}
