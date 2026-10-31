import { type RefObject, useLayoutEffect, useState } from 'react';

/**
 * Whether an element's clamp is hiding any of its text, measured rather than guessed from a length,
 * because the same words fit a wide card and not a phone. It measures again when the width changes.
 * Pass `isClamped` as false while the clamp is off: nothing is hidden then, and the last answer holds.
 */
export function useIsCutOff(
  ref: RefObject<HTMLElement | null>,
  isClamped: boolean,
): boolean {
  const [isCutOff, setIsCutOff] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !isClamped) {
      return;
    }
    const measure = () =>
      setIsCutOff(element.scrollHeight > element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, isClamped]);

  return isCutOff;
}
