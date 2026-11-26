'use client';

import { HangingBandFoot } from '@/app/(signed-in)/(sidebar)/_components/hanging-band';
import { PAGE_COLUMN_WIDTH } from '@/app/(signed-in)/(sidebar)/_lib/page-column.constant';
import {
  HOME_WEEK_STRIP_FOOT,
  HOME_WEEK_STRIP_GROUND,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { useIsHeldPast } from '@/app/(signed-in)/(sidebar)/home/_lib/use-is-held-past';
import { MD_AND_UP } from '@/lib/breakpoint.constant';
import { cn } from '@/lib/cn.util';
import { useMediaQuery } from '@/lib/use-media-query';
import { WeekCard } from './home-week-card';

/** How each layer of the strip comes and goes, as the strip's group around them says it is shown. */
const FADES =
  'opacity-0 transition duration-medium ease-smooth-out group-data-shown/strip:opacity-100 motion-reduce:transition-none';

export type HomeWeekStripProps = {
  week: HomeWeekSummary;
  /** The strip whose foot leaves the window as this one sticks: it shows only once it has. */
  shownMarkId: string;
};

/**
 * The small week on a phone, where there is no room beside the composer: once the composer has
 * scrolled away under the heading, the week stays under the heading instead, the width of the
 * column, so a day can still be reached, and the day scrolled to seen, from anywhere in the list.
 * The band's foot comes back behind it, so it lies across the bites as the stuck composer does from
 * `md`, and the page's ground lies under the bites down to the week's foot, so the list does not
 * show around it. Untitled to the eye, its seven days are all it shows; it is still named for a
 * screen reader. All three fade in and out over the medium step, at once under reduced motion.
 * While it is not shown the week takes no presses and no Tab, and nothing of it stands in the way of
 * a press on what lies under it, such as the feed's filter. From `md` the card beside the composer
 * does this.
 */
export function HomeWeekStrip({ week, shownMarkId }: HomeWeekStripProps) {
  const isShown = useIsHeldPast(shownMarkId);
  const isBesideComposer = useMediaQuery(MD_AND_UP);

  return (
    // Says whether it is shown to the three layers, and draws no box of its own. The group is named,
    // since each day is a group of its own, and an unnamed one here would be pointed at with it.
    <div className="group/strip contents" data-shown={isShown ? '' : undefined}>
      <div aria-hidden="true" className={cn(HOME_WEEK_STRIP_GROUND, FADES)} />
      <HangingBandFoot className={cn(HOME_WEEK_STRIP_FOOT, FADES)} />
      <div
        className={cn(
          PAGE_COLUMN_WIDTH,
          'pointer-events-none relative group-data-shown/strip:pointer-events-auto',
        )}
      >
        <WeekCard
          week={week}
          isShown={isShown}
          isWatching={isShown && !isBesideComposer}
          fits="column"
          className={cn(
            '-translate-y-1 p-2 group-data-shown/strip:translate-y-0',
            FADES,
          )}
        />
      </div>
    </div>
  );
}
