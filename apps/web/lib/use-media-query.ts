import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a media query matches now, kept up to date as the window changes. The server renders
 * as if it does not match, and React corrects it straight after hydrating.
 */
export function useMediaQuery(query: string): boolean {
  // Stable for a query, so a re-render does not unsubscribe and subscribe again.
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof matchMedia !== 'function') {
        return () => {};
      }
      const list = matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof matchMedia === 'function' && matchMedia(query).matches,
    () => false,
  );
}
