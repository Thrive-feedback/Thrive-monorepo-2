import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OneOnOneTemplate } from '@/app/(signed-in)/(sidebar)/_lib/one-on-one.type';
import type {
  Meeting,
  MeetingTopic,
  NextMeeting as NextMeetingData,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import {
  COLLAPSED_KEY,
  forgetListCollapsed,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/use-list-collapsed';
import { Toaster } from '@/components/atoms/toaster';
import { SampleDataProvider } from '@/components/organisms/sample-data-provider';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';
import { SIDEBAR_STORAGE_KEY } from '@/lib/sidebar-fold.constant';

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
const removeTemplateFromMeeting = vi.fn();
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
    removeTemplateFromMeeting: (...args: unknown[]) =>
      removeTemplateFromMeeting(...args),
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
  readerName: 'Krit',
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
    broughtFrom: null,
    templateKey: null,
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
          templates: [],
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
    chooseTemplateForMeeting,
    removeTemplateFromMeeting,
  ]) {
    action.mockReset().mockResolvedValue({ ok: true });
  }
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.sidebar;
  localStorage.clear();
  forgetListCollapsed();
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
    // No toast: its questions are seen landing; a screen reader is told in words, once.
    expect(
      screen.getAllByText('Added Career conversation to the agenda'),
    ).toHaveLength(1);
  });

  it('says which template asked each question, and offers to take each one in use off the agenda', async () => {
    draw({
      meeting: meeting({
        topics: [
          topic('t1', 'What went well this week?', {
            templateKey: 'weekly-check-in',
          }),
          topic('t2', 'Where do you want to be in a year?', {
            templateKey: 'career-conversation',
          }),
        ],
      }),
      templateName: 'Career conversation',
      templates: [
        { key: 'weekly-check-in', name: 'Weekly check-in' },
        { key: 'career-conversation', name: 'Career conversation' },
      ],
    });

    expect(screen.getByText('From Weekly check-in')).toBeVisible();
    expect(screen.getByText('From Career conversation')).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', { name: 'Add from template' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add from template',
    });
    // Another template adds to the agenda; nothing is replaced.
    expect(
      within(dialog).getByText(/added after the agenda’s topics/),
    ).toBeVisible();
    // Each one in use offers to come off the agenda instead of being used again.
    expect(
      within(dialog).queryByRole('button', { name: 'Use Weekly check-in' }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', {
        name: 'Remove from agenda: Career conversation',
      }),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole('button', {
        name: 'Remove from agenda: Weekly check-in',
      }),
    );
    expect(removeTemplateFromMeeting).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      'weekly-check-in',
    );
    // It stays open, so another can be chosen in its place, and says what went.
    expect(
      await within(dialog).findByText('Took Weekly check-in off the agenda'),
    ).toBeInTheDocument();
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
    // The track along the card's foot is as far along as the agenda, and only decoration.
    const track = document.querySelector('[data-meeting-progress]');
    expect(track).toHaveAttribute('aria-hidden', 'true');
    expect(track?.firstElementChild).toHaveStyle({ transform: 'scaleX(0.5)' });
  });

  it('shows no progress track while the meeting is only being prepared', () => {
    draw({ meeting: meeting() });

    expect(document.querySelector('[data-meeting-progress]')).toBeNull();
  });

  it('lets the agenda be moved and trimmed before anybody has written to it', async () => {
    draw({ carried: ['Launch retro', 'What went well this week?'] });

    expect(
      screen.getByRole('button', { name: 'Move Launch retro' }),
    ).toBeVisible();
    const remove = screen.getByRole('button', {
      name: 'Remove: What went well this week?',
    });
    const row = remove.closest('li') as HTMLElement;
    await userEvent.click(remove);

    // It goes first, out of reach, and the removal is sent once it has gone.
    expect(row).toHaveAttribute('inert');
    expect(removePreviewTopic).not.toHaveBeenCalled();
    fireEvent.animationEnd(row);

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

  it('folds the sidebar and the list of 1:1s once the meeting starts, so it has the room', async () => {
    // A desktop window, where the sidebar stands wide beside the page and may fold.
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: !query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    document.documentElement.dataset.sidebar = 'wide';
    localStorage.removeItem(COLLAPSED_KEY);
    forgetListCollapsed();
    draw({ meeting: meeting() });

    await userEvent.click(
      screen.getByRole('button', { name: 'Start meeting' }),
    );

    await waitFor(() =>
      expect(document.documentElement.dataset.sidebar).toBe('rail'),
    );
    expect(localStorage.getItem(SIDEBAR_STORAGE_KEY)).toBe('rail');
    expect(localStorage.getItem(COLLAPSED_KEY)).toBe('1');
  });

  it('leaves the sidebar and the list as they are when the meeting does not start', async () => {
    startMeeting.mockResolvedValue({
      ok: false,
      message: 'Mint already started it.',
    });
    localStorage.removeItem(COLLAPSED_KEY);
    forgetListCollapsed();
    draw({ meeting: meeting() });

    await userEvent.click(
      screen.getByRole('button', { name: 'Start meeting' }),
    );

    expect(await screen.findByText('Mint already started it.')).toBeVisible();
    expect(localStorage.getItem(COLLAPSED_KEY)).toBeNull();
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
            templateKey: 'weekly-check-in',
          }),
          topic('t2', 'Hiring', { source: 'CARRIED' }),
        ],
      }),
      templates: [{ key: 'weekly-check-in', name: 'Weekly check-in' }],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Finish' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Finish this meeting?',
    });
    expect(within(dialog).getByText('Shipped on time')).toBeVisible();
    expect(within(dialog).getByText('Carries over to next time')).toBeVisible();
    // Each topic says where it came from, under the dialog's title, one heading level down.
    expect(
      within(dialog).getByRole('heading', { level: 3, name: /Launch retro/ }),
    ).toHaveTextContent(/From Weekly check-in$/);
    expect(within(dialog).getByText('From last time')).toBeVisible();
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
    const remove = screen.getByRole('button', { name: 'Remove: Launch retro' });
    await userEvent.click(remove);
    // The row went, then the removal was sent, and the page read the agenda without it.
    fireEvent.animationEnd(remove.closest('li') as HTMLElement);
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

  it('brings a topic back into its place when taking it off was refused', async () => {
    removeTopic.mockResolvedValue({
      ok: false,
      message: 'Mint changed the agenda. Sync and try again.',
    });
    draw({ meeting: meeting() });
    const remove = screen.getByRole('button', { name: 'Remove: Launch retro' });
    const row = remove.closest('li') as HTMLElement;
    await userEvent.click(remove);
    fireEvent.animationEnd(row);

    expect(
      await screen.findByText('Mint changed the agenda. Sync and try again.'),
    ).toBeVisible();
    expect(row).not.toHaveAttribute('inert');
    // It went out of reach while it left; focus is given back where the press was.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Remove: Launch retro' }),
      ).toHaveFocus(),
    );
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

