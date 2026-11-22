import { Skeleton, SkeletonRegion } from '@/components/atoms/skeleton';
import { Text } from '@/components/atoms/text';
import { FEED_CARD_KIND_INK } from '@/components/organisms/feed-card/feed-card-tone.constant';
import { cn } from '@/lib/cn.util';
import type { HomeShow } from '@/lib/routes.constant';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import { countWords, isQuiet } from '../_lib/feed-day.util';
import { readHomeWeek } from '../_lib/home-week.service';
import type { HomeWeek as HomeWeekView } from '../_lib/home-week.type';
import { HomeWeekRibbon } from './home-week-ribbon';

export type HomeWeekProps = {
  membership: CurrentMembership;
  show: HomeShow;
};

/** `a`, `a and b`, `a, b and c`. */
function joined(parts: readonly React.ReactNode[]) {
  return parts.flatMap((part, index) => [
    index === 0 ? '' : index === parts.length - 1 ? ' and ' : ', ',
    part,
  ]);
}

/** What the week held, as a sentence whose counts are words in their kind's colour. */
function WeekSentence({ week }: { week: HomeWeekView }) {
  if (isQuiet(week.totals)) {
    return (
      <Text variant="body-1" tone="muted">
        Nothing written in the last 7 days yet.
      </Text>
    );
  }
  // Only what the week held: "0 answers" says nothing a reader needs.
  const words = countWords(week.totals, week.countsKudos)
    .filter(({ count }) => count > 0)
    .map(({ tone, words: said }) => (
      <span key={tone} className={cn('font-medium', FEED_CARD_KIND_INK[tone])}>
        {said}
      </span>
    ));
  return (
    <Text variant="body-1" tone="muted">
      In the last 7 days: {joined(words)}.
    </Text>
  );
}

/** The week in the band: what it held, then its days, each a way to that day in the list. */
export async function HomeWeek({ membership, show }: HomeWeekProps) {
  const week = await readHomeWeek(membership, show);
  return (
    <div className="flex flex-col gap-5">
      <WeekSentence week={week} />
      <HomeWeekRibbon week={week} />
    </div>
  );
}

/** `HomeWeek` still loading, holding the room the sentence and the days will take. */
export function HomeWeekSkeleton() {
  return (
    <SkeletonRegion>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-6 w-full max-w-md max-md:h-12" />
        <div className="grid grid-cols-5 gap-1 md:grid-cols-7 md:gap-1.5">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton
              // A stand-in has no identity but its place.
              // biome-ignore lint/suspicious/noArrayIndexKey: see above
              key={index}
              className={cn(
                'h-20 rounded-control',
                index < 2 && 'max-md:hidden',
              )}
            />
          ))}
        </div>
      </div>
    </SkeletonRegion>
  );
}
