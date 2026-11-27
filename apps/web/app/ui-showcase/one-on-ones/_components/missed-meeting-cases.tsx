import { GripVerticalIcon, PlayIcon } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/cn.util';

/**
 * PROPOSED, not built: what a 1:1 shows when a meeting day passes without anyone pressing Start.
 * Drawn from the atoms and tokens the panel uses, but static: nothing here reads or writes a 1:1.
 * The rules, as agreed:
 *
 * - A meeting whose day passed unstarted is **overdue** until the next meeting day; either person
 *   may still start it late, and it counts as that day's meeting.
 * - When the next day comes and it was never started, it is **skipped**: its agenda (topics and
 *   template) moves to the new day, and Past meetings says so, worked out from the schedule.
 *   Skips in a row share one line.
 * - The schedule never moves: after a late meeting the next one is still the next day on it.
 * - Starting before a day counts as that day's meeting, early: never two in one round.
 * - Overdue is said on the page only; nobody is notified.
 * - A meeting held once is overdue for 7 days, then skipped, in History.
 */

type Step = {
  /** The word in the step's head, and its colour. */
  readonly word: string;
  readonly tone: 'brand' | 'warning';
  readonly when: string;
  readonly body: string;
  readonly action: 'Start meeting' | 'Finish' | null;
  readonly inProgress?: boolean;
};

type MissedCase = {
  readonly title: string;
  readonly today: string;
  /** Which rule the case shows. */
  readonly rule: string;
  readonly card: {
    readonly badge: { readonly label: string; readonly tone: BadgeTone } | null;
    readonly line: string;
    /** Where the card is listed. */
    readonly tab: 'Upcoming' | 'History';
  };
  readonly step: Step | null;
  readonly agenda?: readonly {
    readonly text: string;
    readonly source: string;
  }[];
  readonly past?: readonly {
    readonly label: string;
    readonly detail: string;
    readonly skipped?: boolean;
  }[];
};

const PREPARED = [
  { text: 'Launch retro', source: 'Added by You' },
  { text: 'Career path', source: 'Added by Mint' },
] as const;

