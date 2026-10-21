type Tracked<T> = Promise<T> & { status?: 'fulfilled'; value?: T };

/**
 * Wraps a dynamic import so it is fetched once, whoever asks first, and can be fetched ahead of
 * need. A component reads it with React's `use`. Once it has arrived the promise says so, the way
 * React reads a settled promise, so `use` returns it at once instead of suspending: a suspended
 * view is held back for a beat before it shows, which is what fetching ahead is meant to avoid.
 * A failed fetch is forgotten, so the next read tries again.
 */
export function preloadable<T>(load: () => Promise<T>): () => Promise<T> {
  let loading: Tracked<T> | undefined;
  return () => {
    if (!loading) {
      const promise: Tracked<T> = load();
      promise.then(
        (value) => {
          promise.status = 'fulfilled';
          promise.value = value;
        },
        () => {
          loading = undefined;
        },
      );
      loading = promise;
    }
    return loading;
  };
}
