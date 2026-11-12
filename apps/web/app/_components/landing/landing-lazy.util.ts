/** A component fetched only once it is wanted. */
export type LazyComponent<T> = {
  /** The component, once it has arrived; until then, nothing. */
  current: () => T | undefined;
  /** Fetches it, or hands back the fetch already on its way. */
  fetch: () => Promise<T>;
};

/**
 * A component the page fetches only once someone reaches for it, so the page a visitor lands on
 * carries none of its code. It is kept once fetched, and a failed fetch is forgotten, so the next
 * reach tries again.
 *
 * By hand rather than through `next/dynamic`, which suspends the first time a component is drawn
 * even when its code has already arrived, and React holds a revealed suspense boundary back for
 * 300ms: every first press of a card waited that long for its dialog. A component already fetched
 * here is drawn in the same render as the press.
 */
export function lazyComponent<T>(load: () => Promise<T>): LazyComponent<T> {
  let arrived: T | undefined;
  let onItsWay: Promise<T> | undefined;
  return {
    current: () => arrived,
    fetch() {
      onItsWay ??= load().then(
        (component) => {
          arrived = component;
          return component;
        },
        (error: unknown) => {
          onItsWay = undefined;
          throw error;
        },
      );
      return onItsWay;
    },
  };
}

/**
 * Where there is no idle callback, as in Safari, how long to wait instead: past the page's first
 * paint and hydration, before a visitor has usually reached for anything.
 */
const NO_IDLE_CALLBACK_WAIT_MS = 1000;

/**
 * Runs `work` once the browser is idle, so it takes no time from what the visitor is doing; where
 * there is no idle callback, a second after now, which leaves the page's first moments alone.
 * Returns what cancels it.
 */
export function whenIdle(work: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(work);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(work, NO_IDLE_CALLBACK_WAIT_MS);
  return () => window.clearTimeout(id);
}
