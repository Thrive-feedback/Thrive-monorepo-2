import { unstable_rethrow } from 'next/navigation';
import { useRef, useState } from 'react';
import type { KudosBoardPage } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.type';
import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';

type Held = {
  readonly items: readonly ReadKudos[];
  readonly nextCursor: string | null;
};

export type UseKudosBoardPagesOptions = {
  firstPage: KudosBoardPage;
  /** How many Kudos the count says there are, which the end of the list can correct. */
  count: number;
  /** How many cards a page shows, which changes with the width of the window. */
  perPage: number;
  /** `null` when the read failed. */
  readNext: (cursor: string) => Promise<KudosBoardPage | null>;
};

/** What has been read, cut into pages of the size showing now. */
function pagesOf(items: readonly ReadKudos[], perPage: number) {
  const pages: (readonly ReadKudos[])[] = [];
  for (let start = 0; start < items.length; start += perPage) {
    pages.push(items.slice(start, start + perPage));
  }
  return pages;
}

/**
 * The cards of the board read so far, and which of them are showing. They are kept as one list
 * rather than as pages, because how many a page shows follows the window while a read is always the
 * same size. A cursor only reaches forward, so every card read is kept and going back needs nothing
 * from the API. Where you are is the first card showing, so a window that changes width stays on
 * the same cards. Cards are read when somebody shows they are heading for them, and the page after
 * as they arrive, so a turn does not wait. `firstPage` is read once: the board is keyed by its first
 * Kudos, so a new one starts it again.
 */
export function useKudosBoardPages({
  firstPage,
  count,
  perPage,
  readNext,
}: UseKudosBoardPagesOptions) {
  const [held, setHeld] = useState<Held>(firstPage);
  const [firstShowing, setFirstShowing] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'reading' | 'failed'>('idle');
  const latest = useRef<Held>(firstPage);
  const reading = useRef<Promise<boolean> | null>(null);

  const index = Math.floor(firstShowing / perPage);
  const startOfNext = (index + 1) * perPage;
  const canGoBack = index > 0;
  const canGoOn = startOfNext < held.items.length || held.nextCursor !== null;

  async function readOnce(cursor: string) {
    let page: KudosBoardPage | null = null;
    try {
      page = await readNext(cursor);
    } catch (error) {
      // Being signed out rejects with a redirect, which is not a page that failed. Anything else,
      // such as the connection dropping, is one, and the board offers to try again.
      unstable_rethrow(error);
    }
    reading.current = null;
    if (!page) {
      return false;
    }
    latest.current = {
      items: [...latest.current.items, ...page.items],
      nextCursor: page.nextCursor,
    };
    setHeld(latest.current);
    return true;
  }

  /** Reads until this many cards are held or the list ends, once however often it is asked. */
  async function holdAtLeast(length: number): Promise<boolean> {
    while (latest.current.items.length < length) {
      const cursor = latest.current.nextCursor;
      if (cursor === null) {
        return true;
      }
      reading.current ??= readOnce(cursor);
      if (!(await reading.current)) {
        return false;
      }
    }
    return true;
  }

  /** Reads ahead for somebody on their way to the next page. A failure waits for them to arrive. */
  function readAhead() {
    void holdAtLeast(startOfNext + perPage);
  }

  async function goOn() {
    if (!canGoOn) {
      return;
    }
    if (latest.current.items.length <= startOfNext) {
      setPhase('reading');
    }
    if (!(await holdAtLeast(startOfNext + 1))) {
      setPhase('failed');
      return;
    }
    setPhase('idle');
    if (latest.current.items.length > startOfNext) {
      setFirstShowing(startOfNext);
      void holdAtLeast(startOfNext + 2 * perPage);
    }
  }

  function goBack() {
    if (canGoBack) {
      setPhase('idle');
      setFirstShowing((index - 1) * perPage);
    }
  }

  return {
    pages: pagesOf(held.items, perPage),
    index,
    phase,
    canGoBack,
    canGoOn,
    /** The count can lag behind a Kudos given just now, and the end of the list cannot. */
    pageTotal: canGoOn
      ? Math.max(Math.ceil(count / perPage), index + 2)
      : index + 1,
    readAhead,
    goOn,
    goBack,
  };
}
