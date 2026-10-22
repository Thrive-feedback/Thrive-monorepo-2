import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
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
      message: 'my presentation skills',
      tags: NO_TAGS,
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
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
      message: 'how I run stand-up',
      tags: NO_TAGS,
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
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
      message: "Ben's own request",
      tags: NO_TAGS,
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
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
  const useCase = new ListSentFeedbackRequestsUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
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
    expect(sent.items.map((request) => request.message)).toEqual([
      'how I run stand-up',
      'my presentation skills',
    ]);
    expect(sent.items[0]?.asks[0]?.giverName).toBe('Cara Diaz');
  });

  it('shows a Giver who has since been Deactivated as inactive, and keeps their Ask', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, CARA);

    const sent = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(sent.items[0]?.asks[0]).toMatchObject({
      giverName: 'Cara Diaz',
      giverStatus: 'DEACTIVATED',
    });
  });

  it("leaves out another Member's requests, even in my own Workspace", async () => {
    const { useCase } = setUp();

    const sent = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      sent.items.some((request) => request.message === "Ben's own request"),
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
