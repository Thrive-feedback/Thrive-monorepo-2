import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { PersonalItemsService } from '../service/personal-items.service';
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

function requestRow(
  id: string,
  sentOn: number,
  answeredOn: number | null,
  requesterAccountId = ANN,
) {
  return {
    workspaceId: WORKSPACE_ID,
    requesterAccountId,
    id,
    message: `Request ${id}`,
    tags: NO_TAGS,
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: [BEN],
    postcard: null,
    createdAt: on(sentOn),
    latestActivityAt: on(answeredOn ?? sentOn),
    asks: [
      {
        giverAccountId: BEN,
        status: answeredOn === null ? 'PENDING' : 'ANSWERED',
        answer:
          answeredOn === null
            ? null
            : {
                id: `${id}-answer`,
                message: `Answer to ${id}`,
                tags: NO_TAGS,
                postcard: null,
                answeredAt: on(answeredOn),
              },
      },
      { giverAccountId: CARA, status: 'PENDING', answer: null },
    ],
  } as const;
}

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.receivedItems.push(
    feedbackRow('f1', 11),
    answerRow('f3', 13),
    feedbackRow('f4', 14, BEN),
  );
  feedbackRequestQuery.sentRequests.push(
    // Sent on the 10th, answered on the 13th: it sits at its answer.
    requestRow('r1', 10, 13),
    requestRow('r7', 17, null, BEN),
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
    new PersonalItemsService(
      feedbackRequestQuery,
      kudosQuery,
      new PeopleService(accountSummaryPort, new FakeWorkspaceMembershipPort()),
    ),
  );
  return { accountSummaryPort, feedbackRequestQuery, kudosQuery, useCase };
}

const READING_ANN = {
  workspaceId: WORKSPACE_ID,
  receiverAccountId: ANN,
  show: 'ALL',
  after: null,
  limit: 20,
} as const;

describe('reading what a Member received', () => {
  it('lists what came back to them in this Workspace, every kind, newest first', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(READING_ANN);

    expect(page.items.map((item) => item.id)).toEqual(['r1', 'k2', 'f1']);
    expect(page.next).toBeNull();
  });

  it('lists an answer only inside the request it answers', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(READING_ANN);

    expect(page.items.map((item) => item.id)).not.toContain('f3');
  });

  it('never lists what was written to somebody else, or what they asked', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      ...READING_ANN,
      receiverAccountId: BEN,
    });

    expect(page.items.map((item) => item.id)).toEqual(['r7', 'f4']);
  });

  it('leaves out a Kudos for the whole Workspace, which names nobody', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(READING_ANN);

    expect(page.items.map((item) => item.id)).not.toContain('k6');
  });

  it('gives a Kudos its Giver’s face, who it names, and the card it was written on', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(READING_ANN);

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

  it('shows a request with everyone it asked, by name, and what each sent back', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute(READING_ANN);

    expect(page.items[0]).toMatchObject({
      kind: 'REQUEST',
      message: 'Request r1',
      visibility: 'SELECTED_PEOPLE',
      selectedPeople: [{ accountId: BEN, name: 'Ben Carter' }],
      createdAt: on(10),
      latestActivityAt: on(13),
      asked: [
        {
          person: { accountId: BEN, name: 'Ben Carter' },
          status: 'ANSWERED',
          answer: { id: 'r1-answer', message: 'Answer to r1' },
        },
        { person: { accountId: CARA }, status: 'PENDING', answer: null },
      ],
    });
  });

  it.each([
    ['REQUESTS', ['r1']],
    ['OFFERED', ['f1']],
    ['KUDOS', ['k2']],
  ] as const)('shows only %s when asked to', async (show, ids) => {
    const { useCase } = setUp();

    const page = await useCase.execute({ ...READING_ANN, show });

    expect(page.items.map((item) => item.id)).toEqual([...ids]);
  });

  it('carries on from where the last item sat, repeating and skipping nothing', async () => {
    const { useCase } = setUp();

    const first = await useCase.execute({ ...READING_ANN, limit: 2 });
    const second = await useCase.execute({
      ...READING_ANN,
      after: first.next,
      limit: 2,
    });

    expect(first.items.map((item) => item.id)).toEqual(['r1', 'k2']);
    expect(first.next).toEqual({ createdAt: on(12), id: 'k2' });
    expect(second.items.map((item) => item.id)).toEqual(['f1']);
    expect(second.next).toBeNull();
  });

  it('does not repeat a request that moved up after its page was read', async () => {
    const { feedbackRequestQuery, useCase } = setUp();
    feedbackRequestQuery.sentRequests.length = 0;
    feedbackRequestQuery.sentRequests.push(requestRow('r', 12, null));

    const first = await useCase.execute({ ...READING_ANN, limit: 2 });
    // Answered while the reader scrolled: it now sits above everything read.
    feedbackRequestQuery.sentRequests[0] = requestRow('r', 12, 20);
    const second = await useCase.execute({
      ...READING_ANN,
      after: first.next,
      limit: 2,
    });

    expect(first.items.map((item) => item.id)).toEqual(['r', 'k2']);
    expect(second.items.map((item) => item.id)).toEqual(['f1']);
  });

  it('keeps one order when a Feedback and a Kudos share a moment', async () => {
    const { feedbackRequestQuery, kudosQuery, useCase } = setUp();
    feedbackRequestQuery.receivedItems.length = 0;
    feedbackRequestQuery.sentRequests.length = 0;
    kudosQuery.rows.length = 0;
    feedbackRequestQuery.receivedItems.push(feedbackRow('a', 20));
    kudosQuery.rows.push(kudosRow('b', 20));

    const first = await useCase.execute({ ...READING_ANN, limit: 1 });
    const second = await useCase.execute({
      ...READING_ANN,
      after: first.next,
      limit: 1,
    });

    expect(first.items.map((item) => item.id)).toEqual(['b']);
    expect(second.items.map((item) => item.id)).toEqual(['a']);
    expect(second.next).toBeNull();
  });

  it('asks who people are once for the whole page', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute(READING_ANN);

    expect(accountSummaryPort.calls).toHaveLength(1);
  });
});
