import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  OneOnOne,
  OneOnOneTemplate,
} from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import type {
  Meeting,
  OneOnOneMeetings,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push, refresh }),
}));
const acceptOneOnOne = vi.fn();
const declineOneOnOne = vi.fn();
const endOneOnOne = vi.fn();
const suggestAnotherTime = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-actions.service',
  () => ({
    acceptOneOnOne: (...args: unknown[]) => acceptOneOnOne(...args),
    declineOneOnOne: (...args: unknown[]) => declineOneOnOne(...args),
    endOneOnOne: (...args: unknown[]) => endOneOnOne(...args),
    rescheduleOneOnOne: vi.fn(),
    suggestAnotherTime: (...args: unknown[]) => suggestAnotherTime(...args),
  }),
);

vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service',
  () => ({
    addTopic: vi.fn(),
    finishMeeting: vi.fn(async () => ({ ok: true })),
    removePreviewTopic: vi.fn(),
    removeTopic: vi.fn(),
    reorderPreviewTopics: vi.fn(),
    reorderTopics: vi.fn(),
    startMeeting: vi.fn(),
    updateTopic: vi.fn(),
  }),
);

vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

const { OneOnOnePanel } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_components/one-on-one-panel'
);

const ME = 'account-me';
const MINT = 'account-mint';
const WORKSPACE_ID = 'workspace-acme';

const TEAMMATES: Teammate[] = [
  {
    accountId: MINT,
    name: 'Mint Boonmee',
    displayName: 'Mint',
    email: 'mint@acme.test',
    photoUrl: null,
    slug: 'mint',
  },
];

const TEMPLATES: OneOnOneTemplate[] = [
  {
    key: 'weekly-check-in',
    scope: 'THRIVE',
    changeable: false,
    name: 'Weekly check-in',
    suggestedWhen: 'The default for every 1:1',
    questions: ['What went well this week?', "What's in your way?"],
  },
];

const SCHEDULE = {
  cadence: 'WEEKLY',
  weekday: 4,
  startMinute: 600,
  lengthMinutes: 30,
  templateKey: 'weekly-check-in',
  templateName: 'Weekly check-in',
  startsOn: '2026-11-26',
} as const;

function oneOnOne(overrides: Partial<OneOnOne>): OneOnOne {
  return {
    id: '0196b4c8-0000-7000-8000-000000000001',
    status: 'ACTIVE',
    startedByAccountId: ME,
    invitedAccountId: MINT,
    withAccountId: MINT,
    schedule: SCHEDULE,
    inviteNote: null,
    suggestedAt: null,
    answerNote: null,
    nextMeetingAt: '2026-12-03T03:00:00.000Z',
    answeredAt: null,
    endedAt: null,
    createdAt: '2026-11-20T03:00:00.000Z',
    meetingInProgress: false,
    ...overrides,
  };
}

function panel(shown: OneOnOne, meetings?: OneOnOneMeetings) {
  return (
    <OneOnOnePanel
      oneOnOne={shown}
      workspaceId={WORKSPACE_ID}
      teammates={TEAMMATES}
      templates={TEMPLATES}
      meetings={meetings}
    />
  );
}

/** Draws it, and returns how to draw it again as the page does once something changed. */
function draw(shown: OneOnOne, meetings?: OneOnOneMeetings) {
  const view = render(panel(shown, meetings));
  return (again: OneOnOne, againMeetings?: OneOnOneMeetings) =>
    view.rerender(panel(again, againMeetings));
}

/** A meeting the two finished, with one topic talked about. */
const FINISHED: Meeting = {
  id: '0196b4c8-0000-7000-8000-0000000000a1',
  state: 'FINISHED',
  templateKey: 'weekly-check-in',
  occursAt: '2026-11-26T03:00:00.000Z',
  startedAt: '2026-11-26T03:00:00.000Z',
  startedByAccountId: ME,
  finishedAt: '2026-11-26T03:30:00.000Z',
  finishedByAccountId: MINT,
  topics: [
    {
      id: '0196b4c8-0000-7000-8000-0000000000b1',
      text: 'Launch retro',
      source: 'CARRIED',
      authorAccountId: null,
      position: 0,
      notes: 'Shipped on time',
      notesUpdatedAt: '2026-11-26T03:10:00.000Z',
      notesUpdatedByAccountId: ME,
      discussedAt: '2026-11-26T03:10:00.000Z',
    },
  ],
};

