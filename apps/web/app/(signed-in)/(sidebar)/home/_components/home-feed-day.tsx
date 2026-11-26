import {
  countWords,
  type FeedDaySection,
  nameDay,
} from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import {
  HOME_DAY_CARDS,
  HOME_DAY_MARGIN,
  HOME_DAY_MARGIN_STUCK,
  HOME_DAY_ROW,
  HOME_DAY_SCROLL_MARGIN,
} from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { Text } from '@/components/atoms/text';
import { FEED_CARD_KIND_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import type { HomeShow } from '@/lib/routes.constant';
import { HomeFeedEntry } from './home-feed-entry';

/** Where a day's section starts, for the ribbon to bring it into view. */
export function dayAnchorOf(day: string) {
  return `home-day-${day}`;
}

/** Where a day's heading is, for the ribbon to move the reader's focus to. */
export function dayHeadingOf(day: string) {
  return `home-day-${day}-heading`;
}

export type HomeFeedDayProps = {
  section: FeedDaySection;
  week: HomeWeekSummary | null;
  readerAccountId: string;
  show: HomeShow;
};

/**
 * One day of Home, as a diary keeps it: from `md` the date stands large in a margin on the left and
 * stays in view while the day's cards scroll past; on a phone it is a row above them that does the
 * same. A day of the week says how much it held in its kinds' own words. A day that held nothing is
 * said to have, so a quiet day reads as one rather than as something missing.
 */
export function HomeFeedDay({
  section,
  week,
  readerAccountId,
  show,
}: HomeFeedDayProps) {
  const name = nameDay(section.day, week);
  const isToday = section.day === week?.today;
  const quiet = section.kind === 'quiet';
  const counts =
    section.kind === 'day' && section.counts
      ? countWords(section.counts, week?.countsKudos ?? true).filter(
          ({ count }) => count > 0,
        )
      : [];

  return (
    // Plain, not a landmark: an endless list of named regions would bury the page's own. The
    // heading is what a screen reader moves by.
    <section
      id={dayAnchorOf(section.day)}
      className={cn(
        'border-border-subtle border-t',
        HOME_DAY_SCROLL_MARGIN,
        HOME_DAY_ROW,
        quiet ? 'py-5' : 'pt-4 pb-6 md:pt-12',
      )}
    >
      <div
        className={cn(
          HOME_DAY_MARGIN,
          HOME_DAY_MARGIN_STUCK,
          'z-10 flex items-baseline gap-x-2 gap-y-0.5 bg-surface-base max-md:sticky max-md:top-18 max-md:flex-wrap max-md:py-2',
          'md:flex-col md:items-start md:self-start md:bg-transparent',
        )}
      >
        <h3
          id={dayHeadingOf(section.day)}
          tabIndex={-1}
          className="flex items-baseline gap-2 md:flex-col md:items-start md:gap-0"
        >
          <Text
            as="span"
            variant="label"
            className={cn(
              'md:order-first',
              isToday ? 'text-fg-accent' : 'text-fg-secondary',
            )}
          >
            {name.label}
          </Text>
          <span
            className={cn(
              'font-display text-subtitle-display-2 md:text-display-4',
              quiet ? 'text-fg-muted' : 'text-fg-primary',
            )}
          >
            {name.numeral}
          </span>
          <Text as="span" variant="body-3" tone="muted">
            {name.detail}
          </Text>
        </h3>
        {counts.length > 0 && (
          <p className="flex gap-x-2 md:mt-2.5 md:flex-col">
            {counts.map(({ tone, words }) => (
              <Text
                key={tone}
                as="span"
                variant="body-3"
                className={cn('font-medium', FEED_CARD_KIND_INK[tone])}
              >
                {words}
              </Text>
            ))}
          </p>
        )}
      </div>
      {section.kind === 'quiet' ? (
        <Text
          variant="body-2"
          tone="muted"
          className={cn(HOME_DAY_CARDS, 'self-center max-md:pt-1')}
        >
          Nothing written on {name.weekday}.
        </Text>
      ) : (
        // From `md` the first card's small postcard has a note by hand rising above it, which the
        // room above the section clears; on a phone the note sits under the card instead.
        <ul className={cn(HOME_DAY_CARDS, 'flex flex-col gap-1.5 max-md:pt-2')}>
          {section.entries.map((entry) => (
            <li key={entry.id}>
              <HomeFeedEntry
                entry={entry}
                readerAccountId={readerAccountId}
                show={show}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
