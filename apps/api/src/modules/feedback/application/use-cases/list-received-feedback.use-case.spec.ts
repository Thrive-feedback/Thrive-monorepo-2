import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestQuery } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { AccountNamesService } from '../service/account-names.service';
import { ListReceivedFeedbackUseCase } from './list-received-feedback.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const ONE_PAGE = { page: 1, pageSize: 20 };

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.feedback.push(
    {
      id: '0199a0f0-0000-7000-8000-0000000000d1',
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      origin: 'REQUESTED',
      feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
      topic: 'my presentation skills',
      giverAccountId: BEN,
      body: 'You lose the room at the detail near the end.',
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d2',
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      origin: 'OFFERED',
      feedbackRequestId: null,
      topic: 'how I run stand-up',
      giverAccountId: CARA,
      body: 'Short and clear. Keep leaving the last five minutes open.',
      createdAt: new Date('2026-10-12T03:00:00.000Z'),
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d3',
      workspaceId: WORKSPACE_ID,
      receiverAccountId: BEN,
      origin: 'REQUESTED',
      feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f3',
      topic: 'how Ben writes release notes',
      giverAccountId: ANA,
      body: 'They read clearly and they land a day late.',
      createdAt: new Date('2026-10-12T04:00:00.000Z'),
    },
  );
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: BEN,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
      photoUrl: null,
    },
    {
      accountId: CARA,
      email: 'cara@acme.test',
      fullName: 'Cara Diaz',
      displayName: 'Cara',
      photoUrl: null,
    },
  );
  const useCase = new ListReceivedFeedbackUseCase(
    feedbackRequestQuery,
    new AccountNamesService(accountSummaryPort),
  );
  return { accountSummaryPort, useCase };
}

describe('reading the Feedback written to me', () => {
  it('lists what people wrote to me, newest first, naming each Giver', async () => {
    const { useCase } = setUp();

    const received = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(received.total).toBe(2);
    expect(received.items.map((feedback) => feedback.topic)).toEqual([
      'how I run stand-up',
      'my presentation skills',
    ]);
    expect(received.items[0]?.giverName).toBe('Cara Diaz');
    expect(received.items[0]?.body).toBe(
      'Short and clear. Keep leaving the last five minutes open.',
    );
  });

  it('tells Feedback given without being asked from an answer, which names its request', async () => {
    const { useCase } = setUp();

    const received = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      received.items.map((feedback) => [
        feedback.origin,
        feedback.feedbackRequestId,
      ]),
    ).toEqual([
      ['OFFERED', null],
      ['REQUESTED', '0199a0f0-0000-7000-8000-0000000000f1'],
    ]);
  });

  it('leaves out Feedback written to another Member of my own Workspace', async () => {
    const { useCase } = setUp();

    const received = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      received.items.some(
        (feedback) => feedback.topic === 'how Ben writes release notes',
      ),
    ).toBe(false);
  });

  it('lists nothing for a Workspace nobody has written to me in', async () => {
    const { useCase } = setUp();

    const received = await useCase.execute({
      workspaceId: OTHER_WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(received).toEqual({ items: [], total: 0 });
  });

  it('names every Giver on the page in one call, however many pieces it holds', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(accountSummaryPort.calls).toHaveLength(1);
    expect(accountSummaryPort.calls[0]).toEqual([CARA, BEN]);
  });

  it('leaves a Giver unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const received = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(received.items[0]?.giverName).toBeNull();
  });
});
