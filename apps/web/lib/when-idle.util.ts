/**
 * Runs `work` once the browser has nothing more pressing to do, and returns what cancels it, so
 * an effect can hand it straight back. Safari has no idle callback, so there it waits a moment
 * after the page settles instead.
 */
export function whenIdle(work: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const handle = window.requestIdleCallback(work);
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(work, 1000);
  return () => clearTimeout(handle);
}
