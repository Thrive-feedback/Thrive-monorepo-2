'use client';

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { OneOnOne } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import {
  groupOf,
  isMet,
  isOnce,
  ONE_ON_ONE_TABS,
  type OneOnOneGroup,
  type OneOnOneTab,
  tabOf,
  wasSuggested,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-state.util';
import { otherPersonOf } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-person.util';
import {
  CADENCE_WORDS,
  dayInBangkok,
  describeCalendarDay,
  describeDay,
  describeMeeting,
  leavesListOn,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-schedule.util';
import { useListCollapsed } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-list-collapsed';
import { Badge } from '@/components/atoms/badge';
import { StatusText } from '@/components/atoms/status-text';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/atoms/tabs';
import { Text } from '@/components/atoms/text';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/atoms/tooltip';
import { PhotoAvatar } from '@/components/molecules/photo-avatar';
import { cn } from '@/lib/cn.util';
import type { Teammate } from '@/lib/feedback/teammate.type';
import { OneOnOneLink } from './one-on-one-link';

export type OneOnOneStripProps = {
  /** In list order: `inListOrder` of the 1:1s. */
  oneOnOnes: readonly OneOnOne[];
  selectedId: string;
  teammates: readonly Teammate[];
  /** The tab it opens on; the open 1:1's own tab when not given. */
  initialTab?: OneOnOneTab;
  /**
   * Today on the schedule's clock, `YYYY-MM-DD`, from the server: a meeting on it is marked Today.
   * Given rather than read here, so the server and the browser draw the same list.
   */
  today: string;
};

/** Whether a running 1:1 meets on `today`. */
function meetsOn(oneOnOne: OneOnOne, today: string): boolean {
  return (
    groupOf(oneOnOne) === 'running' &&
    oneOnOne.nextMeetingAt !== null &&
    dayInBangkok(oneOnOne.nextMeetingAt) === today
  );
}

/**
 * What each group is called. Running needs no name: it is all the Upcoming tab holds, so its
 * heading is for screen readers only.
 */
const GROUP_NAMES: Readonly<Record<OneOnOneGroup, string>> = {
  answer: 'Needs your answer',
  running: 'Running',
  waiting: 'Waiting on them',
  declined: 'Declined',
  past: 'Ended',
};

const TAB_NAMES: Readonly<Record<OneOnOneTab, string>> = {
  upcoming: 'Upcoming',
  pending: 'Pending',
  history: 'History',
};

const TAB_ORDER: readonly OneOnOneTab[] = ['upcoming', 'pending', 'history'];

/**
 * The status a folded face says before the name. Running reads as its tab, Upcoming, or Today when
 * it meets today, or In progress while a meeting runs, as its card says; a once-only 1:1 that has
 * happened reads Met rather than Ended.
 */
function foldedStatusOf(
  oneOnOne: OneOnOne,
  group: OneOnOneGroup,
  today: string,
): string {
  if (group === 'running') {
    if (oneOnOne.meetingInProgress) {
      return 'In progress';
    }
    return meetsOn(oneOnOne, today) ? 'Today' : 'Upcoming';
  }
  if (group === 'past' && isMet(oneOnOne)) {
    return 'Met';
  }
  return GROUP_NAMES[group];
}

/**
 * The dots that say what needs the reader, the same on a tab and on a folded face: the yellow of
 * the "Waiting" status word, which reads on white and on dark alike, for an answer to give; plum,
 * the product's own, for a 1:1 that meets today, as its Today badge is.
 */
const MARK = {
  waiting: 'bg-status-warning-active',
  today: 'bg-action-primary',
} as const;

/** Only Upcoming is drawn empty, and only beside another tab: the others are hidden when empty. */
const NOTHING_UPCOMING =
  'Nothing is set yet. Create 1:1 to set a time with someone.';

/** What a card says under the name: where the 1:1 stands, in its voice, and when. */
function StateLine({
  oneOnOne,
  shortName,
}: {
  oneOnOne: OneOnOne;
  shortName: string;
}) {
  switch (groupOf(oneOnOne)) {
    case 'answer':
      // An invitation is the product's plum, as giving is.
      return (
        <span className="font-medium text-fg-accent">
          {wasSuggested(oneOnOne)
            ? 'Suggests another time'
            : isOnce(oneOnOne)
              ? 'Invites you, once'
              : 'Invites you'}
        </span>
      );
    case 'running':
      if (oneOnOne.meetingInProgress) {
        return (
          <span className="font-medium text-fg-accent">
            Meeting in progress
          </span>
        );
      }
      return (
        <>
          {isOnce(oneOnOne) ? 'Once' : CADENCE_WORDS[oneOnOne.schedule.cadence]}
          {oneOnOne.nextMeetingAt && (
            <span className="block tabular-nums">
              {isOnce(oneOnOne) ? '' : 'Next '}
              {describeMeeting(oneOnOne.nextMeetingAt)}
            </span>
          )}
        </>
      );
    case 'waiting':
      return <StatusText tone="warning">Waiting for {shortName}</StatusText>;
    case 'declined':
      return (
        <>
          Declined
          {oneOnOne.answeredAt && (
            <span className="block">
              Leaves {leavesListOn(oneOnOne.answeredAt)}
            </span>
          )}
        </>
      );
    default:
      return isMet(oneOnOne) ? (
        <>Met {describeDay(oneOnOne.schedule.startsOn)}</>
      ) : (
        <>
          Ended
          {oneOnOne.endedAt && ` ${describeCalendarDay(oneOnOne.endedAt)}`}
        </>
      );
  }
}

type CardProps = {
  oneOnOne: OneOnOne;
  teammates: readonly Teammate[];
  isOpen: boolean;
  group: OneOnOneGroup;
  today: string;
};

/**
 * One 1:1 in the list, all drawn alike: what it asks of the reader is said in its words, the plum of
 * "Invites you" for one to answer. What is over is quieter. The open one stands on the plum tint, and
 * one that meets today wears a Today badge beside the name.
 */
function Card({ oneOnOne, teammates, isOpen, group, today }: CardProps) {
  const person = otherPersonOf(oneOnOne, teammates);
  const isQuiet = group === 'declined' || group === 'past';
  return (
    <li className="shrink-0 snap-start">
      <OneOnOneLink
        oneOnOneId={oneOnOne.id}
        isOpen={isOpen}
        className={cn(
          'flex w-56 items-start gap-3 rounded-page border px-4 py-3 transition-colors duration-quick ease-smooth-out lg:w-full lg:rounded-control lg:px-3 lg:py-2.5',
          isOpen
            ? 'border-action-primary-border bg-action-primary-surface'
            : 'border-border-muted hover:bg-action-neutral-surface-hover lg:border-transparent',
        )}
      >
        <PhotoAvatar
          name={person.name}
          photoUrl={person.photoUrl}
          size="md"
          className={cn(isQuiet && 'opacity-70')}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'truncate text-subtitle-4',
                isQuiet ? 'text-fg-secondary' : 'text-fg-primary',
              )}
            >
              {person.name}
            </span>
            {meetsOn(oneOnOne, today) && (
              <Badge size="sm" tone="brand">
                Today
              </Badge>
            )}
          </span>
          <Text as="span" variant="body-3" tone="muted">
            <StateLine oneOnOne={oneOnOne} shortName={person.shortName} />
          </Text>
        </span>
      </OneOnOneLink>
    </li>
  );
}