describe('before the meeting', () => {
  it('shows what came since the last meeting above the agenda, and says where a brought topic came from', () => {
    render(
      <NextMeeting
        workspaceId="workspace-acme"
        oneOnOneId={ONE_ON_ONE_ID}
        next={{
          meeting: meeting({
            topics: [
              topic('t1', 'Feedback from Ploy: The demo was clear.', {
                source: 'PERSON',
                authorAccountId: ME,
                broughtFrom: {
                  kind: 'FEEDBACK',
                  id: '0196b4c8-0000-7000-8000-000000000101',
                },
              }),
            ],
          }),
          carried: [],
          templateQuestions: [],
          templates: [],
          carriedFromSkipped: null,
          carriedTopics: [],
          templateName: null,
        }}
        nextMeetingAt={DUE_TODAY.at}
        nextMeetingSkippedAt={DUE_TODAY.skippedAt}
        isOnce={false}
        today="2026-12-03"
        people={PEOPLE}
        templates={TEMPLATES}
        context={{
          since: '2026-11-26T03:00:00.000Z',
          lookback: 'LAST_MEETING',
          tabs: {
            FEEDBACK: {
              count: 1,
              nextCursor: null,
              items: [
                {
                  kind: 'FEEDBACK',
                  messageTags: NO_TEXT_TAGS,
                  id: '0196b4c8-0000-7000-8000-000000000101',
                  giver: {
                    accountId: 'account-ploy',
                    name: 'Ploy',
                    photoUrl: null,
                  },
                  receiverAccountIds: [MINT],
                  message: 'The demo was clear.',
                  question: null,
                  writtenAt: '2026-11-30T03:00:00.000Z',
                },
              ],
            },
            KUDOS: { items: [], count: 0, nextCursor: null },
            BETWEEN: { items: [], count: 0, nextCursor: null },
            SHARED: { items: [], count: 0, nextCursor: null },
            OPEN_ASKS: { items: [], count: 0, nextCursor: null },
          },
        }}
      />,
    );

    const before = screen.getByRole('region', { name: /Before you meet/ });
    expect(within(before).getByText('On the agenda')).toBeVisible();
    expect(screen.getByText('From Feedback')).toBeVisible();
  });
  it('is not shown once the meeting has started: the agenda is what the two have', () => {
    render(
      <NextMeeting
        workspaceId="workspace-acme"
        oneOnOneId={ONE_ON_ONE_ID}
        next={{
          meeting: meeting({
            state: 'IN_PROGRESS',
            startedAt: '2026-12-03T03:00:00.000Z',
            startedByAccountId: ME,
          }),
          carried: [],
          templateQuestions: [],
          templates: [],
          carriedFromSkipped: null,
          carriedTopics: [],
          templateName: null,
        }}
        nextMeetingAt={DUE_TODAY.at}
        nextMeetingSkippedAt={DUE_TODAY.skippedAt}
        isOnce={false}
        today="2026-12-03"
        people={PEOPLE}
        templates={TEMPLATES}
        context={{
          since: '2026-11-26T03:00:00.000Z',
          lookback: 'LAST_MEETING',
          tabs: {
            FEEDBACK: { items: [], count: 0, nextCursor: null },
            KUDOS: { items: [], count: 0, nextCursor: null },
            BETWEEN: { items: [], count: 0, nextCursor: null },
            SHARED: { items: [], count: 0, nextCursor: null },
            OPEN_ASKS: { items: [], count: 0, nextCursor: null },
          },
        }}
      />,
    );

    expect(
      screen.queryByRole('region', { name: /Before you meet/ }),
    ).toBeNull();
  });
});

