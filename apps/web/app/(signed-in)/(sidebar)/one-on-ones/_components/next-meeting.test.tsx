import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import type {
  Meeting,
  MeetingTopic,
  NextMeeting as NextMeetingData,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { Toaster } from '@/components/atoms/toaster';

const refresh = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
const startMeeting = vi.fn();
const finishMeeting = vi.fn();
const addTopic = vi.fn();
const removeTopic = vi.fn();
const removePreviewTopic = vi.fn();
const reorderTopics = vi.fn();
const reorderPreviewTopics = vi.fn();
const updateTopic = vi.fn();
const checkMeetingState = vi.fn();
const chooseTemplateForMeeting = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service',
  () => ({
    addTopic: (...args: unknown[]) => addTopic(...args),
    finishMeeting: (...args: unknown[]) => finishMeeting(...args),
    removePreviewTopic: (...args: unknown[]) => removePreviewTopic(...args),
    removeTopic: (...args: unknown[]) => removeTopic(...args),
    reorderPreviewTopics: (...args: unknown[]) => reorderPreviewTopics(...args),
    reorderTopics: (...args: unknown[]) => reorderTopics(...args),
    startMeeting: (...args: unknown[]) => startMeeting(...args),
    updateTopic: (...args: unknown[]) => updateTopic(...args),
    checkMeetingState: (...args: unknown[]) => checkMeetingState(...args),
    chooseTemplateForMeeting: (...args: unknown[]) =>
      chooseTemplateForMeeting(...args),
  }),
);

const TEMPLATES: readonly OneOnOneTemplate[] = [
  {
    key: 'weekly-check-in',
    scope: 'THRIVE',
    name: 'Weekly check-in',
    suggestedWhen: 'The default for every 1:1',
    questions: ['What went well this week?'],
    changeable: false,
  },
  {
    key: 'career-conversation',
    scope: 'THRIVE',
    name: 'Career conversation',
    suggestedWhen: '',
    questions: ['Where next?'],
    changeable: false,
  },
];

const { NextMeeting } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_components/next-meeting'
);

const ME = 'account-me';
const MINT = 'account-mint';
const ONE_ON_ONE_ID = '0196b4c8-0000-7000-8000-000000000001';
const MEETING_ID = '0196b4c8-0000-7000-8000-0000000000a1';
const PEOPLE = {
  readerAccountId: ME,
  otherAccountId: MINT,
  otherName: 'Mint',
};

function topic(
  id: string,
  text: string,
  overrides: Partial<MeetingTopic> = {},
): MeetingTopic {
  return {
    id,
    text,
    source: 'TEMPLATE',
    authorAccountId: null,
    position: 0,
    notes: '',
    notesUpdatedAt: null,
    notesUpdatedByAccountId: null,
    discussedAt: null,
    ...overrides,
  };
}

function meeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: MEETING_ID,
    state: 'PREPARING',
    templateKey: 'weekly-check-in',
    occursAt: null,
    startedAt: null,
    startedByAccountId: null,
    finishedAt: null,
    finishedByAccountId: null,
    topics: [
      topic('t1', 'Launch retro', { source: 'CARRIED' }),
      topic('t2', 'Career path', { source: 'PERSON', authorAccountId: MINT }),
      topic('t3', 'My worry', { source: 'PERSON', authorAccountId: ME }),
    ],
    ...overrides,
  };
}

/** When the meeting due is on, and when it is skipped; by default Thu 3 Dec, today in these tests. */
type Due = { readonly at: string; readonly skippedAt: string };

const DUE_TODAY: Due = {
  at: '2026-12-03T03:00:00.000Z',
  skippedAt: '2026-12-09T17:00:00.000Z',
};

