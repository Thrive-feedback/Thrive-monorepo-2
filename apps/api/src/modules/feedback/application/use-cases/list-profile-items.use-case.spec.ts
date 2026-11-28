import { describe, expect, it } from 'bun:test';
import type { VisibilityValue } from '@app/modules/feedback/domain/value-object/visibility.vo';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { betweenDanAndAnn, onDay } from '@test/support/profile-between.fixture';
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
  giverAccountId = BEN,
) {
  return {
    workspaceId,
    id,
    giverAccountId,
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
  since: null,
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

function setUpBetween() {
  const { feedbackRequestQuery, kudosQuery } = betweenDanAndAnn();
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

const BETWEEN_DAN_AND_ANN = {
  ...ANNS_FEEDBACK,
  readerAccountId: DAN,
  show: 'BETWEEN_US',
} as const;

const OPEN_ASKS_OF_DAN_AND_ANN = {
  ...BETWEEN_DAN_AND_ANN,
  show: 'OPEN_ASKS',
} as const;

describe('reading what is between a Profile’s reader and its Member', () => {
  it('lists the Feedback and Kudos the two gave each other, and what somebody gave both, at every Visibility, newest first', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute(BETWEEN_DAN_AND_ANN);

    expect(page.items.map((item) => item.id)).toEqual([
      'kudos-ben-to-both',
      'kudos-ann-to-dan',
      'kudos-dan-to-ann',
      'dan-answers-ann',
      'dan-to-ann-and-cara',
      'ben-to-both',
      'ann-to-dan-only',
      'dan-to-ann-only',
    ]);
  });

  it('leaves out what went to only one of them, the open Asks, and other Workspaces', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute(BETWEEN_DAN_AND_ANN);

    expect(page.items.map((item) => item.id)).not.toContainAnyValues([
      'ben-to-ann',
      'ben-to-dan',
      'kudos-ben-to-ann',
      'ask-ann-dan',
      'ask-dan-ann',
      'elsewhere',
      'kudos-elsewhere',
    ]);
  });

  it('keeps from the reader another Giver’s answer on the same card that they may not read', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute(BETWEEN_DAN_AND_ANN);
    const answer = page.items.find((item) => item.id === 'dan-answers-ann');

    expect(
      answer?.kind === 'FEEDBACK'
        ? answer.request?.asked.map((ask) => ask.answer?.message ?? null)
        : null,
    ).toEqual([`${DAN} answered`, null]);
  });

  it('lists only what was written at or after `since`', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute({
      ...BETWEEN_DAN_AND_ANN,
      since: onDay(17),
    });

    expect(page.items.map((item) => item.id)).toEqual([
      'kudos-ben-to-both',
      'kudos-ann-to-dan',
      'kudos-dan-to-ann',
      'dan-answers-ann',
    ]);
  });

  it('holds nothing for the Member reading their own Profile, private Feedback to them included', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute({
      ...BETWEEN_DAN_AND_ANN,
      readerAccountId: ANN,
    });

    expect(page.items).toEqual([]);
  });
});

describe('reading the Asks open between a Profile’s reader and its Member', () => {
  it('lists the Asks either sent the other that still wait, newest first', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute(OPEN_ASKS_OF_DAN_AND_ANN);

    expect(page.items.map((item) => item.id)).toEqual([
      'ask-dan-ann',
      'ask-ann-dan',
    ]);
  });

  it('names who asked and who was asked on an open Ask', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute(OPEN_ASKS_OF_DAN_AND_ANN);
    const ask = page.items.find((item) => item.id === 'ask-dan-ann');

    expect(
      ask?.kind === 'ASK'
        ? [ask.requester.accountId, ask.asked.accountId]
        : null,
    ).toEqual([DAN, ANN]);
  });

  it('holds nothing for the Member reading their own Profile', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute({
      ...OPEN_ASKS_OF_DAN_AND_ANN,
      readerAccountId: ANN,
    });

    expect(page.items).toEqual([]);
  });

  it('pages on from an open Ask a cursor names', async () => {
    const { useCase } = setUpBetween();

    const page = await useCase.execute({
      ...OPEN_ASKS_OF_DAN_AND_ANN,
      page: { afterId: null, limit: 1 },
    });
    const next = await useCase.execute({
      ...OPEN_ASKS_OF_DAN_AND_ANN,
      page: { afterId: page.nextAfterId, limit: 1 },
    });

    expect([page.nextAfterId, next.items.map((item) => item.id)]).toEqual([
      'ask-dan-ann',
      ['ask-ann-dan'],
    ]);
  });
});
