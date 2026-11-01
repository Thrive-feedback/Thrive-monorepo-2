import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import type { FeedItemsView } from '../types/feed-items.types';
import type { FeedItemShow } from '../types/feedback-request.types';
import { ListFeedItemsUseCase } from './list-feed-items.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const FIRST_PAGE = { afterId: null, limit: 20 };
const ANSWERED_AT = new Date('2026-10-11T03:00:00.000Z');

function feedback(
  id: string,
  day: number,
  overrides: Partial<{
    workspaceId: string;
    origin: 'REQUESTED' | 'OFFERED';
    feedbackRequestId: string | null;
    giverAccountId: string;
    receiverAccountIds: readonly string[];
    visibility: string;
    selectedAccountIds: readonly string[];
  }>,
) {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    origin: 'OFFERED' as const,
    feedbackRequestId: null,
    giverAccountId: BEN,
    receiverAccountIds: [CARA],
    message: `Written on day ${day}.`,
    postcard: null,
    tags: NO_TAGS,
    createdAt: new Date(`2026-10-${day}T03:00:00.000Z`),
    visibility: 'EVERYONE',
    selectedAccountIds: [],
    ...overrides,
  };
}

/** Each piece is named for what Ana's Home should do with it. */
function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.feedbackWithVisibility.push(
    feedback('to-everyone', 11, {}),
    feedback('to-everyone-about-ana', 12, { receiverAccountIds: [ANA] }),
    feedback('selects-ana', 13, {
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA],
    }),
    feedback('selects-somebody-else', 14, {
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [DAN],
    }),
    feedback('written-to-ana-for-one-other', 15, {
      receiverAccountIds: [ANA],
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [DAN],
    }),
    feedback('written-by-ana-for-one-other', 16, {
      giverAccountId: ANA,
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [DAN],
    }),
    feedback('only-them', 17, {
      receiverAccountIds: [ANA],
      visibility: 'ONLY_ME',
    }),
    feedback('another-workspace', 18, { workspaceId: OTHER_WORKSPACE_ID }),
    feedback('an-answer', 19, {
      origin: 'REQUESTED',
      feedbackRequestId: REQUEST_ID,
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA],
    }),
  );
  // Ben asked Cara and Dan, and shared what comes back with Ana.
  feedbackRequestQuery.rows.push({
    id: REQUEST_ID,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: CARA,
    message: 'How clear was the plan?',
    postcard: null,
    tags: NO_TAGS,
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: [ANA],
    createdAt: new Date('2026-10-10T03:00:00.000Z'),
    asks: [
      {
        askId: '0199a0f0-0000-7000-8000-0000000000a1',
        giverAccountId: BEN,
        status: 'ANSWERED',
      },
      {
        askId: '0199a0f0-0000-7000-8000-0000000000a2',
        giverAccountId: DAN,
        status: 'PENDING',
      },
    ],
  });
  feedbackRequestQuery.answers.push({
    askId: '0199a0f0-0000-7000-8000-0000000000a1',
    message: 'The order of the steps was clear.',
    tags: NO_TAGS,
    answeredAt: ANSWERED_AT,
  });
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: BEN,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
      slug: null,
      photoUrl: null,
    },
    {
      accountId: CARA,
      email: 'cara@acme.test',
      fullName: 'Cara Diaz',
      displayName: 'Cara',
      slug: null,
      photoUrl: null,
    },
    {
      accountId: DAN,
      email: 'dan@acme.test',
      fullName: 'Dan Evans',
      displayName: 'Dan',
      slug: null,
      photoUrl: null,
    },
  );
  const kudosQuery = new FakeKudosQuery();
  const useCase = new ListFeedItemsUseCase(
    feedbackRequestQuery,
    kudosQuery,
    new PeopleService(accountSummaryPort, new FakeWorkspaceMembershipPort()),
  );
  return { accountSummaryPort, kudosQuery, useCase };
}