/**
 * Everyone the person has a 1:1 with, in up to three tabs. **Upcoming** is where they spend their
 * time: what meets, soonest first. **Pending** holds the few waiting on an answer: an invitation to
 * them first, then theirs waiting on somebody else. **History** holds
 * what was turned down and what is over. Pending and History are hidden while empty, which is most of
 * the time, and with only Upcoming left there is no tab bar at all, just the list. It opens on the
 * open 1:1's tab. From `lg` it is a column beside the open 1:1, which the page scrolls on its own;
 * narrower, each tab is one row that scrolls sideways.
 *
 * Each card is a link, so the open one is in the address and a reload or a shared link opens it again.
 */
export function OneOnOneStrip({
  oneOnOnes,
  selectedId,
  teammates,
  initialTab,
  today,
}: OneOnOneStripProps) {
  const groupsOf = (each: OneOnOneTab) =>
    ONE_ON_ONE_TABS[each]
      .map((group) => ({
        group,
        items: oneOnOnes.filter((oneOnOne) => groupOf(oneOnOne) === group),
      }))
      .filter(({ items }) => items.length > 0);
  const countOf = (each: OneOnOneTab) =>
    groupsOf(each).reduce((sum, { items }) => sum + items.length, 0);
  const shown = TAB_ORDER.filter(
    (each) => each === 'upcoming' || countOf(each) > 0,
  );
  const selected = oneOnOnes.find((oneOnOne) => oneOnOne.id === selectedId);
  const opening = initialTab ?? (selected ? tabOf(selected) : 'upcoming');
  const [chosenTab, setTab] = useState<OneOnOneTab>(opening);
  // A tab emptied while the list is open, as by answering the last invitation, is no longer drawn:
  // the list shows the open 1:1's tab instead, or Upcoming.
  const tab = shown.includes(chosenTab)
    ? chosenTab
    : selected && shown.includes(tabOf(selected))
      ? tabOf(selected)
      : 'upcoming';
  const waitsOnReader = oneOnOnes.some(
    (oneOnOne) => groupOf(oneOnOne) === 'answer',
  );
  const meetsToday = oneOnOnes.some((oneOnOne) => meetsOn(oneOnOne, today));
  const [isCollapsed, setCollapsed] = useListCollapsed();

  function toggle() {
    setCollapsed(!isCollapsed);
  }

  const foldButton = (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={!isCollapsed}
      aria-label={
        isCollapsed ? 'Show the list of 1:1s' : 'Fold the list of 1:1s'
      }
      className="hidden size-8 shrink-0 place-content-center rounded-control text-fg-secondary transition-colors duration-quick ease-smooth-out hover:bg-action-neutral-surface-hover hover:text-fg-primary focus-visible:outline-2 focus-visible:outline-action-primary lg:grid"
    >
      {isCollapsed ? (
        <PanelLeftOpenIcon aria-hidden="true" className="size-4" />
      ) : (
        <PanelLeftCloseIcon aria-hidden="true" className="size-4" />
      )}
    </button>
  );
  // Named by the open 1:1 and the tab, so two lists on one page, as the showcase draws them, never
  // share ids.
  const headingId = (group: OneOnOneGroup) =>
    `one-on-ones-${group}-${selectedId}-${initialTab ?? 'open'}`;

  function groupsIn(each: OneOnOneTab) {
    const groups = groupsOf(each);
    if (groups.length === 0) {
      return (
        <Text as="p" variant="body-3" tone="muted" className="py-2">
          {NOTHING_UPCOMING}
        </Text>
      );
    }
    return (
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
        {groups.map(({ group, items }) => (
          <section
            key={group}
            aria-labelledby={headingId(group)}
            className="flex gap-3 lg:flex-col lg:gap-1.5"
          >
            <h2
              id={headingId(group)}
              className={cn(
                'sr-only',
                group !== 'running' &&
                  'lg:not-sr-only lg:mb-1 lg:text-fg-secondary lg:text-overline lg:uppercase',
              )}
            >
              {GROUP_NAMES[group]}
              <span className="sr-only">, {items.length}</span>
            </h2>
            <ul className="flex gap-3 lg:flex-col lg:gap-1.5">
              {items.map((oneOnOne) => (
                <Card
                  key={oneOnOne.id}
                  oneOnOne={oneOnOne}
                  teammates={teammates}
                  isOpen={oneOnOne.id === selectedId}
                  group={group}
                  today={today}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  // Folded, from `lg`: only the faces, grouped by where each 1:1 stands with a thin line between
  // the groups, the open one ringed in plum and one waiting on the reader marked. Each face says its
  // status before the name, on hover and to a screen reader. Narrower than `lg` the list is a row
  // already, so it never folds.
  const folded = isCollapsed && (
    <nav
      aria-label="Your 1:1s"
      className="hidden w-12 flex-col items-center gap-2 lg:flex"
    >
      {foldButton}
      {TAB_ORDER.flatMap(groupsOf).map(({ group, items }, index) => (
        <Fragment key={group}>
          {index > 0 && (
            <div aria-hidden="true" className="my-1 h-px w-6 bg-border-muted" />
          )}
          <ul
            aria-label={GROUP_NAMES[group]}
            className="flex flex-col items-center gap-2"
          >
            {items.map((oneOnOne) => {
              const person = otherPersonOf(oneOnOne, teammates);
              const isOpen = oneOnOne.id === selectedId;
              const toAnswer = group === 'answer';
              const isQuiet = tabOf(oneOnOne) === 'history';
              const label = `${foldedStatusOf(oneOnOne, group, today)} – ${person.name}`;
              return (
                <li key={oneOnOne.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="relative block">
                        <OneOnOneLink
                          oneOnOneId={oneOnOne.id}
                          isOpen={isOpen}
                          className={cn(
                            'block rounded-full p-0.5 transition-colors duration-quick ease-smooth-out',
                            isOpen
                              ? 'bg-action-primary-surface ring-2 ring-action-primary-border'
                              : 'hover:bg-action-neutral-surface-hover',
                          )}
                        >
                          <PhotoAvatar
                            name={person.name}
                            photoUrl={person.photoUrl}
                            size="md"
                            className={cn(isQuiet && 'opacity-60')}
                          />
                          <span className="sr-only">{label}</span>
                        </OneOnOneLink>
                        {(toAnswer || meetsOn(oneOnOne, today)) && (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute top-0 right-0 size-2.5 rounded-full border-2 border-surface-base',
                              toAnswer ? MARK.waiting : MARK.today,
                            )}
                          />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="right">{label}</TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </Fragment>
      ))}
    </nav>
  );
  // Folded, the full list still draws below `lg`, where it is a row.
  const openListClass = cn('lg:w-72', isCollapsed && 'lg:hidden');

  if (shown.length === 1) {
    return (
      <>
        {folded}
        <nav
          aria-label="Your 1:1s"
          className={cn('flex flex-col gap-2', openListClass)}
        >
          <div className="hidden justify-end lg:flex">{foldButton}</div>
          {groupsIn('upcoming')}
        </nav>
      </>
    );
  }

  return (
    <>
      {folded}
      <nav aria-label="Your 1:1s" className={openListClass}>
        <Tabs
          value={tab}
          onValueChange={(next) => {
            const chosen = TAB_ORDER.find((each) => each === next);
            if (chosen) {
              setTab(chosen);
            }
          }}
          className="gap-3"
        >
          {/* The underlined tabs, sharing the column's width so all of them fit and none scrolls
              sideways. No counts: the list under each says how many. A dot says what needs the
              reader: yellow on Pending for an answer waiting on them, plum on Upcoming for a 1:1
              that meets today, as the faces say when folded; each is said for a screen reader. */}
          {/* The fold button ends the tabs' own line, from `lg` where the list can fold. */}
          <div className="flex items-end gap-1">
            <TabsList aria-label="Which 1:1s" className="min-w-0 flex-1">
              {shown.map((each) => (
                <TabsTrigger
                  key={each}
                  value={each}
                  className="min-w-0 flex-1 justify-center gap-1.5 px-1"
                >
                  {TAB_NAMES[each]}
                  {each === 'pending' && waitsOnReader && (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn('size-1.5 rounded-full', MARK.waiting)}
                      />
                      <span className="sr-only">, some waiting on you</span>
                    </>
                  )}
                  {each === 'upcoming' && meetsToday && (
                    <>
                      <span
                        aria-hidden="true"
                        className={cn('size-1.5 rounded-full', MARK.today)}
                      />
                      <span className="sr-only">, one meets today</span>
                    </>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="pb-1">{foldButton}</div>
          </div>
          {shown.map((each) => (
            <TabsContent key={each} value={each}>
              {groupsIn(each)}
            </TabsContent>
          ))}
        </Tabs>
      </nav>
    </>
  );
}
