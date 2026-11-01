import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListReceivedItemsUseCase } from './list-received-items.use-case';

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

function on(day: number) {
  return new Date(`2026-10-${day}T03:00:00.000Z`);
}

function feedbackRow(id: string, day: number, receiverAccountId = ANN) {
  return {
    workspaceId: WORKSPACE_ID,
    id,
    origin: 'OFFERED',
    feedbackRequestId: null,
    giverAccountId: BEN,
    receiverAccountIds: [receiverAccountId, CARA],
    message: `Feedback ${id}`,
    tags: NO_TAGS,
    visibility: 'ONLY_ME',
    postcard: null,
    request: null,
    createdAt: on(day),
  } as const;
}

function answerRow(id: string, day: number) {
  return {
    ...feedbackRow(id, day),
    origin: 'REQUESTED',
    feedbackRequestId: 'request-1',
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
        { giverAccountId: BEN, status: 'PENDING', answer: null },
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
    card: A_CARD,
    createdAt: on(day),
  };
}

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.receivedItems.push(
    feedbackRow('f1', 11),
    answerRow('f3', 13),
    feedbackRow('f4', 14, BEN),
  );
  const kudosQuery = new FakeKudosQuery();
  kudosQuery.rows.push(
    kudosRow('k2', 12),
    kudosRow('k5', 15, [ANN], OTHER_WORKSPACE_ID),
    kudosRow('k6', 16, []),
  );
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: BEN,
    email: 'ben@acme.test',
    fullName: 'Ben Carter',
    displayName: 'Ben',
    slug: 'ben',
    photoUrl: 'https://photos.test/ben.png',
  });
  const useCase = new ListReceivedItemsUseCase(
    feedbackRequestQuery,
    kudosQuery,
    new PeopleService(accountSummaryPort, new FakeWorkspaceMembershipPort()),
  );
  return { accountSummaryPort, feedbackRequestQuery, kudosQuery, useCase };
}

const FIRST_PAGE = { afterId: null, limit: 20 };

describe('reading what a Member received', () => {
  it('lists what was written to them in this Workspace, both kinds, newest first', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: FIRST_PAGE,
    });

    expect(page.items.map((item) => item.id)).toEqual(['f3', 'k2', 'f1']);
    expect(page.nextAfterId).toBeNull();
  });

  it('never lists what was written to somebody else', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: BEN,
      page: FIRST_PAGE,
    });

    expect(page.items.map((item) => item.id)).toEqual(['f4']);
  });

  it('leaves out a Kudos for the whole Workspace, which names nobody', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: FIRST_PAGE,
    });

    expect(page.items.map((item) => item.id)).not.toContain('k6');
  });

  it('gives a Kudos its Giver’s face, who it names, and the card it was written on', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: FIRST_PAGE,
    });

    expect(page.items.find((item) => item.id === 'k2')).toMatchObject({
      kind: 'KUDOS',
      giver: {
        accountId: BEN,
        name: 'Ben Carter',
        photoUrl: 'https://photos.test/ben.png',
        status: 'ACTIVE',
      },
      recipients: [{ accountId: ANN }],
      card: A_CARD,
    });
  });

  it('names who asked and where everyone asked stands, on the card an answer was written on', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: FIRST_PAGE,
    });

    expect(page.items[0]).toMatchObject({
      kind: 'FEEDBACK',
      origin: 'REQUESTED',
      request: {
        message: 'How was the launch?',
        requester: { accountId: ANN, status: 'ACTIVE' },
        asked: [
          { person: { accountId: CARA }, status: 'ANSWERED' },
          { person: { accountId: BEN }, status: 'PENDING', answer: null },
        ],
      },
    });
  });

  it('carries on from a row of either kind, repeating and skipping nothing', async () => {
    const { useCase } = setUp();

    const first = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: { afterId: null, limit: 2 },
    });
    const second = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: { afterId: first.nextAfterId, limit: 2 },
    });

    expect(first.items.map((item) => item.id)).toEqual(['f3', 'k2']);
    expect(first.nextAfterId).toBe('k2');
    expect(second.items.map((item) => item.id)).toEqual(['f1']);
    expect(second.nextAfterId).toBeNull();
  });

  it('keeps one order when a Feedback and a Kudos share a moment', async () => {
    const { feedbackRequestQuery, kudosQuery, useCase } = setUp();
    feedbackRequestQuery.receivedItems.length = 0;
    kudosQuery.rows.length = 0;
    feedbackRequestQuery.receivedItems.push(feedbackRow('a', 20));
    kudosQuery.rows.push(kudosRow('b', 20));

    const first = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: { afterId: null, limit: 1 },
    });
    const second = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: { afterId: first.nextAfterId, limit: 1 },
    });

    expect(first.items.map((item) => item.id)).toEqual(['b']);
    expect(second.items.map((item) => item.id)).toEqual(['a']);
    expect(second.nextAfterId).toBeNull();
  });

  it('ends the list at a cursor naming a row that is gone', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: { afterId: 'gone', limit: 20 },
    });

    expect(page).toEqual({ items: [], nextAfterId: null });
  });

  it('asks who people are once for the whole page', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANN,
      page: FIRST_PAGE,
    });

    expect(accountSummaryPort.calls).toHaveLength(1);
  });
});