/** The Feedback on a page, for what only Feedback carries. */
function feedbackOf(page: FeedItemsView) {
  return page.items.flatMap((item) => (item.kind === 'FEEDBACK' ? [item] : []));
}

function kudosRow(
  id: string,
  createdAt: Date,
  overrides: { workspaceId?: string; recipients?: readonly string[] } = {},
) {
  return {
    id,
    workspaceId: overrides.workspaceId ?? WORKSPACE_ID,
    giverAccountId: BEN,
    recipientAccountIds: overrides.recipients ?? [],
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt,
  };
}

describe('reading Home', () => {
  it('holds everything shown to everyone and everything the reader was selected for, newest first', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      show: 'ALL',
      page: FIRST_PAGE,
    });

    expect(home.items.map((item) => item.id)).toEqual([
      'an-answer',
      'selects-ana',
      'to-everyone-about-ana',
      'to-everyone',
    ]);
  });

  it('shows only what was shown to everyone under Everyone in the Workspace', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      show: 'EVERYONE',
      page: FIRST_PAGE,
    });

    expect(home.items.map((item) => item.id)).toEqual([
      'to-everyone-about-ana',
      'to-everyone',
    ]);
    expect(
      feedbackOf(home).every((item) => item.visibility === 'EVERYONE'),
    ).toBe(true);
  });

  it('shows only what the reader was selected for under Shared with me', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      show: 'SHARED_WITH_ME',
      page: FIRST_PAGE,
    });

    expect(home.items.map((item) => item.id)).toEqual([
      'an-answer',
      'selects-ana',
    ]);
    expect(
      feedbackOf(home).every((item) => item.visibility === 'SELECTED_PEOPLE'),
    ).toBe(true);
  });

  it('gives an answer its question, who asked it, and everyone asked with where they stand', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      show: 'SHARED_WITH_ME',
      page: FIRST_PAGE,
    });

    const [answer] = feedbackOf(home);
    expect(answer?.request?.message).toBe('How clear was the plan?');
    expect(answer?.request?.requester.name).toBe('Cara Diaz');
    expect(
      answer?.request?.asked.map((ask) => [
        ask.person.name,
        ask.status,
        ask.answer?.message ?? null,
      ]),
    ).toEqual([
      ['Ben Carter', 'ANSWERED', 'The order of the steps was clear.'],
      ['Dan Evans', 'PENDING', null],
    ]);
  });

  it('gives Feedback nobody asked for no question', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      show: 'EVERYONE',
      page: FIRST_PAGE,
    });

    expect(feedbackOf(home).every((item) => item.request === null)).toBe(true);
  });

  it('pages through all of it with one cursor, repeating and skipping nothing', async () => {
    const { useCase } = setUp();
    const page = (afterId: string | null) =>
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        readerAccountId: ANA,
        show: 'ALL',
        page: { afterId, limit: 3 },
      });

    const first = await page(null);
    const second = await page(first.nextAfterId);

    expect(first.items.map((item) => item.id)).toEqual([
      'an-answer',
      'selects-ana',
      'to-everyone-about-ana',
    ]);
    expect(first.nextAfterId).toBe('to-everyone-about-ana');
    expect(second.items.map((item) => item.id)).toEqual(['to-everyone']);
    expect(second.nextAfterId).toBeNull();
  });

  it('holds nothing of another reader’s selection', async () => {
    const { useCase } = setUp();

    const home = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: BEN,
      show: 'SHARED_WITH_ME',
      page: FIRST_PAGE,
    });

    expect(home.items).toEqual([]);
    expect(home.nextAfterId).toBeNull();
  });

  describe('with Kudos among it', () => {
    /** Newer than every piece of Feedback set up above. */
    const NEWEST = new Date('2030-01-01T00:00:00.000Z');
    /** Older than every piece of Feedback set up above. */
    const OLDEST = new Date('2000-01-01T00:00:00.000Z');

    function read(
      useCase: ListFeedItemsUseCase,
      show: FeedItemShow,
      afterId: string | null = null,
      limit = 20,
    ) {
      return useCase.execute({
        workspaceId: WORKSPACE_ID,
        readerAccountId: ANA,
        show,
        page: { afterId, limit },
      });
    }

    it('puts Kudos among the Feedback, by date', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(
        kudosRow('newest-kudos', NEWEST),
        kudosRow('oldest-kudos', OLDEST),
      );

      const home = await read(useCase, 'ALL');

      expect(home.items.at(0)?.id).toBe('newest-kudos');
      expect(home.items.at(-1)?.id).toBe('oldest-kudos');
      expect(home.items.at(0)?.kind).toBe('KUDOS');
      expect(home.items.at(1)?.kind).toBe('FEEDBACK');
    });

    it('names everyone on a Kudos, with their face', async () => {
      const { accountSummaryPort, kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(kudosRow('kudos', NEWEST, { recipients: [CARA] }));

      const home = await read(useCase, 'ALL');

      expect(home.items[0]).toMatchObject({
        kind: 'KUDOS',
        giver: { accountId: BEN, name: 'Ben Carter' },
        recipients: [{ accountId: CARA, name: 'Cara Diaz' }],
      });
      expect(accountSummaryPort.calls).toHaveLength(1);
    });

    it('holds every Kudos under Everyone in the Workspace', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(kudosRow('for-the-workspace', NEWEST));

      const home = await read(useCase, 'EVERYONE');

      expect(home.items.at(0)?.id).toBe('for-the-workspace');
    });

    it('holds only the Kudos that name the reader under Shared with me', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(
        kudosRow('names-ana', NEWEST, { recipients: [ANA] }),
        kudosRow('names-cara', NEWEST, { recipients: [CARA] }),
        kudosRow('for-the-workspace', NEWEST),
      );

      const home = await read(useCase, 'SHARED_WITH_ME');

      expect(
        home.items.filter((item) => item.kind === 'KUDOS').map(({ id }) => id),
      ).toEqual(['names-ana']);
    });

    it('holds nothing from another Workspace', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(
        kudosRow('elsewhere', NEWEST, { workspaceId: 'another-workspace' }),
      );

      const home = await read(useCase, 'ALL');

      expect(home.items.map(({ id }) => id)).not.toContain('elsewhere');
    });

    it('pages across both with one cursor, a Kudos as good a place to stop as Feedback', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(
        kudosRow('newest-kudos', NEWEST),
        kudosRow('oldest-kudos', OLDEST),
      );

      const everything = await read(useCase, 'ALL');
      const seen: string[] = [];
      let afterId: string | null = null;
      do {
        const page: FeedItemsView = await read(useCase, 'ALL', afterId, 2);
        seen.push(...page.items.map(({ id }) => id));
        afterId = page.nextAfterId;
      } while (afterId !== null);

      expect(seen).toEqual(everything.items.map(({ id }) => id));
    });

    it('breaks a tie the same way on every page', async () => {
      const { kudosQuery, useCase } = setUp();
      kudosQuery.rows.push(
        kudosRow('tie-a', NEWEST),
        kudosRow('tie-b', NEWEST),
        kudosRow('tie-c', NEWEST),
      );

      const first = await read(useCase, 'ALL', null, 2);
      const second = await read(useCase, 'ALL', first.nextAfterId, 1);

      expect(first.items.map(({ id }) => id)).toEqual(['tie-c', 'tie-b']);
      expect(second.items.map(({ id }) => id)).toEqual(['tie-a']);
    });

    it('ends the list when the cursor names a row that is gone', async () => {
      const { useCase } = setUp();

      expect(await read(useCase, 'ALL', 'a-row-that-is-gone')).toEqual({
        items: [],
        nextAfterId: null,
      });
    });
  });
});