const CASES: readonly MissedCase[] = [
  {
    title: '1. On the day',
    today: 'Thu 1 Dec',
    rule: 'The day the schedule meets: the whole of it, as a 1:1 is kept by the day.',
    card: {
      badge: { label: 'Today', tone: 'brand' },
      line: 'Weekly · Next Thu 1 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Preparing',
      tone: 'brand',
      when: 'Today',
      body: 'Add what you’d like to talk about. When you meet, either of you presses Start.',
      action: 'Start meeting',
    },
    agenda: PREPARED,
  },
  {
    title: '2. The day passed, the agenda written',
    today: 'Fri 2 Dec',
    rule: 'Overdue until the next meeting day, and either of you can still start it, late. Said on the page only.',
    card: {
      badge: { label: 'Overdue', tone: 'warning' },
      line: 'Weekly · Was Thu 1 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Overdue',
      tone: 'warning',
      when: 'Thu 1 Dec',
      body: 'You haven’t met yet. Start any time before Thu 8 Dec; after that, this agenda moves to Thu 8 Dec.',
      action: 'Start meeting',
    },
    agenda: PREPARED,
  },
  {
    title: '3. The day passed, nothing written',
    today: 'Sat 3 Dec',
    rule: 'The same, with the agenda it would open with: what was not reached last time.',
    card: {
      badge: { label: 'Overdue', tone: 'warning' },
      line: 'Weekly · Was Thu 1 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Overdue',
      tone: 'warning',
      when: 'Thu 1 Dec',
      body: 'You haven’t met yet. Start any time before Thu 8 Dec.',
      action: 'Start meeting',
    },
    agenda: [{ text: 'Hiring plan', source: 'From last time' }],
  },
  {
    title: '4. Meeting late',
    today: 'Sun 4 Dec',
    rule: 'A late start is Thu 1 Dec’s meeting, held on the 4th.',
    card: {
      badge: null,
      line: 'Meeting in progress',
      tab: 'Upcoming',
    },
    step: {
      word: 'In progress',
      tone: 'brand',
      when: 'Thu 1 Dec’s meeting, since 10:12',
      body: 'Tick each topic as you talk about it and note what you agreed.',
      action: 'Finish',
      inProgress: true,
    },
    agenda: PREPARED,
  },
  {
    title: '5. After a late meeting',
    today: 'Sun 4 Dec',
    rule: 'The schedule never moves: the next meeting is still Thu 8 Dec. Past meetings says when it was held.',
    card: {
      badge: null,
      line: 'Weekly · Next Thu 8 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Preparing',
      tone: 'brand',
      when: 'Thu 8 Dec',
      body: 'Add what you’d like to talk about. When you meet, either of you presses Start.',
      action: 'Start meeting',
    },
    past: [{ label: 'Thu 1 Dec', detail: 'Held Sun 4 Dec · 2 topics' }],
  },
  {
    title: '6. Meeting early',
    today: 'Mon 5 Dec',
    rule: 'Starting before the day is that day’s meeting, early; once finished, the next is Thu 15 Dec. Never two in one week.',
    card: {
      badge: null,
      line: 'Meeting in progress',
      tab: 'Upcoming',
    },
    step: {
      word: 'In progress',
      tone: 'brand',
      when: 'Thu 8 Dec’s meeting, early, since 09:40',
      body: 'Tick each topic as you talk about it and note what you agreed.',
      action: 'Finish',
      inProgress: true,
    },
  },
  {
    title: '7. The next day came: skipped',
    today: 'Thu 8 Dec',
    rule: 'Never started by the next meeting day, Thu 1 Dec is skipped. Its agenda, topics and template, moves to today.',
    card: {
      badge: { label: 'Today', tone: 'brand' },
      line: 'Weekly · Next Thu 8 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Preparing',
      tone: 'brand',
      when: 'Today',
      body: 'Carried from Thu 1 Dec, which you skipped. When you meet, either of you presses Start.',
      action: 'Start meeting',
    },
    agenda: [
      { text: 'Launch retro', source: 'From Thu 1 Dec' },
      { text: 'Career path', source: 'From Thu 1 Dec' },
    ],
    past: [{ label: 'Thu 1 Dec', detail: 'Skipped', skipped: true }],
  },
  {
    title: '8. Skipped weeks in a row',
    today: 'Thu 22 Dec',
    rule: 'Every meeting day passed without a meeting shows, worked out from the schedule; skips in a row share one line.',
    card: {
      badge: { label: 'Today', tone: 'brand' },
      line: 'Weekly · Next Thu 22 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Preparing',
      tone: 'brand',
      when: 'Today',
      body: 'Carried from Thu 1 Dec. When you meet, either of you presses Start.',
      action: 'Start meeting',
    },
    past: [
      { label: 'Thu 1 – Thu 15 Dec', detail: 'Skipped 3 weeks', skipped: true },
      { label: 'Thu 24 Nov', detail: 'Held · 3 topics' },
    ],
  },
  {
    title: '9. A meeting held once, missed',
    today: 'Fri 2 Dec',
    rule: 'Overdue for 7 days, and can still be started; Cancel meeting stays in the schedule menu.',
    card: {
      badge: { label: 'Overdue', tone: 'warning' },
      line: 'Once · Was Thu 1 Dec',
      tab: 'Upcoming',
    },
    step: {
      word: 'Overdue',
      tone: 'warning',
      when: 'Thu 1 Dec',
      body: 'You haven’t met yet. Start any time until Wed 7 Dec; after that it moves to History as skipped.',
      action: 'Start meeting',
    },
    agenda: PREPARED,
  },
  {
    title: '10. A meeting held once, skipped',
    today: 'Thu 8 Dec',
    rule: 'Seven days on, never started, it is over: in History, said as skipped, with nothing to do.',
    card: {
      badge: null,
      line: 'Skipped · it was set for Thu 1 Dec',
      tab: 'History',
    },
    step: null,
  },
];