const NOTHING_NEXT = {
  meeting: null,
  carried: [],
  templateQuestions: ['What went well this week?'],
  templateName: 'Weekly check-in',
};

beforeEach(() => {
  push.mockClear();
  refresh.mockClear();
  acceptOneOnOne.mockReset().mockResolvedValue({ ok: true });
  declineOneOnOne.mockReset().mockResolvedValue({ ok: true });
  endOneOnOne.mockReset().mockResolvedValue({ ok: true });
  suggestAnotherTime.mockReset().mockResolvedValue({ ok: true });
});

const SCHEDULE_NEXT = '2026-12-03T03:00:00.000Z';

/** A meeting held just once, on Wednesday 2 December at 11:00. */
const ONCE = {
  ...SCHEDULE,
  cadence: 'ONCE',
  weekday: 3,
  startMinute: 660,
  startsOn: '2026-12-02',
} as const;

describe('OneOnOnePanel', () => {
  it('shows a running 1:1: when it next meets and what its agenda opens with', () => {
    draw(oneOnOne({}));

    expect(screen.getByRole('heading', { name: 'Mint Boonmee' })).toBeVisible();
    expect(
      screen.getByText('Weekly on Thursday at 10:00, 30 minutes'),
    ).toBeVisible();
    expect(screen.getByText('Thu 3 Dec, 10:00')).toBeVisible();
    expect(screen.getByText('What went well this week?')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Change schedule' }),
    ).toBeVisible();
  });

  it('gives both people the same controls, whoever sent the invitation', () => {
    draw(oneOnOne({ startedByAccountId: MINT, invitedAccountId: ME }));

    expect(
      screen.getByRole('button', { name: 'Change schedule' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'End schedule' })).toBeVisible();
    expect(
      screen.queryByText('What you each see before a meeting'),
    ).not.toBeInTheDocument();
  });

  it('puts an invitation to the person, with its note, and accepts it', async () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        startedByAccountId: MINT,
        invitedAccountId: ME,
        nextMeetingAt: null,
        inviteNote: 'How the launch went',
      }),
    );

    expect(screen.getByText('Invites you')).toBeVisible();
    expect(screen.getByText('How the launch went')).toBeVisible();
    expect(screen.getByText('Mint wrote')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(acceptOneOnOne).toHaveBeenCalledExactlyOnceWith(
      WORKSPACE_ID,
      '0196b4c8-0000-7000-8000-000000000001',
    );
    // The accept read the page again on the server; it is not read twice.
    expect(refresh).not.toHaveBeenCalled();
  });

  it('gives focus to the heading when the button pressed goes with the change', async () => {
    const invited = oneOnOne({
      status: 'INVITED',
      startedByAccountId: MINT,
      invitedAccountId: ME,
      nextMeetingAt: null,
    });
    const drawAgain = draw(invited);
    await userEvent.click(screen.getByRole('button', { name: 'Accept' }));
    const pressed = document.activeElement;
    if (pressed instanceof HTMLElement) {
      // Accept goes with the invitation, and focus with it.
      pressed.blur();
    }

    drawAgain({ ...invited, status: 'ACTIVE', nextMeetingAt: SCHEDULE_NEXT });

    expect(screen.getByRole('heading', { name: 'Mint Boonmee' })).toHaveFocus();
  });

  it('declines an invitation only after saying what the sender will see, with a note', async () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        startedByAccountId: MINT,
        invitedAccountId: ME,
        nextMeetingAt: null,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Decline Mint’s invitation?',
    });
    expect(declineOneOnOne).not.toHaveBeenCalled();
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'A note for Mint' }),
      'Next month?',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Decline' }),
    );

    expect(declineOneOnOne).toHaveBeenCalledExactlyOnceWith(
      WORKSPACE_ID,
      '0196b4c8-0000-7000-8000-000000000001',
      'Next month?',
    );
  });

  it('lets whoever sent one take it back while it waits, once they confirm', async () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        nextMeetingAt: null,
        inviteNote: 'How the launch went',
      }),
    );

    expect(screen.getByText('Waiting')).toBeVisible();
    expect(screen.getByText('You wrote')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Withdraw invitation' }),
    );
    expect(endOneOnOne).not.toHaveBeenCalled();
    await userEvent.click(
      within(
        await screen.findByRole('dialog', {
          name: 'Withdraw your invitation to Mint?',
        }),
      ).getByRole('button', { name: 'Withdraw' }),
    );

    expect(endOneOnOne).toHaveBeenCalledOnce();
  });

  it('says quietly that a 1:1 was turned down, with the note and when it leaves', () => {
    draw(
      oneOnOne({
        status: 'DECLINED',
        nextMeetingAt: null,
        answeredAt: '2026-11-26T03:00:00.000Z',
        answerNote: 'Next month?',
      }),
    );

    expect(
      screen.getByText(/Declined your invitation on 26 Nov/),
    ).toBeVisible();
    expect(screen.getByText('Next month?')).toBeVisible();
    expect(screen.getByText(/leaves your list on 10 Dec/)).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps an ended 1:1 to look back on, with nothing to do', () => {
    draw(
      oneOnOne({
        status: 'ENDED',
        nextMeetingAt: null,
        endedAt: '2026-11-26T03:00:00.000Z',
      }),
    );

    expect(screen.getByText(/Schedule ended on 26 Nov/)).toBeVisible();
    expect(
      screen.getByText(
        'No more meetings are kept, and none was finished in it.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows an ended 1:1’s past meetings, as its copy promises', () => {
    draw(
      oneOnOne({
        status: 'ENDED',
        nextMeetingAt: null,
        endedAt: '2026-11-26T03:00:00.000Z',
      }),
      { next: NOTHING_NEXT, past: [FINISHED] },
    );

    expect(
      screen.getByRole('heading', { name: /Past meetings/ }),
    ).toBeVisible();
    expect(screen.getByText('Thu 26 Nov')).toBeVisible();
    expect(screen.getByText(/10:00–10:30/)).toBeVisible();
    expect(screen.queryByText(/private notes/)).not.toBeInTheDocument();
  });

  it('keeps a one-time meeting that ran past its slot open to finish', () => {
    draw(
      oneOnOne({
        schedule: ONCE,
        nextMeetingAt: null,
        meetingInProgress: true,
      }),
      {
        next: {
          ...NOTHING_NEXT,
          meeting: {
            ...FINISHED,
            state: 'IN_PROGRESS',
            finishedAt: null,
            finishedByAccountId: null,
          },
        },
        past: [],
      },
    );

    expect(screen.getByRole('button', { name: 'Finish' })).toBeVisible();
  });

  it('gives focus to the heading once Finish and share takes its button away', async () => {
    const inProgress: Meeting = {
      ...FINISHED,
      state: 'IN_PROGRESS',
      finishedAt: null,
      finishedByAccountId: null,
    };
    const running = oneOnOne({});
    const drawAgain = draw(running, {
      next: { ...NOTHING_NEXT, meeting: inProgress },
      past: [],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Finish this meeting?',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Finish and share' }),
    );
    const pressed = document.activeElement;
    if (pressed instanceof HTMLElement) {
      pressed.blur();
    }

    drawAgain(running, { next: NOTHING_NEXT, past: [FINISHED] });

    expect(screen.getByRole('heading', { name: 'Mint Boonmee' })).toHaveFocus();
  });

  it('opens Change schedule on the schedule as it now stands, after an edit left by Cancel', async () => {
    const running = oneOnOne({});
    const drawAgain = draw(running);
    await userEvent.click(
      screen.getByRole('button', { name: 'Change schedule' }),
    );
    let dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Time 10:00' }),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );

    // Mint moved it to 11:00, and the page read it again.
    drawAgain({ ...running, schedule: { ...SCHEDULE, startMinute: 660 } });
    await userEvent.click(
      screen.getByRole('button', { name: 'Change schedule' }),
    );
    dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByRole('button', { name: 'Time 11:00' }),
    ).toBeVisible();
  });

  it('gives focus back to what opened a dialog closed without acting', async () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        startedByAccountId: MINT,
        invitedAccountId: ME,
        nextMeetingAt: null,
      }),
    );

    const decline = screen.getByRole('button', { name: 'Decline' });
    await userEvent.click(decline);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Not now' }),
    );

    await waitFor(() => expect(decline).toHaveFocus());
  });

  it('gives focus back to Change schedule after Cancel', async () => {
    draw(oneOnOne({}));

    const change = screen.getByRole('button', { name: 'Change schedule' });
    await userEvent.click(change);
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel' }),
    );

    await waitFor(() => expect(change).toHaveFocus());
  });

  it('ends a schedule only once the person confirms', async () => {
    draw(oneOnOne({}));

    await userEvent.click(screen.getByRole('button', { name: 'End schedule' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'End your schedule with Mint?',
    });
    expect(endOneOnOne).not.toHaveBeenCalled();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'End schedule' }),
    );

    expect(endOneOnOne).toHaveBeenCalledExactlyOnceWith(
      WORKSPACE_ID,
      '0196b4c8-0000-7000-8000-000000000001',
    );
  });

  it('cancels a meeting held once only once the person confirms', async () => {
    draw(
      oneOnOne({ schedule: ONCE, nextMeetingAt: '2026-12-02T04:00:00.000Z' }),
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Cancel meeting' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Cancel your meeting with Mint?',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Cancel meeting' }),
    );

    expect(endOneOnOne).toHaveBeenCalledExactlyOnceWith(
      WORKSPACE_ID,
      '0196b4c8-0000-7000-8000-000000000001',
    );
  });

  it('runs a meeting held once with its own controls: change the time, or cancel it', () => {
    draw(
      oneOnOne({ schedule: ONCE, nextMeetingAt: '2026-12-02T04:00:00.000Z' }),
    );

    expect(screen.getByText('Meeting')).toBeVisible();
    expect(
      screen.getByText('Once, on Wed 2 Dec at 11:00, 30 minutes'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Change time' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Cancel meeting' }),
    ).toBeVisible();
  });

  it('says a meeting held once has met, with nothing to do', () => {
    draw(oneOnOne({ schedule: ONCE, nextMeetingAt: null }));

    expect(screen.getByText('Met on Wed 2 Dec at 11:00')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('puts another time sent back to the person as a suggestion to accept', () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        startedByAccountId: MINT,
        invitedAccountId: ME,
        nextMeetingAt: null,
        suggestedAt: '2026-11-25T08:00:00.000Z',
        inviteNote: 'Tuesday suits me better.',
      }),
    );

    expect(screen.getByText('Suggests another time')).toBeVisible();
    expect(
      screen.getByText(
        'Mint can’t make the time you sent, and suggests another.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Tuesday suits me better.')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Accept this time' }),
    ).toBeVisible();
  });

  it('turns Decline into another time, sent back with a note', async () => {
    draw(
      oneOnOne({
        status: 'INVITED',
        startedByAccountId: MINT,
        invitedAccountId: ME,
        nextMeetingAt: null,
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Decline' }));
    await userEvent.click(
      await screen.findByRole('button', {
        name: /Suggest another time instead/,
      }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Suggest another time to Mint',
    });
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'A note for Mint' }),
      'Tuesday?',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Send suggestion' }),
    );

    expect(declineOneOnOne).not.toHaveBeenCalled();
    expect(suggestAnotherTime).toHaveBeenCalledExactlyOnceWith(
      WORKSPACE_ID,
      '0196b4c8-0000-7000-8000-000000000001',
      expect.objectContaining({ cadence: 'WEEKLY', weekday: 4 }),
      'Tuesday?',
    );
  });
});
