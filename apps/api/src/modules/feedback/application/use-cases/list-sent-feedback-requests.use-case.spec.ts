import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestQuery } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { AccountNamesService } from '../service/account-names.service';
import { ListSentFeedbackRequestsUseCase } from './list-sent-feedback-requests.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const ONE_PAGE = { page: 1, pageSize: 20 };

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.rows.push(
    {
      id: '0199a0f0-0000-7000-8000-0000000000f1',
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      topic: 'my presentation skills',
      visibility: 'ONLY_ME',
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
      asks: [
        {
          askId: '0199a0f0-0000-7000-8000-0000000000a1',
          giverAccountId: BEN,
          status: 'PENDING',
        },
      ],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000f2',
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      topic: 'how I run stand-up',
      visibility: 'ONLY_ME',
      createdAt: new Date('2026-10-12T03:00:00.000Z'),
      asks: [
        {
          askId: '0199a0f0-0000-7000-8000-0000000000a2',
          giverAccountId: CARA,
          status: 'PENDING',
        },
      ],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000f3',
      workspaceId: WORKSPACE_ID,
      requesterAccountId: BEN,
      topic: "Ben's own request",
      visibility: 'ONLY_ME',
      createdAt: new Date('2026-10-12T04:00:00.000Z'),
      asks: [
        {
          askId: '0199a0f0-0000-7000-8000-0000000000a3',
          giverAccountId: ANA,
          status: 'PENDING',
        },
      ],
    },
  );
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: BEN,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
    },
    {
      accountId: CARA,
      email: 'cara@acme.test',
      fullName: 'Cara Diaz',
      displayName: 'Cara',
    },
  );
  const useCase = new ListSentFeedbackRequestsUseCase(
    feedbackRequestQuery,
    new AccountNamesService(accountSummaryPort),
  );
  return { accountSummaryPort, useCase };
}

describe('listing the Feedback Requests I sent', () => {
  it('lists my own requests newest first, naming everyone I asked', async () => {
    const { useCase } = setUp();

    const sent = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(sent.total).toBe(2);
    expect(sent.items.map((request) => request.topic)).toEqual([
      'how I run stand-up',
      'my presentation skills',
    ]);
    expect(sent.items[0]?.asks[0]?.giverName).toBe('Cara Diaz');
  });

  it("leaves out another Member's requests, even in my own Workspace", async () => {
    const { useCase } = setUp();

    const sent = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      sent.items.some((request) => request.topic === "Ben's own request"),
    ).toBe(false);
  });

  it('lists nothing for a Workspace I sent no requests in', async () => {
    const { useCase } = setUp();

    const sent = await useCase.execute({
      workspaceId: OTHER_WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(sent).toEqual({ items: [], total: 0 });
  });

  it('names everyone on the page in one call, however many requests it holds', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(accountSummaryPort.calls).toHaveLength(1);
    expect(accountSummaryPort.calls[0]).toEqual([CARA, BEN]);
  });

  it('leaves a Giver unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const sent = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(sent.items[0]?.asks[0]?.giverName).toBeNull();
  });
});
