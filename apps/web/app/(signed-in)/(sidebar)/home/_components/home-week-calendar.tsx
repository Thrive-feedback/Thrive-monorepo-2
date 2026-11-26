'use client';

import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { useIsHeldPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-held-past';
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import { cn } from '@/lib/cn.util';
import { useMediaQuery } from '@/lib/use-media-query';
import styles from './home-week-calendar.module.css';
import { WeekCard } from './home-week-card';

export type HomeWeekCalendarProps = {
  week: HomeWeekSummary;
  /** The strip whose foot leaves the window as the composer sticks: the card is used only once it has. */
  stuckMarkId: string;
};

/**
 * The week's ribbon made small, a card beside the composer once the composer has stuck and the band
 * has scrolled away with the ribbon, so a day can still be reached from anywhere in the list.
 *
 * At rest its room is shut and the composer keeps the column's width. As the composer sticks, the
 * room opens beside it and the card is revealed, never held part way by the scroll, from `md` only,
 * where the composer sticks, its columns widening as the page does. It can be pressed and reached by
 * Tab once the composer has stuck, and stays so until the page has scrolled back far enough to shut
 * the room again, so a scroll back and forth at the threshold does not flicker it. A phone has the strip under the heading instead (`HomeWeekStrip`).
 */
export function HomeWeekCalendar({ week, stuckMarkId }: HomeWeekCalendarProps) {
  const isStuck = useIsHeldPast(stuckMarkId);
  const isBesideComposer = useMediaQuery(MD_AND_UP);

  return (
    <div className={styles.room} data-shown={isStuck ? '' : undefined}>
      <WeekCard
        week={week}
        isShown={isStuck}
        isWatching={isStuck && isBesideComposer}
        fits="room"
        className={cn(
          styles.card,
          'flex flex-col justify-between gap-3 px-3 py-5',
        )}
      />
    </div>
  );
}
