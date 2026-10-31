import { useEffect } from 'react';

/**
 * Tells `onPressAway` about a press on anything outside `keep`, a selector. Listened for only while
 * `isActive`: a dialog's content stays mounted after it closes, and a page-wide listener must not.
 */
export function usePressAway(
  isActive: boolean,
  keep: string,
  onPressAway: () => void,
) {
  useEffect(() => {
    if (!isActive) {
      return;
    }
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest(keep)) {
        return;
      }
      onPressAway();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isActive, keep, onPressAway]);
}
