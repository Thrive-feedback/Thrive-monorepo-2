import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
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
  const useCase = new ListFeedItemsUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, new FakeWorkspaceMembershipPort()),
  );
  return { useCase };
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
    expect(home.items.every((item) => item.visibility === 'EVERYONE')).toBe(
      true,
    );
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
      home.items.every((item) => item.visibility === 'SELECTED_PEOPLE'),
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

    const [answer] = home.items;
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

    expect(home.items.every((item) => item.request === null)).toBe(true);
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
});
