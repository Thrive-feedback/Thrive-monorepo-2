import { describe, expect, it } from 'bun:test';
import type { VisibilityValue } from '@app/modules/feedback/domain/value-object/visibility.vo';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { PersonalItemsService } from '../service/personal-items.service';
import { ListProfileItemsUseCase } from './list-profile-items.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';

function on(day: number) {
  return new Date(`2026-10-${day}T03:00:00.000Z`);
}

function feedbackRow(
  id: string,
  day: number,
  visibility: VisibilityValue,
  { receiverAccountId = ANN, workspaceId = WORKSPACE_ID } = {},
) {
  return {
    workspaceId,
    id,
    origin: 'OFFERED',
    feedbackRequestId: null,
    giverAccountId: BEN,
    receiverAccountIds: [receiverAccountId],
    message: `Feedback ${id}`,
    tags: NO_TAGS,
    visibility,
    postcard: null,
    request: null,
    createdAt: on(day),
  } as const;
}

function answerRow(id: string, day: number, visibility: VisibilityValue) {
  return {
    ...feedbackRow(id, day, visibility),
    origin: 'REQUESTED',
    feedbackRequestId: `request-${id}`,
    giverAccountId: CARA,
    request: {
      message: 'How was the launch?',
      tags: NO_TAGS,
      requesterAccountId: ANN,
      asks: [
        {
          giverAccountId: CARA,
          status: 'ANSWERED',
          answer: {
            message: `Feedback ${id}`,
            tags: NO_TAGS,
            answeredAt: on(day),
          },
        },
      ],
      postcard: null,
      answerPostcard: null,
    },
  } as const;
}

function kudosRow(
  id: string,
  day: number,
  recipientAccountIds: readonly string[] = [ANN],
  workspaceId = WORKSPACE_ID,
) {
  return {
    workspaceId,
    id,
    giverAccountId: BEN,
    recipientAccountIds,
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt: on(day),
  };
}

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.receivedItems.push(
    feedbackRow('offered-everyone', 11, 'EVERYONE'),
    answerRow('answer-everyone', 13, 'EVERYONE'),
    feedbackRow('offered-only-me', 14, 'ONLY_ME'),
    {
      ...answerRow('answer-selected', 15, 'SELECTED_PEOPLE'),
      selectedAccountIds: [DAN],
    },
    {
      ...feedbackRow('offered-selected-dan', 21, 'SELECTED_PEOPLE'),
      selectedAccountIds: [DAN],
    },
    {
      ...feedbackRow('offered-selected-cara', 22, 'SELECTED_PEOPLE'),
      selectedAccountIds: [CARA],
    },
    feedbackRow('to-ben', 16, 'EVERYONE', { receiverAccountId: BEN }),
    feedbackRow('elsewhere', 17, 'EVERYONE', {
      workspaceId: OTHER_WORKSPACE_ID,
    }),
  );
  const kudosQuery = new FakeKudosQuery();
  kudosQuery.rows.push(
    kudosRow('kudos-ann', 12),
    kudosRow('kudos-ben', 18, [BEN]),
    kudosRow('kudos-everyone', 19, []),
    kudosRow('kudos-elsewhere', 20, [ANN], OTHER_WORKSPACE_ID),
  );
  const useCase = new ListProfileItemsUseCase(
    feedbackRequestQuery,
    kudosQuery,
    new PersonalItemsService(
      feedbackRequestQuery,
      kudosQuery,
      new PeopleService(
        new FakeAccountSummaryPort(),
        new FakeWorkspaceMembershipPort(),
      ),
    ),
  );
  return { useCase };
}

const ANNS_FEEDBACK = {
  workspaceId: WORKSPACE_ID,
  accountId: ANN,
  readerAccountId: DAN,
  show: 'FEEDBACK',
  page: { afterId: null, limit: 20 },
} as const;

describe('reading what a Profile shows', () => {
  it('lists the Feedback given to the Member that everyone reads, asked for or not, newest first', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(ANNS_FEEDBACK);

    expect(page.items.map((item) => item.id)).toEqual([
      'answer-everyone',
      'offered-everyone',
    ]);
  });

  it('never lists Feedback kept to Only me or Selected people, not even for the Member themselves', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(ANNS_FEEDBACK);

    expect(page.items.map((item) => item.id)).not.toContainAnyValues([
      'offered-only-me',
      'answer-selected',
      'offered-selected-dan',
    ]);
  });

  it('lists, as shared with the reader, the Feedback given to the Member that somebody selected the reader to read, asked for or not', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      ...ANNS_FEEDBACK,
      show: 'SHARED_WITH_ME',
    });

    expect(page.items.map((item) => item.id)).toEqual([
      'offered-selected-dan',
      'answer-selected',
    ]);
  });

  it('shares nothing with a reader nobody selected', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      ...ANNS_FEEDBACK,
      readerAccountId: BEN,
      show: 'SHARED_WITH_ME',
    });

    expect(page.items).toEqual([]);
  });

  it('shares nothing with the Member reading their own Profile, who cannot be selected', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      ...ANNS_FEEDBACK,
      readerAccountId: ANN,
      show: 'SHARED_WITH_ME',
    });

    expect(page.items).toEqual([]);
  });

  it('lists only the Kudos that name the Member, in this Workspace', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({ ...ANNS_FEEDBACK, show: 'KUDOS' });

    expect(page.items.map((item) => item.id)).toEqual(['kudos-ann']);
  });

  it('pages on from the piece a cursor names', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      ...ANNS_FEEDBACK,
      page: { afterId: null, limit: 1 },
    });
    const next = await useCase.execute({
      ...ANNS_FEEDBACK,
      page: { afterId: page.nextAfterId, limit: 1 },
    });

    expect([page.nextAfterId, next.items.map((item) => item.id)]).toEqual([
      'answer-everyone',
      ['offered-everyone'],
    ]);
  });
});
