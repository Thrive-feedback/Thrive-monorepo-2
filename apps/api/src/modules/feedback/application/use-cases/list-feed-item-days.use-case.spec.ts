import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import type { FeedItemShow } from '../types/feedback-request.types';
import { ListFeedItemDaysUseCase } from './list-feed-item-days.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';

/** Sunday 22 November 2026, ten in the morning on the clock. */
const NOW = new Date('2026-11-22T03:00:00.000Z');

function feedback(
  id: string,
  createdAt: string,
  overrides: Partial<{
    workspaceId: string;
    origin: 'REQUESTED' | 'OFFERED';
    visibility: string;
    selectedAccountIds: readonly string[];
  }> = {},
) {
  return {
    id,
    workspaceId: WORKSPACE_ID,
    origin: 'OFFERED' as const,
    feedbackRequestId: null,
    giverAccountId: BEN,
    receiverAccountIds: [CARA],
    message: `Feedback ${id}.`,
    postcard: null,
    tags: NO_TAGS,
    createdAt: new Date(createdAt),
    visibility: 'EVERYONE',
    selectedAccountIds: [],
    ...overrides,
  };
}

function kudos(id: string, createdAt: string, workspaceId = WORKSPACE_ID) {
  return {
    id,
    workspaceId,
    giverAccountId: BEN,
    recipientAccountIds: [CARA],
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt: new Date(createdAt),
  };
}

/** Each piece is named for what Ana's count should do with it. */
function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.feedbackWithVisibility.push(
    feedback('offered-today', '2026-11-22T01:00:00.000Z'),
    // 23:30 UTC on the 21st is already the 22nd on the clock.
    feedback('offered-late-last-night-in-utc', '2026-11-21T23:30:00.000Z'),
    feedback('an-answer-on-friday', '2026-11-20T05:00:00.000Z', {
      origin: 'REQUESTED',
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA],
    }),
    feedback('selects-somebody-else', '2026-11-20T06:00:00.000Z', {
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [DAN],
    }),
    feedback('only-them', '2026-11-19T06:00:00.000Z', {
      visibility: 'ONLY_ME',
    }),
    feedback('another-workspace', '2026-11-19T06:00:00.000Z', {
      workspaceId: OTHER_WORKSPACE_ID,
    }),
    feedback('before-the-week', '2026-11-15T16:59:59.999Z'),
  );
  const kudosQuery = new FakeKudosQuery();
  kudosQuery.rows.push(
    kudos('kudos-today', '2026-11-22T02:00:00.000Z'),
    kudos('kudos-monday', '2026-11-16T02:00:00.000Z'),
    kudos('kudos-elsewhere', '2026-11-22T02:00:00.000Z', OTHER_WORKSPACE_ID),
  );
  return new ListFeedItemDaysUseCase(
    new FakeClock(NOW),
    feedbackRequestQuery,
    kudosQuery,
  );
}

function countFor(show: FeedItemShow) {
  return setUp().execute({
    workspaceId: WORKSPACE_ID,
    readerAccountId: ANA,
    show,
  });
}

describe('counting the last seven days of Home', () => {
  it('counts seven days, today last, the quiet ones too', async () => {
    const { days } = await countFor('ALL');

    expect(days.map(({ day }) => day)).toEqual([
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ]);
    expect(days.at(-1)).toEqual({
      day: '2026-11-22',
      offeredFeedback: 2,
      requestedFeedback: 0,
      kudos: 1,
    });
    expect(days[4]).toEqual({
      day: '2026-11-20',
      offeredFeedback: 0,
      requestedFeedback: 1,
      kudos: 0,
    });
    expect(days[0]?.kudos).toBe(1);
  });

  it('counts only what the reader can read, in this Workspace, in the week', async () => {
    expect((await countFor('ALL')).totals).toEqual({
      offeredFeedback: 2,
      requestedFeedback: 1,
      kudos: 2,
    });
  });

  it('counts what was shared with the reader, and no Kudos, under Shared with me', async () => {
    expect((await countFor('SHARED_WITH_ME')).totals).toEqual({
      offeredFeedback: 0,
      requestedFeedback: 1,
      kudos: 0,
    });
  });

  it('counts what everyone reads under Everyone', async () => {
    expect((await countFor('EVERYONE')).totals).toEqual({
      offeredFeedback: 2,
      requestedFeedback: 0,
      kudos: 2,
    });
  });
});