function page(next: Partial<NextMeetingData>, due: Due = DUE_TODAY) {
  return (
    <>
      <NextMeeting
        workspaceId="workspace-acme"
        oneOnOneId={ONE_ON_ONE_ID}
        next={{
          meeting: null,
          carried: [],
          templateQuestions: [],
          carriedFromSkipped: null,
          carriedTopics: [],
          templateName: null,
          ...next,
        }}
        nextMeetingAt={due.at}
        nextMeetingSkippedAt={due.skippedAt}
        isOnce={false}
        // The day the clock these tests set falls on, in Bangkok.
        today="2026-12-03"
        people={PEOPLE}
        templates={TEMPLATES}
      />
      <Toaster />
    </>
  );
}

/** Draws it, and returns how to draw it again as a Sync would, with what the page read next. */
function draw(next: Partial<NextMeetingData> = {}, due: Due = DUE_TODAY) {
  const view = render(page(next, due));
  return (again: Partial<NextMeetingData>) => view.rerender(page(again, due));
}

/** The agenda's topics in the order shown, by their drag handles. */
function shownOrder(): string[] {
  return screen
    .getAllByRole('button', { name: /^Move / })
    .map((grip) => grip.getAttribute('aria-label')?.replace('Move ', '') ?? '');
}

/**
 * jsdom lays nothing out, so each agenda row is given a place, one under another, for the keyboard
 * to move a topic between.
 */
function layOutRows() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const row = this.closest('li');
      const index = row
        ? [...(row.parentElement?.children ?? [])].indexOf(row)
        : 0;
      const top = index * 60;
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        right: 400,
        bottom: top + 50,
        width: 400,
        height: 50,
        toJSON: () => ({}),
      };
    },
  );
}

beforeEach(() => {
  // In the meeting's hour on 3 December: a meeting that occurs then is not left open.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-12-03T03:10:00.000Z'));
  refresh.mockClear();
  for (const action of [
    startMeeting,
    finishMeeting,
    addTopic,
    removeTopic,
    removePreviewTopic,
    reorderTopics,
    reorderPreviewTopics,
    updateTopic,
  ]) {
    action.mockReset().mockResolvedValue({ ok: true });
  }
});