/** The 1:1's card in the list, as it reads that day. */
function MockCard({ card }: { card: MissedCase['card'] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text as="p" variant="label" tone="muted">
        In {card.tab}
      </Text>
      <div className="flex items-center gap-3 rounded-control border border-border-muted bg-surface-base px-3 py-2.5">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-content-center rounded-full bg-action-neutral-surface text-body-3 text-fg-secondary"
        >
          MB
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <Text as="span" variant="subtitle-4">
              Mint Boonmee
            </Text>
            {card.badge && (
              <Badge tone={card.badge.tone}>{card.badge.label}</Badge>
            )}
          </span>
          <Text as="span" variant="body-3" tone="muted">
            {card.line}
          </Text>
        </div>
      </div>
    </div>
  );
}

/** The step at the top of Next meeting: where it stands, when, and what to press. */
function MockStep({ step }: { step: Step }) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-control border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6',
        step.inProgress
          ? 'border-action-primary-border bg-action-primary/8'
          : step.tone === 'warning'
            ? 'border-status-warning-border bg-status-warning-surface'
            : 'border-border-muted bg-surface-base',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Text as="p" variant="subtitle-3">
          <span
            className={cn(
              'font-medium',
              step.tone === 'warning'
                ? 'text-status-warning-active'
                : 'text-fg-accent',
            )}
          >
            {step.word}
          </span>
          <span className="text-fg-muted"> · </span>
          {step.when}
        </Text>
        <Text as="p" variant="body-3" tone="muted" className="max-w-prose">
          {step.body}
        </Text>
      </div>
      {step.action && (
        <Button
          variant="primary"
          tabIndex={-1}
          prefixIcon={
            step.action === 'Start meeting' ? (
              <PlayIcon aria-hidden="true" className="size-4" />
            ) : undefined
          }
        >
          {step.action}
        </Button>
      )}
    </div>
  );
}

/** The agenda's topics, as rows. */
function MockAgenda({ topics }: { topics: NonNullable<MissedCase['agenda']> }) {
  return (
    <ul className="flex flex-col">
      {topics.map((topic) => (
        <li
          key={topic.text}
          className="flex min-h-10 items-center gap-2 border-border-subtle border-b py-1.5 last:border-b-0"
        >
          <GripVerticalIcon
            aria-hidden="true"
            className="size-4 text-fg-muted"
          />
          <Text as="span" variant="body-1">
            {topic.text}
          </Text>
          <Text as="span" variant="body-3" tone="muted">
            {topic.source}
          </Text>
        </li>
      ))}
    </ul>
  );
}

/** Past meetings: held ones, and the days skipped, worked out from the schedule. */
function MockPast({ past }: { past: NonNullable<MissedCase['past']> }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text as="p" variant="label" tone="muted">
        Past meetings
      </Text>
      <ul className="flex flex-col divide-y divide-border-subtle rounded-control border border-border-muted">
        {past.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5"
          >
            <Text
              as="span"
              variant="subtitle-4"
              tone={row.skipped ? 'muted' : 'default'}
            >
              {row.label}
            </Text>
            <Text
              as="span"
              variant="body-3"
              tone={row.skipped ? 'warning' : 'muted'}
            >
              {row.detail}
            </Text>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Every case of a missed meeting, for a weekly 1:1 with Mint on Thursdays (and one held once), as a
 * proposal to agree on before it is built.
 */
export function MissedMeetingCases() {
  return (
    <ol className="flex max-w-3xl flex-col gap-10">
      {CASES.map((each) => (
        <li key={each.title}>
          <figure className="flex flex-col gap-4">
            <figcaption className="flex flex-col gap-0.5">
              <Text as="h3" variant="subtitle-3">
                {each.title}
                <Text as="span" variant="body-3" tone="muted">
                  {' '}
                  · today is {each.today}
                </Text>
              </Text>
              <Text as="p" variant="body-3" tone="muted">
                {each.rule}
              </Text>
            </figcaption>
            <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
              <MockCard card={each.card} />
              <div className="flex flex-col gap-3">
                {each.step && <MockStep step={each.step} />}
                {each.agenda && <MockAgenda topics={each.agenda} />}
                {each.past && <MockPast past={each.past} />}
              </div>
            </div>
          </figure>
        </li>
      ))}
    </ol>
  );
}
