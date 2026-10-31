import { useCallback, useEffect, useRef, useState } from 'react';

/** Starts reading the next page this far before the end comes into view. */
const READ_AHEAD = '400px';

export type EndlessPage<Item> = {
  readonly items: readonly Item[];
  readonly nextCursor: string | null;
};

/**
 * A list that reads its next page as its end comes near. What has been read is held here rather
 * than taken from `initialPage` on every render, because opening a card changes the address and
 * reads the first page again, and that must not move cards under the person. Put `endRef` on an
 * element after the last item.
 *
 * `readNext` answers `null` when the page could not be read. It must keep its identity between
 * renders, or the list watches for its end all over again.
 */
export function useEndlessList<Item>(
  initialPage: EndlessPage<Item>,
  readNext: (cursor: string) => Promise<EndlessPage<Item> | null>,
) {
  const [items, setItems] = useState(initialPage.items);
  const [cursor, setCursor] = useState(initialPage.nextCursor);
  const [phase, setPhase] = useState<'idle' | 'reading' | 'failed'>('idle');
  const endRef = useRef<HTMLDivElement>(null);

  const readNextPage = useCallback(async () => {
    if (cursor === null) {
      return;
    }
    setPhase('reading');
    const page = await readNext(cursor);
    if (!page) {
      setPhase('failed');
      return;
    }
    setItems((read) => [...read, ...page.items]);
    setCursor(page.nextCursor);
    setPhase('idle');
  }, [cursor, readNext]);

  useEffect(() => {
    const end = endRef.current;
    if (!end || cursor === null || phase !== 'idle') {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          void readNextPage();
        }
      },
      { rootMargin: READ_AHEAD },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [cursor, phase, readNextPage]);

  return {
    items,
    phase,
    hasMore: cursor !== null,
    endRef,
    readNextPage,
  };
}
