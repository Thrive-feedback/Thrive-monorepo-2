import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import { PeopleService } from '../service/people.service';
import { PersonalItemsService } from '../service/personal-items.service';
import { ListGivenItemsUseCase } from './list-given-items.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

const A_CARD = {
  templateKey: 'cobalt-dash',
  textStyle: {
    font: 'signature',
    sizeStep: 4,
    align: 'center',
    ink: 'paper',
  },
  stickers: [],
} as const;

const FIRST_PAGE = { afterId: null, limit: 20 };

function on(day: number) {
  return new Date(`2026-10-${day}T03:00:00.000Z`);
}

function offeredRow(id: string, day: number, giverAccountId = ANN) {
  return {
    workspaceId: WORKSPACE_ID,
    id,
    origin: 'OFFERED',
    feedbackRequestId: null,
    giverAccountId,
    receiverAccountIds: [BEN],
    message: `Feedback ${id}`,
    tags: NO_TAGS,
    visibility: 'ONLY_ME',
    postcard: null,
    request: null,
    createdAt: on(day),
  } as const;
}

/** Ann's answer to Ben's request, beside what Cara answered at the Visibility given. */
function answerRow(
  visibility: VisibilityValue,
  selectedAccountIds: readonly string[] = [],
) {
  return {
    ...offeredRow('answer', 13),
    origin: 'REQUESTED',
    feedbackRequestId: 'request-1',
    receiverAccountIds: [BEN],
    visibility,
    request: {
      message: 'How was the launch?',
      tags: NO_TAGS,
      requesterAccountId: BEN,
      asks: [
        {
          giverAccountId: ANN,
          status: 'ANSWERED',
          answer: {
            message: 'Mine.',
            tags: NO_TAGS,
            answeredAt: on(13),
          },
          answerAudience: { visibility, selectedAccountIds },
        },
        {
          giverAccountId: CARA,
          status: 'ANSWERED',
          answer: {
            message: 'Cara’s.',
            tags: NO_TAGS,
            answeredAt: on(12),
          },
          answerAudience: { visibility, selectedAccountIds },
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
  recipientAccountIds: readonly string[] = [BEN],
  giverAccountId = ANN,
  workspaceId = WORKSPACE_ID,
) {
  return {
    workspaceId,
    id,
    giverAccountId,
    recipientAccountIds,
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: A_CARD,
    createdAt: on(day),
  };
}

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  const kudosQuery = new FakeKudosQuery();
  const useCase = new ListGivenItemsUseCase(
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
  return { feedbackRequestQuery, kudosQuery, useCase };
}

const reading = {
  workspaceId: WORKSPACE_ID,
  giverAccountId: ANN,
  page: FIRST_PAGE,
};

async function othersAnswerAt(
  visibility: VisibilityValue,
  selectedAccountIds?: readonly string[],
) {
  const { feedbackRequestQuery, useCase } = setUp();
  feedbackRequestQuery.givenItems.push(
    answerRow(visibility, selectedAccountIds),
  );
  const [item] = (await useCase.execute(reading)).items;
  if (item?.kind !== 'FEEDBACK') {
    throw new Error('The answer is not in Given.');
  }
  return item.request?.asked[1];
}

describe('reading what a Member gave', () => {
  it('lists what they wrote in this Workspace, both kinds, newest first', async () => {
    const { feedbackRequestQuery, kudosQuery, useCase } = setUp();
    feedbackRequestQuery.givenItems.push(
      offeredRow('f1', 11),
      offeredRow('f3', 13),
    );
    kudosQuery.rows.push(kudosRow('k2', 12));

    const { items, nextAfterId } = await useCase.execute(reading);

    expect(items.map((item) => item.id)).toEqual(['f3', 'k2', 'f1']);
    expect(nextAfterId).toBeNull();
  });

  it('never lists what somebody else wrote, or what was written elsewhere', async () => {
    const { feedbackRequestQuery, kudosQuery, useCase } = setUp();
    feedbackRequestQuery.givenItems.push(offeredRow('f1', 11, BEN));
    kudosQuery.rows.push(
      kudosRow('k2', 12, [ANN], BEN),
      kudosRow('k3', 13, [BEN], ANN, OTHER_WORKSPACE_ID),
    );

    const { items } = await useCase.execute(reading);

    expect(items).toEqual([]);
  });

  it('keeps a Kudos for the whole Workspace, which names nobody', async () => {
    const { kudosQuery, useCase } = setUp();
    kudosQuery.rows.push(kudosRow('k1', 11, []));

    const { items } = await useCase.execute(reading);

    expect(items.map((item) => item.id)).toEqual(['k1']);
  });

  it('carries on from a row of either kind', async () => {
    const { feedbackRequestQuery, kudosQuery, useCase } = setUp();
    feedbackRequestQuery.givenItems.push(
      offeredRow('f1', 11),
      offeredRow('f3', 13),
    );
    kudosQuery.rows.push(kudosRow('k2', 12));

    const { items } = await useCase.execute({
      ...reading,
      page: { afterId: 'k2', limit: 20 },
    });

    expect(items.map((item) => item.id)).toEqual(['f1']);
  });

  it('keeps the Giver’s own answer whatever its Visibility', async () => {
    const { feedbackRequestQuery, useCase } = setUp();
    feedbackRequestQuery.givenItems.push(answerRow('ONLY_ME'));

    const [item] = (await useCase.execute(reading)).items;

    expect(
      item?.kind === 'FEEDBACK' && item.request?.asked[0]?.answer?.message,
    ).toBe('Mine.');
  });

  it('keeps another Giver’s words to themselves under Only me', async () => {
    const asked = await othersAnswerAt('ONLY_ME');

    expect(asked?.status).toBe('ANSWERED');
    expect(asked?.answer).toBeNull();
  });

  it('keeps them to themselves under Selected people the Giver is not among', async () => {
    const asked = await othersAnswerAt('SELECTED_PEOPLE', ['account-dan']);

    expect(asked?.status).toBe('ANSWERED');
    expect(asked?.answer).toBeNull();
  });

  it('shows them under Selected people the Giver is among', async () => {
    const asked = await othersAnswerAt('SELECTED_PEOPLE', [ANN]);

    expect(asked?.answer?.message).toBe('Cara’s.');
  });

  it('shows them when everyone may read them', async () => {
    const asked = await othersAnswerAt('EVERYONE');

    expect(asked?.answer?.message).toBe('Cara’s.');
  });

  it('hands the wire no sign of who may read an answer', async () => {
    const { feedbackRequestQuery, useCase } = setUp();
    feedbackRequestQuery.givenItems.push(answerRow('EVERYONE'));

    const [item] = (await useCase.execute(reading)).items;

    expect(JSON.stringify(item)).not.toContain('answerAudience');
  });
});
