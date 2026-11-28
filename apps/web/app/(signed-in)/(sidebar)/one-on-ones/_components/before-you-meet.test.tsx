import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment } from 'react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MeetingContextCard,
  MeetingContextTab,
  MeetingContextTabView,
  MeetingContextView,
} from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import { Toaster } from '@/components/atoms/toaster';
import { SampleDataProvider } from '@/components/organisms/sample-data-provider';
import { NO_TEXT_TAGS } from '@/lib/feedback/text-tags.type';

const refresh = vi.fn();
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh }),
}));
const addTopic = vi.fn();
const readMoreMeetingContext = vi.fn();
vi.mock(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting-actions.service',
  () => ({
    addTopic: (...args: unknown[]) => addTopic(...args),
    readMoreMeetingContext: (...args: unknown[]) =>
      readMoreMeetingContext(...args),
  }),
);

const { BeforeYouMeet } = await import(
  '@/app/(signed-in)/(sidebar)/one-on-ones/_components/before-you-meet'
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
const PLOY = { accountId: 'account-ploy', name: 'Ploy Chaiyo', photoUrl: null };
const MINT_PERSON = { accountId: MINT, name: 'Mint Suwan', photoUrl: null };

function feedback(
  id: string,
  overrides: Partial<Extract<MeetingContextCard, { kind: 'FEEDBACK' }>> = {},
): MeetingContextCard {
  return {
    kind: 'FEEDBACK',
    messageTags: NO_TEXT_TAGS,
    id: `0196b4c8-0000-7000-8000-0000000001${id}`,
    giver: PLOY,
    receiverAccountIds: [MINT],
    message: `The demo walkthrough number ${id} was clear.`,
    question: null,
    writtenAt: '2026-11-30T03:00:00.000Z',
    ...overrides,
  };
}

const KUDOS: MeetingContextCard = {
  kind: 'KUDOS',
  messageTags: NO_TEXT_TAGS,
  id: '0196b4c8-0000-7000-8000-000000000201',
  giver: { accountId: 'account-nok', name: 'Nok', photoUrl: null },
  recipientAccountIds: [MINT],
  message: 'Thank you for staying late to get the release out.',
  writtenAt: '2026-11-29T03:00:00.000Z',
};

const ASK: MeetingContextCard = {
  kind: 'ASK',
  messageTags: NO_TEXT_TAGS,
  id: '0196b4c8-0000-7000-8000-000000000301',
  requester: MINT_PERSON,
  askedAccountId: ME,
  question: 'How did the onboarding doc land?',
  askedAt: '2026-11-07T03:00:00.000Z',
};

function tab(
  items: readonly MeetingContextCard[],
  overrides: Partial<MeetingContextTabView> = {},
): MeetingContextTabView {
  return { items, count: items.length, nextCursor: null, ...overrides };
}

function context(
  tabs: Partial<Record<MeetingContextTab, MeetingContextTabView>>,
  overrides: Partial<Omit<MeetingContextView, 'tabs'>> = {},
): MeetingContextView {
  return {
    since: '2026-11-26T03:00:00.000Z',
    lookback: 'LAST_MEETING',
    tabs: {
      FEEDBACK: tab([]),
      KUDOS: tab([]),
      BETWEEN: tab([]),
      SHARED: tab([]),
      OPEN_ASKS: tab([]),
      ...tabs,
    },
    ...overrides,
  };
}

const EVERY_TAB = context({
  FEEDBACK: tab([feedback('01'), feedback('02')]),
  KUDOS: tab([KUDOS]),
  BETWEEN: tab([
    feedback('03', { giver: MINT_PERSON, receiverAccountIds: [ME] }),
  ]),
  OPEN_ASKS: tab([ASK]),
});

function draw({
  view = EVERY_TAB,
  onAgenda = [],
  skippedFrom = null,
  isSample = false,
}: {
  view?: MeetingContextView;
  onAgenda?: readonly { kind: 'FEEDBACK' | 'KUDOS'; id: string }[];
  skippedFrom?: string | null;
  /** Drawn on sample data, as in the showcase. */
  isSample?: boolean;
} = {}) {
  const Around = isSample ? SampleDataProvider : Fragment;
  return render(
    <Around>
      <BeforeYouMeet
        workspaceId="workspace-acme"
        oneOnOneId={ONE_ON_ONE_ID}
        meetingId={MEETING_ID}
        context={view}
        people={PEOPLE}
        today="2026-11-28"
        onAgenda={onAgenda}
        skippedFrom={skippedFrom}
      />
      <Toaster />
    </Around>,
  );
}

function cards(name: string) {
  return within(screen.getByRole('list', { name })).getAllByRole('listitem');
}

beforeEach(() => {
  addTopic.mockReset();
  readMoreMeetingContext.mockReset();
  refresh.mockReset();
});

// Sonner keeps its toasts between renders, so one test's would still show in the next.
afterEach(() => {
  toast.dismiss();
});

describe('Before you meet', () => {
  it('offers a Profile’s tabs in its two parts, each counted, and greys the empty ones', () => {
    draw();

    const everyone = screen.getByRole('group', { name: 'Everyone sees' });
    const forYou = screen.getByRole('group', { name: 'For you' });
    expect(
      within(everyone).getByRole('button', { name: 'Feedback 2' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(everyone).getByRole('button', { name: 'Kudos 1' }),
    ).toBeEnabled();
    expect(
      within(forYou).getByRole('button', { name: 'Shared with you 0' }),
    ).toBeDisabled();
    expect(
      within(forYou).getByRole('button', { name: 'Open asks 1' }),
    ).toBeEnabled();
  });

  it('opens on the first tab that holds something, and says behind the “i” what it holds', () => {
    draw({ view: context({ BETWEEN: tab([feedback('03')]) }) });

    expect(
      screen.getByRole('button', { name: 'Between you two 1' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'About Before you meet' }),
    ).toHaveAccessibleDescription(
      'Only what you can already read in Thrive. Mint sees the same about you. Feedback and Kudos you and Mint gave each other, or that someone gave you both.',
    );
  });

  it('says who each card is from and to before its words', async () => {
    const user = userEvent.setup();
    draw();

    expect(cards('Feedback')[0]).toHaveTextContent(
      /Ploy sent to Mint.*The demo walkthrough number 01 was clear\./,
    );
    await user.click(screen.getByRole('button', { name: 'Between you two 1' }));
    expect(cards('Between you two')[0]).toHaveTextContent(
      /Mint sent to you.*The demo walkthrough number 03 was clear\./,
    );
  });

  it('says how long an Ask has waited, and brings it onto the agenda as a request', async () => {
    const user = userEvent.setup();
    addTopic.mockResolvedValue({ ok: true });
    draw();

    await user.click(screen.getByRole('button', { name: 'Open asks 1' }));
    const [ask] = cards('Open asks');
    expect(ask).toHaveTextContent('Mint asked you');
    expect(ask).toHaveTextContent('waiting 21 days');
    await user.click(
      within(ask as HTMLElement).getByRole('button', { name: 'Add to agenda' }),
    );

    expect(addTopic).toHaveBeenCalledWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      // Stored once and read by both, so it names Krit rather than saying "you".
      'Mint asked Krit for feedback: How did the onboarding doc land?',
      { kind: 'ASK', id: ASK.id },
    );
  });

  it('shows a tab a page at a time', async () => {
    const user = userEvent.setup();
    const seven = ['01', '02', '03', '04', '05', '06', '07'].map((id) =>
      feedback(id),
    );
    draw({ view: context({ FEEDBACK: tab(seven) }) });
    const pages = screen.getByRole('navigation', { name: 'Feedback pages' });

    expect(cards('Feedback')).toHaveLength(5);
    expect(within(pages).getByText('1–5 of 7')).toBeVisible();
    // At an end it says so rather than being disabled, so focus stays on it.
    expect(
      within(pages).getByRole('button', { name: 'Previous page' }),
    ).toHaveAttribute('aria-disabled', 'true');
    await user.click(within(pages).getByRole('button', { name: 'Next page' }));

    expect(cards('Feedback')).toHaveLength(2);
    expect(within(pages).getByText('6–7 of 7')).toBeVisible();
    const next = within(pages).getByRole('button', { name: 'Next page' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).toHaveFocus();
    // Pressed again at the end, it stays on the last page.
    await user.click(next);
    expect(within(pages).getByText('6–7 of 7')).toBeVisible();
  });

  it('reads the next batch when Next passes the last card loaded, counting what the tab holds', async () => {
    const user = userEvent.setup();
    const firstFive = ['01', '02', '03', '04', '05'].map((id) => feedback(id));
    readMoreMeetingContext.mockResolvedValue({
      items: [feedback('06'), feedback('07')],
      nextCursor: null,
    });
    draw({
      view: context({
        FEEDBACK: tab(firstFive, { count: 7, nextCursor: 'cursor-1' }),
      }),
    });
    const pages = screen.getByRole('navigation', { name: 'Feedback pages' });

    expect(screen.getByRole('button', { name: 'Feedback 7' })).toBeVisible();
    expect(within(pages).getByText('1–5 of 7')).toBeVisible();
    await user.click(within(pages).getByRole('button', { name: 'Next page' }));

    expect(readMoreMeetingContext).toHaveBeenCalledWith('workspace-acme', {
      aboutAccountId: MINT,
      tab: 'FEEDBACK',
      since: '2026-11-26T03:00:00.000Z',
      cursor: 'cursor-1',
    });
    expect(await within(pages).findByText('6–7 of 7')).toBeVisible();
    expect(cards('Feedback')).toHaveLength(2);
  });

  it('reads no next batch on sample data, as in the showcase, and says so', async () => {
    const user = userEvent.setup();
    const firstFive = ['01', '02', '03', '04', '05'].map((id) => feedback(id));
    draw({
      view: context({
        FEEDBACK: tab(firstFive, { count: 7, nextCursor: 'cursor-1' }),
      }),
      isSample: true,
    });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(readMoreMeetingContext).not.toHaveBeenCalled();
    expect(
      await screen.findByText('In the showcase, nothing is sent.'),
    ).toBeVisible();
    expect(screen.getByText('1–5 of 7')).toBeVisible();
  });

  it('stays on the page and says so when the next batch could not be read', async () => {
    const user = userEvent.setup();
    const firstFive = ['01', '02', '03', '04', '05'].map((id) => feedback(id));
    readMoreMeetingContext.mockResolvedValue(null);
    draw({
      view: context({
        FEEDBACK: tab(firstFive, { count: 7, nextCursor: 'cursor-1' }),
      }),
    });

    await user.click(screen.getByRole('button', { name: 'Next page' }));

    expect(
      await screen.findByText('Couldn’t read the next page. Try again.'),
    ).toBeVisible();
    expect(screen.getByText('1–5 of 7')).toBeVisible();
  });

  it('brings a card onto the agenda as a topic that names it, then says it is there', async () => {
    const user = userEvent.setup();
    addTopic.mockResolvedValue({ ok: true });
    draw({ view: context({ KUDOS: tab([KUDOS]) }) });

    await user.click(screen.getByRole('button', { name: 'Add to agenda' }));

    expect(addTopic).toHaveBeenCalledWith(
      'workspace-acme',
      ONE_ON_ONE_ID,
      MEETING_ID,
      'Nok sent to Mint: Thank you for staying late to get the release out.',
      { kind: 'KUDOS', id: KUDOS.id },
    );
    // No toast: the topic is seen landing on the agenda; a screen reader is told in words.
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Added to the agenda',
      ),
    );
    expect(screen.getAllByText('Added to the agenda')).toHaveLength(1);
    // The same button now says it is there, and keeps the focus the press gave it.
    const there = screen.getByRole('button', { name: 'On the agenda' });
    expect(there).toHaveFocus();
    expect(there).toHaveAttribute('aria-disabled', 'true');
    expect(there).toHaveAccessibleDescription(/^Kudos: Nok sent to Mint/);
    await user.click(there);
    expect(addTopic).toHaveBeenCalledTimes(1);
  });

  it('offers Add to agenda again when bringing it was refused', async () => {
    const user = userEvent.setup();
    addTopic.mockResolvedValue({
      ok: false,
      message: 'That’s already on the agenda.',
    });
    draw({ view: context({ KUDOS: tab([KUDOS]) }) });

    await user.click(screen.getByRole('button', { name: 'Add to agenda' }));

    expect(
      await screen.findByText('That’s already on the agenda.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Add to agenda' }),
      ).toBeEnabled(),
    );
  });

  it('offers Add to agenda again once the topic it brought is taken off the agenda', async () => {
    const user = userEvent.setup();
    addTopic.mockResolvedValue({ ok: true });
    const view = context({ KUDOS: tab([KUDOS]) });
    const { rerender } = draw({ view });
    const drawn = (onAgenda: readonly { kind: 'KUDOS'; id: string }[]) => (
      <BeforeYouMeet
        workspaceId="workspace-acme"
        oneOnOneId={ONE_ON_ONE_ID}
        meetingId={MEETING_ID}
        context={view}
        people={PEOPLE}
        today="2026-11-28"
        onAgenda={onAgenda}
        skippedFrom={null}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Add to agenda' }));
    rerender(drawn([{ kind: 'KUDOS', id: KUDOS.id }]));
    expect(screen.getByText('On the agenda')).toBeVisible();

    rerender(drawn([]));
    expect(screen.queryByText('On the agenda')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add to agenda' })).toBeEnabled();
  });

  it('says what is on the agenda already', () => {
    draw({
      view: context({ KUDOS: tab([KUDOS]) }),
      onAgenda: [{ kind: 'KUDOS', id: KUDOS.id }],
    });

    expect(screen.getByText('On the agenda')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Add to agenda' })).toBeNull();
  });

  it('folds on Hide and opens again on Show', async () => {
    const user = userEvent.setup();
    draw();

    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(screen.getByRole('button', { name: 'Show' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('list', { name: 'Feedback' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(cards('Feedback')).toHaveLength(2);
  });

  it('says plainly when nothing came and nothing waits', () => {
    draw({ view: context({}) });

    expect(
      screen.getByText(
        'Nothing new about Mint since Thu 26 Nov, and no open asks.',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('group', { name: 'For you' })).toBeNull();
  });

  it('reads the last 30 days before the first meeting', () => {
    draw({ view: context({}, { lookback: 'FIRST_30_DAYS' }) });

    expect(
      screen.getByRole('heading', {
        name: /Before you meet\s*the last 30 days/,
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Nothing new about Mint in the last 30 days, and no open asks.',
      ),
    ).toBeVisible();
  });

  it('says a skipped day is why it goes back further', () => {
    draw({ skippedFrom: '2026-12-03' });

    expect(
      screen.getByText(
        'Thu 3 Dec was skipped, so this goes back to your last meeting.',
      ),
    ).toBeVisible();
  });
});
