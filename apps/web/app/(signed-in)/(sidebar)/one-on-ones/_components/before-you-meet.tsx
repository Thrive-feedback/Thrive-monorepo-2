import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react';
import { Fragment, useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { useOneOnOneAction } from '@/app/(signed-in)/(sidebar)/_lib/use-one-on-one-action';
import { BeforeYouMeetItem } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/before-you-meet-item';
import type { MeetingPeople } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/meeting-summary';
import {
  broughtFromOf,
  MEETING_CONTEXT_GROUPS,
  MEETING_CONTEXT_TABS,
  sourceKeyOf,
  topicFromContext,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/meeting-context.util';
import type {
  MeetingContextCard,
  MeetingContextTab,
  MeetingContextView,
  TopicBroughtFrom,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  addTopic,
  readMoreMeetingContext,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service';
import {
  describeDay,
  describeMeeting,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { Button } from '@/components/atoms/button';
import { Spinner } from '@/components/atoms/spinner';
import { Text } from '@/components/atoms/text';
import { Toggle } from '@/components/atoms/toggle';
import { InfoTip } from '@/components/molecules/info-tip';
import {
  sayNothingIsSent,
  useIsSampleData,
} from '@/components/organisms/sample-data-provider';
import { cn } from '@/lib/cn.util';

/** How many cards one page shows, so the agenda below stays in reach. */
const BEFORE_YOU_MEET_PAGE_SIZE = 5;

/** Each chip, pressed, in the colour of the cards it shows, as a Profile's chips are. */
const TAB_TONES: Readonly<
  Record<MeetingContextTab, 'primary' | 'secondary' | 'tertiary'>
> = {
  FEEDBACK: 'primary',
  KUDOS: 'secondary',
  BETWEEN: 'primary',
  SHARED: 'primary',
  OPEN_ASKS: 'tertiary',
};

const TAB_LABELS: Readonly<Record<MeetingContextTab, string>> = {
  FEEDBACK: 'Feedback',
  KUDOS: 'Kudos',
  BETWEEN: 'Between you two',
  SHARED: 'Shared with you',
  OPEN_ASKS: 'Open asks',
};

/** What each tab holds, said behind the "i" by the heading, so where a card comes from is never a guess. */
function captionOf(tab: MeetingContextTab, other: string): string {
  switch (tab) {
    case 'FEEDBACK':
      return `Feedback to ${other} that everyone in the Workspace reads.`;
    case 'KUDOS':
      return `Kudos that name ${other}.`;
    case 'BETWEEN':
      return `Feedback and Kudos you and ${other} gave each other, or that someone gave you both.`;
    case 'SHARED':
      return `Feedback to ${other} that someone chose to show you.`;
    case 'OPEN_ASKS':
      return 'Asks still waiting between you two, from either side, however old.';
  }
}

export type BeforeYouMeetProps = {
  workspaceId: string;
  oneOnOneId: string;
  /** The live meeting, or `null` before anybody has written to it: the first add opens it. */
  meetingId: string | null;
  context: MeetingContextView;
  people: MeetingPeople;
  /** Today on the schedule's clock, `YYYY-MM-DD`. */
  today: string;
  /** What is on the agenda already, brought from what is read here. */
  onAgenda: readonly TopicBroughtFrom[];
  /** The earliest meeting day skipped since the last one held, `YYYY-MM-DD`; `null` when none was. */
  skippedFrom: string | null;
};

/**
 * Before you meet (brain ADR-0063): the other person's Profile, for the reader, since the two last
 * met, while the meeting is prepared; once it starts, the agenda is what the two have before them. The same tabs as a Profile, in its two parts: what everyone sees, and what is for the reader.
 * Each tab counts what it holds for the period and shows it a page at a time, reading the next batch
 * when Next passes the last card loaded; Open asks holds every Ask still waiting, however old. Any
 * card can be brought onto the agenda, once.
 */
export function BeforeYouMeet({
  workspaceId,
  oneOnOneId,
  meetingId,
  context,
  people,
  today,
  onAgenda,
  skippedFrom,
}: BeforeYouMeetProps) {
  const { isPending, run } = useOneOnOneAction();
  const isSample = useIsSampleData();
  const [isFolded, setIsFolded] = useState(false);
  const firstWithItems =
    MEETING_CONTEXT_TABS.find((tab) => context.tabs[tab].count > 0) ?? null;
  const [chosen, setChosen] = useState<MeetingContextTab | null>(
    firstWithItems,
  );
  const [pages, setPages] = useState<
    Partial<Record<MeetingContextTab, number>>
  >({});
  // Batches read past the first, by tab, as Next reaches the end of what was loaded.
  const [more, setMore] = useState<
    Partial<
      Record<
        MeetingContextTab,
        {
          readonly items: readonly MeetingContextCard[];
          readonly nextCursor: string | null;
        }
      >
    >
  >({});
  const [isReading, startReading] = useTransition();
  // Marked at once, so a second press cannot add it again while the page reads the agenda back.
  // Each mark is let go once the agenda read back holds it, so the agenda alone says what is on
  // it from then on, and a topic taken off it can be added again.
  const [added, setAdded] = useState<readonly string[]>([]);
  // How many have gone onto the agenda from here: each one is said anew, even in the same words.
  const [announced, setAnnounced] = useState(0);
  const readBack = new Set(onAgenda.map(sourceKeyOf));
  if (added.some((key) => readBack.has(key))) {
    setAdded(added.filter((key) => !readBack.has(key)));
  }
  const ids = useId();
  const headingId = `${ids}-heading`;
  const bodyId = `${ids}-body`;

  const isFirst = context.lookback === 'FIRST_30_DAYS';
  const since = isFirst
    ? 'the last 30 days'
    : `since ${describeMeeting(context.since)}`;
  const onAgendaKeys = new Set([...readBack, ...added]);
  // A tab chosen before a read left it empty gives way to the first one that has something.
  const tab =
    chosen !== null && context.tabs[chosen].count > 0 ? chosen : firstWithItems;
  const shown = tab
    ? {
        count: context.tabs[tab].count,
        items: more[tab]?.items ?? context.tabs[tab].items,
        nextCursor:
          more[tab] === undefined
            ? context.tabs[tab].nextCursor
            : (more[tab]?.nextCursor ?? null),
      }
    : null;
  const page = tab ? (pages[tab] ?? 0) : 0;
  const pageCount = shown
    ? Math.max(
        1,
        Math.ceil(
          Math.max(shown.count, shown.items.length) / BEFORE_YOU_MEET_PAGE_SIZE,
        ),
      )
    : 1;
  const start = page * BEFORE_YOU_MEET_PAGE_SIZE;
  const visible =
    shown?.items.slice(start, start + BEFORE_YOU_MEET_PAGE_SIZE) ?? [];

  /** Turns the page, reading the next batch first when the page is past what was loaded. */
  function turnTo(next: number) {
    if (!tab || !shown) {
      return;
    }
    const needed = (next + 1) * BEFORE_YOU_MEET_PAGE_SIZE;
    if (needed <= shown.items.length || shown.nextCursor === null) {
      setPages((each) => ({ ...each, [tab]: next }));
      return;
    }
    const cursor = shown.nextCursor;
    // Sample data, as in the showcase, has no next batch to read.
    if (isSample) {
      sayNothingIsSent();
      return;
    }
    startReading(async () => {
      const batch = await readMoreMeetingContext(workspaceId, {
        aboutAccountId: people.otherAccountId,
        tab,
        since: context.since,
        cursor,
      });
      if (!batch) {
        toast.error('Couldn’t read the next page. Try again.');
        return;
      }
      setMore((each) => ({
        ...each,
        [tab]: {
          items: [...shown.items, ...batch.items],
          nextCursor: batch.nextCursor,
        },
      }));
      setPages((each) => ({ ...each, [tab]: next }));
    });
  }

  function add(card: MeetingContextCard) {
    const source = broughtFromOf(card);
    const key = sourceKeyOf(source);
    setAdded((keys) => [...keys, key]);
    run(
      () =>
        addTopic(
          workspaceId,
          oneOnOneId,
          meetingId,
          topicFromContext(card, people),
          source,
        ),
      {
        // No toast: the topic is seen landing on the agenda, scrolled into view. A screen reader,
        // which sees no motion, is told in words.
        onSuccess: () => setAnnounced((times) => times + 1),
        onRefused: () =>
          setAdded((keys) => keys.filter((each) => each !== key)),
      },
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-control border border-border-muted px-4 py-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-1">
          <Text as="h3" id={headingId} variant="subtitle-4">
            Before you meet{' '}
            <span className="font-normal text-body-3 text-fg-muted">
              {since}
            </span>
          </Text>
          {/* What the section holds, and that it shows nothing new, kept out of the way of the cards. */}
          <InfoTip
            about="Before you meet"
            words={`Only what you can already read in Thrive. ${people.otherName} sees the same about you.${tab ? ` ${captionOf(tab, people.otherName)}` : ''}`}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={!isFolded}
          aria-controls={bodyId}
          onClick={() => setIsFolded((folded) => !folded)}
        >
          {isFolded ? 'Show' : 'Hide'}
          <ChevronDownIcon
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform duration-150 motion-reduce:transition-none',
              !isFolded && 'rotate-180',
            )}
          />
        </Button>
      </div>

      <p role="status" className="sr-only">
        {announced > 0 && <span key={announced}>Added to the agenda</span>}
      </p>

      <div id={bodyId} hidden={isFolded} className="flex flex-col gap-3">
        {skippedFrom && !isFirst && (
          <Text
            as="p"
            variant="body-3"
            className="rounded-control bg-status-warning-surface px-3 py-2 text-status-warning-fg"
          >
            {`${describeDay(skippedFrom)} was skipped, so this goes back to your last meeting.`}
          </Text>
        )}

        {tab === null || shown === null ? (
          <div className="flex flex-col gap-1 rounded-control border border-border-default border-dashed px-4 py-3.5">
            <Text as="p" variant="body-2">
              {`Nothing new about ${people.otherName} ${isFirst ? 'in the last 30 days' : since}, and no open asks.`}
            </Text>
            <Text as="p" variant="body-3" tone="muted">
              {`Feedback only ${people.otherName} can read, or that wasn’t shared with you, never shows here.`}
            </Text>
          </div>
        ) : (
          <>
            {/* The Profile's chips in its two titled groups (ADR-0063): side by side with a rule from
                `2xl`, where the panel beside the list has room for both; stacked below. */}
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:gap-5">
              {MEETING_CONTEXT_GROUPS.map((group, index) => (
                <Fragment key={group.label}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="hidden w-px self-stretch bg-border-muted 2xl:block"
                    />
                  )}
                  <fieldset className="flex min-w-0 flex-col gap-2">
                    <legend className="contents">
                      <Text as="span" variant="subtitle-4">
                        {group.label}
                      </Text>
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {group.tabs.map((each) => {
                        const { count } = context.tabs[each];
                        return (
                          <Toggle
                            key={each}
                            variant="outline"
                            size="sm"
                            tone={TAB_TONES[each]}
                            className="gap-1.5 rounded-chip px-3"
                            pressed={each === tab}
                            disabled={count === 0}
                            onPressedChange={(pressed) => {
                              if (pressed) {
                                setChosen(each);
                              }
                            }}
                          >
                            {TAB_LABELS[each]}
                            <span className="tabular-nums">{count}</span>
                          </Toggle>
                        );
                      })}
                    </div>
                  </fieldset>
                </Fragment>
              ))}
            </div>

            <ul aria-label={TAB_LABELS[tab]} className="flex flex-col gap-1">
              {visible.map((card) => {
                const source = broughtFromOf(card);
                return (
                  <BeforeYouMeetItem
                    key={`${card.kind}:${card.id}`}
                    card={card}
                    people={people}
                    today={today}
                    isOnAgenda={onAgendaKeys.has(sourceKeyOf(source))}
                    isPending={isPending}
                    onAdd={() => add(card)}
                  />
                );
              })}
            </ul>

            {pageCount > 1 && (
              <nav
                aria-label={`${TAB_LABELS[tab]} pages`}
                className="flex items-center justify-end gap-1"
              >
                <Text
                  as="p"
                  variant="body-3"
                  tone="muted"
                  className="me-1 tabular-nums"
                >
                  {`${start + 1}–${start + visible.length} of ${Math.max(shown.count, shown.items.length)}`}
                </Text>
                {/* At either end, said so rather than disabled, so focus stays on it. */}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Previous page"
                  aria-disabled={page === 0 || undefined}
                  onClick={() => {
                    if (page > 0) {
                      turnTo(page - 1);
                    }
                  }}
                >
                  <ChevronLeftIcon aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Next page"
                  aria-disabled={
                    page >= pageCount - 1 || isReading || undefined
                  }
                  // While the next batch is read: busy, and the arrow turns, so a slow read is seen.
                  aria-busy={isReading || undefined}
                  onClick={() => {
                    if (page < pageCount - 1 && !isReading) {
                      turnTo(page + 1);
                    }
                  }}
                >
                  {isReading ? (
                    <Spinner aria-hidden="true" className="size-4" />
                  ) : (
                    <ChevronRightIcon aria-hidden="true" className="size-4" />
                  )}
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </section>
  );
}