describe('the agenda as topics come and go', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    // jsdom does not scroll; each call says what was brought into view.
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  /** Whether the person asked for less motion; every other media query answers no. */
  function asksForLessMotion(reduce: boolean) {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce') ? reduce : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
  }

  function withTopics(...more: MeetingTopic[]) {
    return { meeting: meeting({ topics: [...meeting().topics, ...more] }) };
  }

  /** The form Add a topic is in: what is scrolled into view when the reader adds. */
  function addForm() {
    return screen.getByRole('textbox', { name: 'Add a topic' }).closest('form');
  }

  it('brings Add a topic into view when the reader adds a topic, typed or brought from a card', () => {
    const syncWith = draw({ meeting: meeting() });

    syncWith(
      withTopics(
        topic('t9', 'Kudos from Nok', {
          source: 'PERSON',
          authorAccountId: ME,
          broughtFrom: {
            kind: 'KUDOS',
            id: '0196b4c8-0000-7000-8000-000000000501',
          },
        }),
      ),
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(addForm());
    expect(scrollIntoView).toHaveBeenCalledWith({
      block: 'nearest',
      behavior: 'smooth',
    });
  });

  it('leaves the page where it is when a topic the other person wrote arrives on Sync', () => {
    const syncWith = draw({ meeting: meeting() });

    syncWith(
      withTopics(
        topic('t9', 'Their worry', { source: 'PERSON', authorAccountId: MINT }),
      ),
    );

    expect(screen.getByText('Their worry')).toBeVisible();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("brings a template's questions into view only when the reader used it", async () => {
    chooseTemplateForMeeting.mockResolvedValue({ ok: true, id: MEETING_ID });
    const syncWith = draw({ meeting: meeting() });

    // The other person used one; it arrives on Sync and does not move the page.
    syncWith(
      withTopics(
        topic('t8', 'Where next?', { templateKey: 'career-conversation' }),
      ),
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    // The reader uses one; its questions land and are brought into view.
    await userEvent.click(
      screen.getByRole('button', { name: 'Add from template' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Add from template',
    });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Use Weekly check-in' }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    syncWith(
      withTopics(
        topic('t8', 'Where next?', { templateKey: 'career-conversation' }),
        topic('t9', 'What went well this week?', {
          templateKey: 'weekly-check-in',
        }),
      ),
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(addForm());
  });

  it('brings each add into view with less motion too, at once rather than smoothly', () => {
    asksForLessMotion(true);
    const syncWith = draw({ meeting: meeting() });
    const mine = (id: string, text: string) =>
      topic(id, text, { source: 'PERSON', authorAccountId: ME });

    syncWith(withTopics(mine('t9', 'First')));
    syncWith(withTopics(mine('t9', 'First'), mine('t10', 'Second')));

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      block: 'nearest',
      behavior: 'auto',
    });

    // Each was brought into view once: a reorder or a removal later does not scroll again.
    syncWith(withTopics(mine('t10', 'Second'), mine('t9', 'First')));
    syncWith(withTopics(mine('t10', 'Second')));
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('takes a topic off at once, with no motion, for someone who asked for less', async () => {
    asksForLessMotion(true);
    draw({ meeting: meeting() });

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove: Launch retro' }),
    );

    expect(removeTopic).toHaveBeenCalledExactlyOnceWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      't1',
    );
  });

  it('sends a removal even when its motion never says it ended', async () => {
    // Time held still, so the backstop is reached by moving the clock, not by waiting for it. The
    // clocks this file fakes for every test are swapped for ones that fake the timers too.
    vi.useRealTimers();
    vi.useFakeTimers({
      toFake: ['Date', 'setTimeout', 'clearTimeout'],
      shouldAdvanceTime: true,
    });
    vi.setSystemTime(new Date('2026-12-03T03:10:00.000Z'));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    draw({ meeting: meeting() });

    await user.click(
      screen.getByRole('button', { name: 'Remove: Launch retro' }),
    );

    expect(removeTopic).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(removeTopic).toHaveBeenCalledTimes(1);
  });

  it('takes one topic off at a time: the rest wait while one leaves', async () => {
    const syncWith = draw({ meeting: meeting() });
    const first = screen.getByRole('button', { name: 'Remove: Launch retro' });

    await userEvent.click(first);

    expect(
      screen.getByRole('button', { name: 'Remove: My worry' }),
    ).toBeDisabled();
    fireEvent.animationEnd(first.closest('li') as HTMLElement);
    await waitFor(() => expect(removeTopic).toHaveBeenCalledTimes(1));
    // The removal went, and the page read the agenda without it.
    const [, ...rest] = meeting().topics;
    syncWith({ meeting: meeting({ topics: rest }) });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Remove: My worry' }),
      ).toBeEnabled(),
    );
  });
});

