import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import type { OneOnOne } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import { inListOrder } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one-state.util';
import { OneOnOneStrip } from '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-one-strip';
import { forgetListCollapsed } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-list-collapsed';
import type { Teammate } from '@/lib/feedback/teammate.type';

const ME = 'account-me';

function teammate(accountId: string, name: string): Teammate {
  return {
    accountId,
    name,
    displayName: name.split(' ')[0] ?? name,
    email: `${accountId}@acme.test`,
    photoUrl: null,
    slug: accountId,
  };
}

const TEAMMATES = [
  teammate('mint', 'Mint Boonmee'),
  teammate('tom', 'Tom Becker'),
  teammate('elena', 'Elena Rossi'),
  teammate('hugo', 'Hugo Martin'),
];

/** A 1:1 the reader sent to `other`, running weekly unless `overrides` say otherwise. */
function oneOnOne(
  id: string,
  other: string,
  overrides: Partial<OneOnOne> = {},
): OneOnOne {
  return {
    id,
    status: 'ACTIVE',
    startedByAccountId: ME,
    invitedAccountId: other,
    withAccountId: other,
    schedule: {
      cadence: 'WEEKLY',
      weekday: 4,
      startMinute: 600,
      lengthMinutes: 30,
      templateKey: 'weekly-check-in',
      startsOn: '2026-11-26',
    },
    inviteNote: null,
    suggestedAt: null,
    answerNote: null,
    nextMeetingAt: '2026-12-03T03:00:00.000Z',
    answeredAt: '2026-11-20T04:00:00.000Z',
    endedAt: null,
    createdAt: '2026-11-20T03:00:00.000Z',
    meetingInProgress: false,
    ...overrides,
  };
}

const runningWeekly = oneOnOne('1', 'mint');
const onceUpcoming = oneOnOne('2', 'tom', {
  schedule: {
    ...runningWeekly.schedule,
    cadence: 'ONCE',
    startsOn: '2026-12-04',
  },
});
const invitedWithNote = oneOnOne('3', 'elena', {
  status: 'INVITED',
  startedByAccountId: 'elena',
  invitedAccountId: ME,
  nextMeetingAt: null,
});
const declinedWithNote = oneOnOne('4', 'hugo', {
  status: 'DECLINED',
  nextMeetingAt: null,
  answerNote: 'Not this month.',
});

/** Thursday 3 Dec, the day `runningWeekly` meets on at 10:00 Bangkok time. */
const TODAY = '2026-12-03';

function strip(
  oneOnOnes: readonly OneOnOne[],
  selectedId: string,
  today: string,
) {
  return (
    <OneOnOneStrip
      oneOnOnes={inListOrder(oneOnOnes)}
      selectedId={selectedId}
      teammates={TEAMMATES}
      today={today}
    />
  );
}

/** Draws it, and returns how to draw it again as the page does once something changed. */
function draw(
  oneOnOnes: readonly OneOnOne[],
  selectedId: string,
  today = '2026-11-27',
) {
  const view = render(strip(oneOnOnes, selectedId, today));
  return (again: readonly OneOnOne[]) =>
    view.rerender(strip(again, selectedId, today));
}

beforeEach(() => {
  window.localStorage.removeItem('one-on-ones:list-collapsed');
  forgetListCollapsed();
});

