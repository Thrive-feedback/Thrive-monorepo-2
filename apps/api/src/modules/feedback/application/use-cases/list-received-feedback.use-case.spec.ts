import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
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
      giverAccountId: BEN,
      message: 'You lose the room at the detail near the end.',
      tags: NO_TAGS,
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d2',
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: CARA,
      message: 'Short and clear. Keep leaving the last five minutes open.',
      tags: NO_TAGS,
      createdAt: new Date('2026-10-12T03:00:00.000Z'),
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d3',
      workspaceId: WORKSPACE_ID,
      receiverAccountId: BEN,
      origin: 'REQUESTED',
      feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f3',
      giverAccountId: ANA,
      message: 'They read clearly and they land a day late.',
      tags: NO_TAGS,
      createdAt: new Date('2026-10-12T04:00:00.000Z'),
    },
  );
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
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
  );
  const useCase = new ListReceivedFeedbackUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
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
    expect(received.items.map((feedback) => feedback.message)).toEqual([
      'Short and clear. Keep leaving the last five minutes open.',
      'You lose the room at the detail near the end.',
    ]);
    expect(received.items[0]?.giverName).toBe('Cara Diaz');
    expect(received.items[0]?.message).toBe(
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
        (feedback) =>
          feedback.message === 'They read clearly and they land a day late.',
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

  it('shows a Giver who has since been Deactivated as inactive, and keeps what they wrote', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, CARA);

    const received = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(received.items.map((feedback) => feedback.giverStatus)).toEqual([
      'DEACTIVATED',
      'ACTIVE',
    ]);
    expect(received.items[0]?.message).toBe(
      'Short and clear. Keep leaving the last five minutes open.',
    );
  });

  it('asks which Givers are Deactivated in one call, however many pieces the page holds', async () => {
    const { workspaceMembershipPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      receiverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(workspaceMembershipPort.deactivatedCalls).toEqual([[CARA, BEN]]);
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
