import {
  countWords,
  isQuiet,
} from '@/app/(signed-in)/(sidebar)/home/_lib/feed-day.util';
import { RIBBON_DAYS_ON_A_PHONE } from '@/app/(signed-in)/(sidebar)/home/_lib/home-layout.constant';
import { readHomeWeekIfCounted } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.service';
import type { HomeWeekSummary } from '@/app/(signed-in)/(sidebar)/home/_lib/home-week.type';
import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { FEED_CARD_KIND_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import styles from './home-week.module.css';
import { HomeWeekCalendar } from './home-week-calendar';
import { HomeWeekRibbon } from './home-week-ribbon';

export type HomeWeekProps = {
  membership: CurrentMembership;
  show: HomeShow;
};

/** `a`, `a and b`, `a, b and c`, as every other list of words in the app is joined. */
const AND = new Intl.ListFormat('en-GB', { type: 'conjunction' });

export type WeekSentenceProps = {
  week: HomeWeekSummary;
};

/**
 * What the week held, as a sentence whose counts are words in their kind's colour. From `md` it fades
 * as it nears the heading stuck above it, as the ribbon does.
 */
function WeekSentence({ week }: WeekSentenceProps) {
  if (isQuiet(week.totals)) {
    return (
      <Text variant="body-1" tone="muted" className={styles.leaves}>
        Nothing written in the last 7 days yet.
      </Text>
    );
  }
  // Only what the week held: "0 answers" says nothing a reader needs.
  const held = countWords(week.totals, week.countsKudos).filter(
    ({ count }) => count > 0,
  );
  // The list's own joining words, with each count drawn in its kind's ink where it stands.
  const parts = AND.formatToParts(held.map(({ words }) => words));
  let next = 0;
  return (
    // Balanced, so the last count never stands alone on a phone's second line.
    <Text
      variant="body-1"
      tone="muted"
      className={cn('text-balance', styles.leaves)}
    >
      In the last 7 days:{' '}
      {parts.map((part, index) => {
        if (part.type === 'literal') {
          // The joining words have no identity but their place.
          // biome-ignore lint/suspicious/noArrayIndexKey: see above
          return <span key={index}>{part.value}</span>;
        }
        const kind = held[next++];
        return (
          <span
            key={kind?.tone ?? index}
            className={cn('font-medium', kind && FEED_CARD_KIND_INK[kind.tone])}
          >
            {part.value}
          </span>
        );
      })}
      .
    </Text>
  );
}

/** The week in the band: what it held, then its days, each a way to that day in the list. */
export async function HomeWeek({ membership, show }: HomeWeekProps) {
  const week = await readHomeWeekIfCounted(membership, show);
  if (!week) {
    // Not counted: the band keeps its heading, and the list below still holds every card.
    return null;
  }
  return (
    <div className="flex flex-col gap-5">
      <WeekSentence week={week} />
      <HomeWeekRibbon week={week} />
    </div>
  );
}

export type HomeStuckWeekProps = HomeWeekProps & {
  /** The line that leaves the window as the composer sticks. */
  stuckMarkId: string;
};

/**
 * The week again, small, beside the composer once it has stuck, read from the same one call as the
 * band's. Not counted, there is nothing to show, and the composer keeps the column's width.
 */
export async function HomeStuckWeek({
  membership,
  show,
  stuckMarkId,
}: HomeStuckWeekProps) {
  const week = await readHomeWeekIfCounted(membership, show);
  return week ? (
    <HomeWeekCalendar week={week} stuckMarkId={stuckMarkId} />
  ) : null;
}

/** `HomeWeek` still loading, holding the room the sentence and the days will take. */
export function HomeWeekSkeleton() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-6 w-full max-w-112 max-md:h-12" />
        <div className="grid grid-cols-5 gap-1 md:grid-cols-7 md:gap-1.5">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton
              // A stand-in has no identity but its place.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              key={index}
              className={cn(
                'h-20 rounded-control',
                index < 7 - RIBBON_DAYS_ON_A_PHONE && 'max-md:hidden',
              )}
            />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