describe('OneOnOneStrip', () => {
  it('has no tabs at all while everything is upcoming', () => {
    draw([runningWeekly, onceUpcoming], runningWeekly.id);

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByText('Mint Boonmee')).toBeVisible();
    expect(screen.getByText('Tom Becker')).toBeVisible();
  });

  it('shows only the tabs that hold something, with no counts, marking one waiting on the reader', () => {
    draw([runningWeekly, invitedWithNote], runningWeekly.id);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Upcoming',
      'Pending, some waiting on you',
    ]);
  });

  it('opens on the tab of the open 1:1, and moves between tabs', async () => {
    draw(
      [runningWeekly, invitedWithNote, declinedWithNote],
      declinedWithNote.id,
    );

    expect(screen.getByRole('tab', { name: /History/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Hugo Martin')).toBeVisible();

    await userEvent.click(screen.getByRole('tab', { name: /Pending/ }));

    expect(screen.getByText('Elena Rossi')).toBeVisible();
    expect(screen.queryByText('Hugo Martin')).not.toBeInTheDocument();
  });

  it('folds to faces only, and remembers it for this viewer', async () => {
    window.localStorage.removeItem('one-on-ones:list-collapsed');
    draw([runningWeekly, invitedWithNote], runningWeekly.id);

    const fold = screen.getAllByRole('button', {
      name: 'Fold the list of 1:1s',
    })[0];
    if (!fold) {
      throw new Error('No fold button');
    }
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(fold);

    expect(window.localStorage.getItem('one-on-ones:list-collapsed')).toBe('1');
    // The open list stays in the page below `lg`; folded, its faces are drawn beside it.
    const [show] = screen.getAllByRole('button', {
      name: 'Show the list of 1:1s',
    });
    if (!show) {
      throw new Error('No show button');
    }
    expect(show).toHaveAttribute('aria-expanded', 'false');
    // Grouped by status, each face says its status before the name.
    expect(
      screen.getByRole('list', { name: 'Needs your answer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Needs your answer – Elena Rossi' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /^Upcoming – / }),
    ).toBeInTheDocument();
    await userEvent.click(show);
    expect(window.localStorage.getItem('one-on-ones:list-collapsed')).toBe('0');
  });

  it('lists what is upcoming soonest first, the one meeting today marked Today', () => {
    const later = oneOnOne('5', 'hugo', {
      nextMeetingAt: '2026-12-10T03:00:00.000Z',
    });
    const sooner = oneOnOne('6', 'elena', {
      nextMeetingAt: '2026-12-01T03:00:00.000Z',
    });
    draw([later, runningWeekly, sooner], runningWeekly.id, TODAY);

    const names = screen
      .getAllByRole('link')
      .map((link) => link.textContent ?? '');
    expect(names[0]).toContain('Elena Rossi');
    expect(names[1]).toContain('Mint Boonmee');
    expect(names[2]).toContain('Hugo Martin');
    expect(names[1]).toContain('Today');
    expect(screen.getAllByText('Today')).toHaveLength(1);
  });

  it('opens folded for a viewer who folded it before', () => {
    window.localStorage.setItem('one-on-ones:list-collapsed', '1');
    draw([runningWeekly, invitedWithNote], runningWeekly.id);

    expect(
      screen.getByRole('link', { name: 'Upcoming – Mint Boonmee' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Show the list of 1:1s' })[0],
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows the list still when the tab it was on empties, as by answering the last invitation', async () => {
    const drawAgain = draw(
      [runningWeekly, invitedWithNote, declinedWithNote],
      invitedWithNote.id,
    );
    expect(screen.getByRole('tab', { name: /Pending/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    drawAgain([
      runningWeekly,
      { ...invitedWithNote, status: 'ACTIVE' },
      declinedWithNote,
    ]);

    expect(
      screen.queryByRole('tab', { name: /Pending/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Elena Rossi')).toBeVisible();
  });

  it('lists a meeting held once that is in progress past its slot under Upcoming, saying so', () => {
    const inProgress = oneOnOne('5', 'hugo', {
      schedule: {
        ...runningWeekly.schedule,
        cadence: 'ONCE',
        startsOn: '2026-11-26',
      },
      nextMeetingAt: null,
      meetingInProgress: true,
    });
    draw([runningWeekly, inProgress, declinedWithNote], inProgress.id);

    expect(screen.getByRole('tab', { name: /Upcoming/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Meeting in progress')).toBeVisible();
    expect(screen.queryByText(/^Met /)).not.toBeInTheDocument();
  });

  it('marks Upcoming when a 1:1 meets today, and Pending when an answer waits on the reader', () => {
    draw([runningWeekly, invitedWithNote], runningWeekly.id, TODAY);

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Upcoming, one meets today',
      'Pending, some waiting on you',
    ]);
  });
});
