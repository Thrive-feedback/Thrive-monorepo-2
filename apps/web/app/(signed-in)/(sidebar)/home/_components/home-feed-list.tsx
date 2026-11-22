'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useEndlessList } from '@/app/(signed-in)/(sidebar)/_lib/use-endless-list';
import {
  readHomeFeedThroughDay,
  readNextHomeFeedPage,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-feed-actions.service';
import { FeedCardSkeleton } from '@/components/organisms/feed-card/feed-card-skeleton';
import { FeedPageFailed } from '@/components/organisms/feed-card/feed-page-failed';
import type { HomeFeedPage } from '@/lib/feedback/home-feed-item.type';
import type { HomeShow } from '@/lib/routes.constant';
import { groupFeedByDay } from '../_lib/feed-day.util';
import type { HomeWeek } from '../_lib/home-week.type';
import { useDayJump } from './home-day-jump';
import { dayAnchorOf, dayHeadingOf, HomeFeedDay } from './home-feed-day';

/**
 * How many times one press of a day reads on before it gives up. Each read is up to five pages on
 * the server, so this is far past any week a team writes.
 */
const MOST_READS_TO_A_DAY = 3;

export type HomeFeedListProps = {
  /** The page the server read. Later reads of it are ignored: see `useEndlessList`. */
  initialPage: HomeFeedPage;
  /** What the last seven days held, which names the days and says which held nothing. */
  week: HomeWeek;
  show: HomeShow;
};

function idOf(item: { readonly id: string }) {
  return item.id;
}

/** Brings a day into view and moves focus to its heading, gently unless motion is unwelcome. */
function bringIntoView(day: string) {
  const section = document.getElementById(dayAnchorOf(day));
  if (!section) {
    return;
  }
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(dayHeadingOf(day))?.focus({ preventScroll: true });
  section.scrollIntoView({
    block: 'start',
    behavior: calm ? 'auto' : 'smooth',
  });
}

/**
 * Home's cards in days, Feedback and Kudos together, reading the next page as the end of the list
 * comes near. The page keys this by filter, so changing the filter starts again.
 *
 * A press of a day on the ribbon is answered here: a day already read is brought into view, and one
 * further down is read on to first, several pages at a time on the server, then brought into view.
 */
export function HomeFeedList({ initialPage, week, show }: HomeFeedListProps) {
  const readNext = useCallback(
    (cursor: string) => readNextHomeFeedPage({ show, cursor }),
    [show],
  );
  const { items, phase, hasMore, endRef, readNextPage, appendFrom } =
    useEndlessList(initialPage, readNext, idOf);
  const sections = useMemo(
    () => groupFeedByDay(items, week, !hasMore),
    [items, week, hasMore],
  );

  const { requestedDay, finish } = useDayJump();
  const readsToTheDay = useRef(0);

  // A list that leaves, because the filter changed or the reader sent something, lets go of a press
  // it had not finished: the next list starts from its own first page.
  useEffect(() => finish, [finish]);

  useEffect(() => {
    if (requestedDay === null) {
      readsToTheDay.current = 0;
      return;
    }
    if (phase === 'reading') {
      // What is being read may bring the day in; the list drawing again looks once more.
      return;
    }
    if (phase === 'failed' && readsToTheDay.current > 0) {
      // A read for this press failed: the list offers to try again, and the press is over.
      finish();
      return;
    }
    if (sections.some((section) => section.day === requestedDay)) {
      bringIntoView(requestedDay);
      finish();
      return;
    }
    if (!hasMore || readsToTheDay.current >= MOST_READS_TO_A_DAY) {
      // Out of list, or out of reads: the furthest the list has come is where the day would be.
      const furthest = sections.at(-1);
      if (furthest) {
        bringIntoView(furthest.day);
      }
      finish();
      return;
    }
    readsToTheDay.current += 1;
    void appendFrom((cursor) =>
      readHomeFeedThroughDay({ show, cursor, day: requestedDay }),
    );
  }, [requestedDay, phase, sections, hasMore, appendFrom, finish, show]);

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <HomeFeedDay
          key={section.kind === 'quiet' ? `quiet-${section.day}` : section.day}
          section={section}
          week={week}
          readerAccountId={initialPage.readerAccountId}
          show={show}
        />
      ))}
      {phase === 'reading' && <FeedCardSkeleton />}
      {phase === 'failed' && <FeedPageFailed onRetry={readNextPage} />}
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}
