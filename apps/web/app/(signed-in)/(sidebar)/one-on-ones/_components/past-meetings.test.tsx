import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Meeting } from '@/app/(signed-in)/(sidebar)/one-on-ones/_lib/one-on-one-meeting.type';
import type { Teammate } from '@/lib/feedback/teammate.type';

vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/one-on-ones',
}));
vi.mock(
  '@/app/(signed-in)/(sidebar)/_lib/send-postcard-actions.service',
  () => ({
    sendPostcardFeedback: vi.fn(),
    sendPostcardRequest: vi.fn(),
    sendKudosCard: vi.fn(),
  }),
);

const { PastMeetings } = await import('./past-meetings');

const ME = 'account-me';
const MINT: Teammate = {
  accountId: 'account-mint',
  name: 'Mint Boonmee',
  displayName: 'Mint',
  email: 'mint@acme.test',
  photoUrl: null,
  slug: 'mint',
};

const PEOPLE = {
  readerAccountId: ME,
  readerName: 'Krit',
  otherAccountId: MINT.accountId,
  otherName: 'Mint',
};
const TEMPLATE_NAMES = [{ key: 'weekly-check-in', name: 'Weekly check-in' }];

function finished(id: string, day: string, overrides: Partial<Meeting> = {}) {
  return {
    id,
    state: 'FINISHED',
    templateKey: 'weekly-check-in',
    occursAt: `${day}T03:00:00.000Z`,
    startedAt: `${day}T03:00:00.000Z`,
    startedByAccountId: ME,
    finishedAt: `${day}T03:30:00.000Z`,
    finishedByAccountId: MINT.accountId,
    topics: [
      {
        id: `${id}-t1`,
        text: 'Launch retro',
        source: 'CARRIED',
        authorAccountId: null,
        position: 0,
        notes: 'Shipped on time',
        notesUpdatedAt: null,
        notesUpdatedByAccountId: null,
        discussedAt: `${day}T03:05:00.000Z`,
        broughtFrom: null,
        templateKey: null,
      },
      {
        id: `${id}-t2`,
        text: 'Hiring',
        source: 'TEMPLATE',
        authorAccountId: null,
        position: 1,
        notes: '',
        notesUpdatedAt: null,
        notesUpdatedByAccountId: null,
        discussedAt: null,
        broughtFrom: null,
        templateKey: 'weekly-check-in',
      },
    ],
    ...overrides,
  } satisfies Meeting;
}

const COMPOSE = {
  workspaceId: '0196b4c8-0000-7000-8000-0000000000ff',
  teammates: [MINT],
  workspaceGoals: [],
  writer: { name: 'Krit', photoUrl: null },
};

describe('PastMeetings', () => {
  it('says where each topic of a summary came from, those carried over too', () => {
    render(
      <PastMeetings
        meetings={[finished('m1', '2026-11-19')]}
        other={MINT}
        people={PEOPLE}
        templates={TEMPLATE_NAMES}
      />,
    );

    // Talked about, and carried from the meeting before.
    expect(
      screen.getByRole('heading', { name: /Launch retro/ }),
    ).toHaveTextContent(/^Launch retro\s*,\s*From last time$/);
    // Not reached, so it carries over, still saying which template asked it.
    expect(screen.getByText('Hiring').closest('li')).toHaveTextContent(
      /^Hiring\s*,\s*From Weekly check-in$/,
    );
  });

  it('lists finished meetings newest first, the newest open with its summary', () => {
    render(
      <PastMeetings
        meetings={[finished('m2', '2026-11-26'), finished('m1', '2026-11-19')]}
        other={MINT}
        people={PEOPLE}
        templates={TEMPLATE_NAMES}
        compose={COMPOSE}
      />,
    );

    const [newest, older] = screen.getAllByRole('button', { expanded: true });
    expect(newest).toHaveTextContent('Thu 26 Nov');
    expect(older).toBeUndefined();
    // When it ran and what it came to, under the day.
    expect(
      screen.getAllByText('10:00–10:30 · 1 discussed · 1 carried over'),
    ).toHaveLength(2);
    expect(screen.getByText('Shipped on time')).toBeVisible();
    expect(screen.getByText('Carries over to next time')).toBeVisible();
  });

  it('offers Give and Kudos on each meeting, and opens the Feedback postcard started from it', async () => {
    render(
      <PastMeetings
        meetings={[finished('m1', '2026-11-19')]}
        other={MINT}
        people={PEOPLE}
        templates={TEMPLATE_NAMES}
        compose={COMPOSE}
      />,
    );

    expect(
      screen.getByRole('button', {
        name: 'Give Mint Boonmee kudos, from the meeting on Thu 19 Nov',
      }),
    ).toBeVisible();
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Give Mint Boonmee feedback, from the meeting on Thu 19 Nov',
      }),
    );

    // The postcard composer is heavy to mount; under a full parallel run it can take past the
    // default second, which made this test fail only when the whole suite ran.
    expect(
      await screen.findByRole('dialog', {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(
      await screen.findByDisplayValue(/From our 1:1 on Thu 19 Nov:/),
    ).toBeInTheDocument();
  });

  it('lists the days skipped among those held, a run as one row, and says when a meeting ran late or early', () => {
    render(
      <PastMeetings
        meetings={[
          // For Thu 26 Nov, held early on Tue 24 Nov.
          finished('m3', '2026-11-26', {
            startedAt: '2026-11-24T03:00:00.000Z',
          }),
          // For Thu 5 Nov, held late on Sat 7 Nov.
          finished('m1', '2026-11-05', {
            startedAt: '2026-11-07T03:00:00.000Z',
          }),
        ]}
        skippedDays={['2026-11-12', '2026-11-19']}
        other={MINT}
        people={PEOPLE}
        templates={TEMPLATE_NAMES}
      />,
    );

    // The outer list only: an open meeting's summary lists its topics too.
    const [list] = screen.getAllByRole('list');
    const rows = [...(list?.children ?? [])].map((row) => row.textContent);
    expect(rows[0]).toContain('Thu 26 Nov');
    expect(rows[0]).toContain('Held early, Tue 24 Nov');
    expect(rows[1]).toBe('Thu 12 Nov – Thu 19 NovSkipped 2 meetings');
    expect(rows[2]).toContain('Held late, Sat 7 Nov');
  });

  it('says so when no meeting has finished yet', () => {
    render(
      <PastMeetings
        meetings={[]}
        other={MINT}
        people={PEOPLE}
        templates={TEMPLATE_NAMES}
      />,
    );

    expect(screen.getByText(/No past meetings yet/)).toBeVisible();
  });
});