describe('on sample data, as in the showcase', () => {
  // Sonner keeps its toasts between renders, so one test's would still show in the next.
  afterEach(() => {
    toast.dismiss();
  });

  it('never asks the server where the meeting stands, however long it is shown', async () => {
    vi.useRealTimers();
    vi.useFakeTimers({
      toFake: ['Date', 'setInterval', 'clearInterval'],
      shouldAdvanceTime: true,
    });
    vi.setSystemTime(new Date('2026-12-03T03:10:00.000Z'));
    // In view, as the watch would ask while it is: so only the sample data stops it.
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    render(
      <SampleDataProvider>{page({ meeting: meeting() })}</SampleDataProvider>,
    );

    // Well past the watch's ten seconds, twice over.
    await act(() => vi.advanceTimersByTimeAsync(25_000));

    expect(checkMeetingState).not.toHaveBeenCalled();
  });

  it('keeps a note on the page and sends nothing', async () => {
    render(
      <SampleDataProvider>
        {page({
          meeting: meeting({
            state: 'IN_PROGRESS',
            startedAt: '2026-12-03T03:00:00.000Z',
            occursAt: '2026-12-03T03:00:00.000Z',
          }),
        })}
      </SampleDataProvider>,
    );
    const [note] = screen.getAllByRole('textbox', { name: /Notes on/ });
    if (!note) {
      throw new Error('No note field');
    }

    await userEvent.type(note, 'Went well');
    await userEvent.tab();

    expect(updateTopic).not.toHaveBeenCalled();
    expect(note).toHaveValue('Went well');
  });

  it('sends nothing on Start meeting, and says so', async () => {
    render(
      <SampleDataProvider>{page({ meeting: meeting() })}</SampleDataProvider>,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'Start meeting' }),
    );

    expect(startMeeting).not.toHaveBeenCalled();
    expect(
      await screen.findByText('In the showcase, nothing is sent.'),
    ).toBeVisible();
  });
});
