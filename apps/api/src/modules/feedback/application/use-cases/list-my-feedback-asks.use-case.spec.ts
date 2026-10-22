import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListMyFeedbackAsksUseCase } from './list-my-feedback-asks.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const ASK_FOR_BEN = '0199a0f0-0000-7000-8000-0000000000a1';
const ASK_FOR_CARA = '0199a0f0-0000-7000-8000-0000000000a2';
const ANSWERED_ASK_FOR_BEN = '0199a0f0-0000-7000-8000-0000000000a3';
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
        { askId: ASK_FOR_BEN, giverAccountId: BEN, status: 'PENDING' },
        { askId: ASK_FOR_CARA, giverAccountId: CARA, status: 'PENDING' },
      ],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000f2',
      workspaceId: WORKSPACE_ID,
      requesterAccountId: CARA,
      message: 'how I run stand-up',
      tags: NO_TAGS,
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      createdAt: new Date('2026-10-09T03:00:00.000Z'),
      asks: [
        {
          askId: ANSWERED_ASK_FOR_BEN,
          giverAccountId: BEN,
          status: 'ANSWERED',
        },
      ],
    },
  );
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: ANA,
    email: 'ana@acme.test',
    fullName: 'Ana Silva',
    displayName: 'Ana',
    slug: null,
    photoUrl: null,
  });
  const useCase = new ListMyFeedbackAsksUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
}

describe('listing the Asks waiting for me', () => {
  it('lists my Pending Asks, naming who asked and what about', async () => {
    const { useCase } = setUp();

    const waiting = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'PENDING',
      page: ONE_PAGE,
    });

    expect(waiting.total).toBe(1);
    expect(waiting.items[0]).toMatchObject({
      askId: ASK_FOR_BEN,
      message: 'my presentation skills',
      tags: NO_TAGS,
      requesterAccountId: ANA,
      requesterName: 'Ana Silva',
      status: 'PENDING',
    });
  });

  it('shows a Requester who has since been Deactivated as inactive, and keeps the Ask', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, ANA);

    const waiting = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'PENDING',
      page: ONE_PAGE,
    });

    expect(waiting.items[0]).toMatchObject({
      askId: ASK_FOR_BEN,
      requesterName: 'Ana Silva',
      requesterStatus: 'DEACTIVATED',
    });
  });

  it("never shows another Member's Ask on the same request", async () => {
    const { useCase } = setUp();

    const waiting = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'PENDING',
      page: ONE_PAGE,
    });

    expect(waiting.items.map((ask) => ask.askId)).not.toContain(ASK_FOR_CARA);
  });

  it('leaves out the Asks I have already answered', async () => {
    const { useCase } = setUp();

    const waiting = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'PENDING',
      page: ONE_PAGE,
    });

    expect(waiting.items.map((ask) => ask.askId)).not.toContain(
      ANSWERED_ASK_FOR_BEN,
    );
  });

  it('lists the answered ones when those are the ones asked for', async () => {
    const { useCase } = setUp();

    const answered = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'ANSWERED',
      page: ONE_PAGE,
    });

    expect(answered.items.map((ask) => ask.askId)).toEqual([
      ANSWERED_ASK_FOR_BEN,
    ]);
  });

  it('leaves the Requester unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const waiting = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      status: 'PENDING',
      page: ONE_PAGE,
    });

    expect(waiting.items[0]?.requesterName).toBeNull();
  });
});