afterEach(() => {
  checkMeetingState.mockReset();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('NextMeeting', () => {
  it('shows what the agenda will open with, and opens it with the first topic added', async () => {
    draw({ carried: ['Launch retro'] });

    // Its day is today, on the clock these tests run on.
    expect(screen.getByText('Today')).toBeVisible();
    expect(screen.getByText('From last time')).toBeVisible();
    expect(screen.getByText('1 topic')).toBeVisible();
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Add a topic' }),
      'Career path',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(addTopic).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      null,
      'Career path',
    );
  });

  it('uses a template for the meeting being prepared, opening it first when nobody has written to it', async () => {
    chooseTemplateForMeeting.mockResolvedValue({ ok: true, id: MEETING_ID });
    draw({ carried: ['Launch retro'] });

    await userEvent.click(
      screen.getByRole('button', { name: 'Add from template' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add from template',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: /^Career conversation/ }),
    );
    expect(within(dialog).getByText('Where next?')).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Use Career conversation' }),
    );

    expect(chooseTemplateForMeeting).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      null,
      'career-conversation',
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
  });

  it('names the template used, offers to change it, marks it in use, and says where its questions came from', async () => {
    draw({
      meeting: meeting({
        topics: [topic('t1', 'What went well this week?')],
      }),
      templateName: 'Weekly check-in',
    });

    expect(screen.getByText('From Weekly check-in')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Add from template' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add from template',
    });
    expect(
      within(dialog).getByText(/Replaces the questions from Weekly check-in/),
    ).toBeVisible();
    // The one in use is said so, not offered again.
    expect(within(dialog).getByText('In use')).toBeVisible();
    expect(
      within(dialog).queryByRole('button', { name: 'Use Weekly check-in' }),
    ).not.toBeInTheDocument();
    // Templates are kept in Settings, a link away.
    expect(
      within(dialog).getByRole('link', { name: 'Manage templates' }),
    ).toHaveAttribute('href', '/settings/one-on-ones');
  });

  it('offers no template once the meeting runs', () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    expect(
      screen.queryByRole('button', { name: 'Add from template' }),
    ).not.toBeInTheDocument();
  });

  it('says which step it is at and what to do next, in each state', () => {
    draw({ meeting: meeting() });

    // Where it stands is a word at the top of its box, not a row of steps.
    expect(screen.getByText('Preparing')).toBeVisible();
    expect(screen.queryByText('Share the summary')).not.toBeInTheDocument();
    expect(screen.getByText(/Agenda saved\. When you meet/)).toBeVisible();
    expect(screen.getByText('3 topics')).toBeVisible();
  });

  it('counts what was discussed while it runs', () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
        topics: [
          topic('t1', 'Launch retro', {
            discussedAt: '2026-12-03T03:05:00.000Z',
          }),
          topic('t2', 'Hiring'),
        ],
      }),
    });

    expect(screen.getByText('In progress')).toBeVisible();
    expect(screen.getByText(/since 10:00/)).toBeVisible();
    expect(screen.getByText('1 of 2 discussed')).toBeVisible();
    expect(screen.getByText(/Finishing shares the summary/)).toBeVisible();
  });

  it('lets the agenda be moved and trimmed before anybody has written to it', async () => {
    draw({ carried: ['Launch retro', 'What went well this week?'] });

    expect(
      screen.getByRole('button', { name: 'Move Launch retro' }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove: What went well this week?' }),
    );

    // By its place and its words, so a topic the other person moved meanwhile is not removed.
    expect(removePreviewTopic).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      1,
      'What went well this week?',
    );
  });

  it('lets the reader remove only what they wrote, and what came from the template or last time', () => {
    draw({ meeting: meeting() });

    expect(
      screen.getByRole('button', { name: 'Remove: Launch retro' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Remove: Career path' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove: My worry' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Move Launch retro' }),
    ).toBeVisible();
    expect(screen.getByText('Added by Mint')).toBeVisible();
  });

  it('takes no notes before it starts, and starts it from the agenda prepared', async () => {
    draw({ meeting: meeting() });

    expect(
      screen.queryByRole('checkbox', { name: /Discussed/ }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Start meeting' }),
    );

    expect(startMeeting).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
    );
  });

  it('ticks a topic discussed while it runs', async () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Discussed: Launch retro' }),
    );

    expect(updateTopic).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      't1',
      { discussed: true },
    );
  });

  it('takes notes while it runs, saying when the other person changed one', async () => {
    updateTopic.mockResolvedValue({
      ok: false,
      message: 'This note changed since you read it. Sync to see it.',
    });
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    const note = screen.getAllByRole('textbox', { name: /Notes on/ })[0];
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'Went well');
    await userEvent.tab();

    expect(updateTopic).toHaveBeenCalledWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      't1',
      { note: 'Went well', noteReadAt: null },
    );
    expect(
      (
        await screen.findAllByText(
          'This note changed since you read it. Sync to see it.',
        )
      )[0],
    ).toBeVisible();
    expect(note).toHaveValue('Went well');
  });

  it('finishes after showing the summary', async () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
        topics: [
          topic('t1', 'Launch retro', {
            discussedAt: '2026-12-03T03:05:00.000Z',
            notes: 'Shipped on time',
          }),
          topic('t2', 'Hiring'),
        ],
      }),
    });

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Finish this meeting?',
    });
    expect(within(dialog).getByText('Shipped on time')).toBeVisible();
    expect(within(dialog).getByText('Carries over to next time')).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Finish' }),
    );

    expect(finishMeeting).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
    );
  });

  it('shows what the other person wrote, once read, beside what the reader typed, and saves neither until they choose', async () => {
    const running = meeting({
      state: 'IN_PROGRESS',
      startedAt: '2026-12-03T03:00:00.000Z',
      occursAt: '2026-12-03T03:00:00.000Z',
    });
    const syncWith = draw({ meeting: running });
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'Mine');

    // Sync reads what Mint wrote on the same topic in the meantime.
    const [first, ...rest] = running.topics;
    if (!first) {
      throw new Error('No topic');
    }
    syncWith({
      meeting: {
        ...running,
        topics: [
          {
            ...first,
            notes: 'Theirs',
            notesUpdatedAt: '2026-12-03T03:06:00.000Z',
            notesUpdatedByAccountId: MINT,
          },
          ...rest,
        ],
      },
    });

    expect(
      await screen.findByText('Mint wrote this while you were typing:'),
    ).toBeVisible();
    expect(screen.getByText('Theirs')).toBeVisible();
    expect(note).toHaveValue('Mine');
    await userEvent.tab();
    expect(updateTopic).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Use theirs' }));
    expect(note).toHaveValue('Theirs');
    expect(updateTopic).not.toHaveBeenCalled();
  });

  it('keeps the reader’s words when they choose, saved over what they have now read', async () => {
    const running = meeting({
      state: 'IN_PROGRESS',
      startedAt: '2026-12-03T03:00:00.000Z',
      occursAt: '2026-12-03T03:00:00.000Z',
    });
    const syncWith = draw({ meeting: running });
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'Mine');
    const [first, ...rest] = running.topics;
    if (!first) {
      throw new Error('No topic');
    }
    syncWith({
      meeting: {
        ...running,
        topics: [
          {
            ...first,
            notes: 'Theirs',
            notesUpdatedAt: '2026-12-03T03:06:00.000Z',
            notesUpdatedByAccountId: MINT,
          },
          ...rest,
        ],
      },
    });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Keep mine' }),
    );

    expect(updateTopic).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      't1',
      { note: 'Mine', noteReadAt: '2026-12-03T03:06:00.000Z' },
    );
  });

  it('moves a topic with the keyboard, and saves the new order', async () => {
    layOutRows();
    draw({ meeting: meeting() });

    const grip = screen.getByRole('button', { name: 'Move Launch retro' });
    grip.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');

    expect(reorderTopics).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      ['t2', 't1', 't3'],
    );
  });

  it('puts the order back when a move is refused', async () => {
    layOutRows();
    reorderTopics.mockResolvedValue({
      ok: false,
      message: 'The agenda changed. Sync, then reorder.',
    });
    draw({ meeting: meeting() });

    const grip = screen.getByRole('button', { name: 'Move Launch retro' });
    grip.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');

    expect(
      (
        await screen.findAllByText('The agenda changed. Sync, then reorder.')
      )[0],
    ).toBeVisible();
    expect(shownOrder()).toEqual(['Launch retro', 'Career path', 'My worry']);
  });

  it('moves a topic on the agenda nobody has written to, naming the agenda as the reader saw it', async () => {
    layOutRows();
    draw({ carried: ['Launch retro', 'What went well this week?'] });

    const grip = screen.getByRole('button', { name: 'Move Launch retro' });
    grip.focus();
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');

    expect(reorderPreviewTopics).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      ['Launch retro', 'What went well this week?'],
      0,
      1,
    );
  });

  it('gives focus to the next topic when the one that had it is removed', async () => {
    const syncWith = draw({ meeting: meeting() });
    await userEvent.click(
      screen.getByRole('button', { name: 'Remove: Launch retro' }),
    );
    // The removal went, and the page read the agenda without it.
    const [, ...rest] = meeting().topics;
    const pressed = document.activeElement;
    if (pressed instanceof HTMLElement) {
      // The pressed button went with its row.
      pressed.blur();
    }
    syncWith({ meeting: meeting({ topics: rest }) });

    expect(
      screen.getByRole('button', { name: 'Move Career path' }),
    ).toHaveFocus();
  });

  it('saves the note being typed and reads the page before showing the summary to check', async () => {
    const calls: string[] = [];
    updateTopic.mockImplementation(async () => {
      calls.push('save');
      return { ok: true };
    });
    refresh.mockImplementation(() => calls.push('read'));
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'Agreed to ship Friday');

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));

    expect(
      await screen.findByRole('dialog', { name: 'Finish this meeting?' }),
    ).toBeVisible();
    expect(updateTopic).toHaveBeenCalledWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      't1',
      { note: 'Agreed to ship Friday', noteReadAt: null },
    );
    expect(calls).toEqual(['save', 'read']);
  });

  it('takes the reader’s own save read back as no conflict', async () => {
    const running = meeting({
      state: 'IN_PROGRESS',
      startedAt: '2026-12-03T03:00:00.000Z',
      occursAt: '2026-12-03T03:00:00.000Z',
    });
    const syncWith = draw({ meeting: running });
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'Mine, still typing');
    const [first, ...rest] = running.topics;
    if (!first) {
      throw new Error('No topic');
    }
    // A read lands with the reader's earlier save of the same note.
    syncWith({
      meeting: {
        ...running,
        topics: [
          {
            ...first,
            notes: 'Mine',
            notesUpdatedAt: '2026-12-03T03:06:00.000Z',
            notesUpdatedByAccountId: ME,
          },
          ...rest,
        ],
      },
    });

    expect(
      screen.queryByText(/wrote this while you were typing/),
    ).not.toBeInTheDocument();
    expect(note).toHaveValue('Mine, still typing');
  });

  it('stops saving after the other person changed the note, rather than being refused at every pause', async () => {
    updateTopic.mockResolvedValue({
      ok: false,
      message: 'This note changed since you read it. Sync to see it.',
      code: 'ONE_ON_ONE_TOPIC_CHANGED',
    });
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }
    await userEvent.type(note, 'One');
    await userEvent.tab();
    // Toasts outlive a test, so one from an earlier test may still show the same words.
    await screen.findAllByText(
      'This note changed since you read it. Sync to see it.',
    );
    await userEvent.type(note, ' two');
    await userEvent.tab();

    expect(updateTopic).toHaveBeenCalledTimes(1);
  });

  it('gives focus back to Finish when its summary is closed with Keep going', async () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    const finish = screen.getByRole('button', { name: 'Finish' });
    await userEvent.click(finish);
    const dialog = await screen.findByRole('dialog', {
      name: 'Finish this meeting?',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Keep going' }),
    );

    await waitFor(() => expect(finish).toHaveFocus());
  });

  it('keeps one topic’s note open at a time, the first to talk about to begin with', async () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    expect(
      screen.getByRole('textbox', { name: 'Notes on Launch retro' }),
    ).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /^Career path/ }));

    expect(
      screen.getByRole('textbox', { name: 'Notes on Career path' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('textbox', { name: 'Notes on Launch retro' }),
    ).not.toBeInTheDocument();
  });

  it('moves on to the next topic to talk about when the open one is ticked', async () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-12-03T03:00:00.000Z',
        occursAt: '2026-12-03T03:00:00.000Z',
      }),
    });

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Discussed: Launch retro' }),
    );

    expect(
      screen.getByRole('textbox', { name: 'Notes on Career path' }),
    ).toBeVisible();
  });

  it('opens a closed topic when the other person’s words arrive beside the reader’s', async () => {
    const running = meeting({
      state: 'IN_PROGRESS',
      startedAt: '2026-12-03T03:00:00.000Z',
      occursAt: '2026-12-03T03:00:00.000Z',
    });
    // Mint changed this note first, so the reader's save is refused and their words stay unsaved.
    updateTopic.mockResolvedValue({
      ok: false,
      message: 'This note changed since you read it. Sync to see it.',
      code: 'ONE_ON_ONE_TOPIC_CHANGED',
    });
    const syncWith = draw({ meeting: running });
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Notes on Launch retro' }),
      'Mine',
    );
    await userEvent.click(screen.getByRole('button', { name: /^Career path/ }));
    expect(
      screen.queryByRole('textbox', { name: 'Notes on Launch retro' }),
    ).not.toBeInTheDocument();
    const [first, ...rest] = running.topics;
    if (!first) {
      throw new Error('No topic');
    }

    syncWith({
      meeting: {
        ...running,
        topics: [
          {
            ...first,
            notes: 'Theirs',
            notesUpdatedAt: '2026-12-03T03:06:00.000Z',
            notesUpdatedByAccountId: MINT,
          },
          ...rest,
        ],
      },
    });

    expect(
      await screen.findByText('Mint wrote this while you were typing:'),
    ).toBeVisible();
  });

  it('reads the page again, and says so, when the other person starts the meeting', async () => {
    // The clock is already faked for dates; the page's interval is faked too, to step it.
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-12-03T03:10:00.000Z'));
    // jsdom draws no page, so it never says it is in view; the browser would.
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    checkMeetingState.mockResolvedValue({
      meetingId: MEETING_ID,
      state: 'IN_PROGRESS',
    });
    draw({ meeting: meeting() });

    await vi.advanceTimersByTimeAsync(10_000);

    expect(checkMeetingState).toHaveBeenCalledWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
    );
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Mint started the meeting')).toBeVisible();
    // Asked again before the page has changed, it does not read the page twice.
    await vi.advanceTimersByTimeAsync(10_000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('leaves the page alone while the meeting stands as shown, or while it is out of view', async () => {
    // The clock is already faked for dates; the page's interval is faked too, to step it.
    vi.useRealTimers();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date('2026-12-03T03:10:00.000Z'));
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('visible');
    checkMeetingState.mockResolvedValue({
      meetingId: MEETING_ID,
      state: 'PREPARING',
    });
    draw({ meeting: meeting() });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(checkMeetingState).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();

    checkMeetingState.mockClear();
    visibility.mockReturnValue('hidden');
    await vi.advanceTimersByTimeAsync(10_000);
    expect(checkMeetingState).not.toHaveBeenCalled();
  });

  it('says when a meeting was left open long after it ended', () => {
    draw({
      meeting: meeting({
        state: 'IN_PROGRESS',
        startedAt: '2026-11-01T03:00:00.000Z',
        occursAt: '2026-11-01T03:00:00.000Z',
      }),
    });

    expect(
      screen.getByText(
        'The meeting from Sun 1 Nov is still open. Finish it to prepare the next one.',
      ),
    ).toBeVisible();
  });

  it('says a meeting whose day passed unstarted is overdue, until when, and still offers Start', () => {
    // Due Tue 1 Dec (its day starts at 17:00 UTC the day before), skipped as Tue 8 Dec starts.
    draw(
      { meeting: meeting() },
      { at: '2026-11-30T17:00:00.000Z', skippedAt: '2026-12-07T17:00:00.000Z' },
    );

    expect(screen.getByText('Overdue')).toBeVisible();
    expect(screen.getByText('Tue 1 Dec')).toBeVisible();
    expect(
      screen.getByText(
        'You haven’t met yet. You can still start until Mon 7 Dec. After that it’s skipped and the agenda moves to Tue 8 Dec.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Start meeting' })).toBeEnabled();
  });

  it('marks only the topics written for a skipped day as carried from it', () => {
    draw({
      meeting: meeting(),
      carriedFromSkipped: '2026-11-26',
      carriedTopics: [{ topicId: 't1', from: '2026-11-26' }],
    });

    expect(screen.getByText('From Thu 26 Nov (skipped)')).toBeVisible();
    expect(screen.getByText('Added by Mint')).toBeVisible();
    expect(
      screen.getByText(
        'Carried over from Thu 26 Nov, which was skipped. When you meet, either of you can start.',
      ),
    ).toBeVisible();
  });
});
