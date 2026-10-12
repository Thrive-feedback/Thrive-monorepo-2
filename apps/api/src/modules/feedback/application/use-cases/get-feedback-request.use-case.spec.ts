import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestQuery } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import { GetFeedbackRequestUseCase } from './get-feedback-request.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const REQUESTER = 'account-ana';
const GIVER = 'account-ben';
const BYSTANDER = 'account-cara';
const CREATED_AT = new Date('2026-10-11T03:00:00.000Z');

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.rows.push({
    id: REQUEST_ID,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: REQUESTER,
    topic: 'my presentation skills',
    visibility: 'ONLY_ME',
    createdAt: CREATED_AT,
    asks: [{ askId: ASK_ID, giverAccountId: GIVER, status: 'PENDING' }],
  });
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: GIVER,
    email: 'ben@acme.test',
    fullName: 'Ben Carter',
    displayName: 'Ben',
  });
  const useCase = new GetFeedbackRequestUseCase(
    feedbackRequestQuery,
    accountSummaryPort,
  );
  return { accountSummaryPort, useCase };
}

describe('reading one Feedback Request', () => {
  it('names the Member asked and says where their Ask stands', async () => {
    const { useCase } = setUp();

    const found = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found).toEqual({
      id: REQUEST_ID,
      topic: 'my presentation skills',
      visibility: 'ONLY_ME',
      asks: [
        {
          askId: ASK_ID,
          giverAccountId: GIVER,
          giverName: 'Ben Carter',
          status: 'PENDING',
        },
      ],
      createdAt: CREATED_AT,
    });
  });

  it('leaves the Giver unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.splice(0, 1, {
      accountId: GIVER,
      email: 'ben@acme.test',
      fullName: null,
      displayName: null,
    });

    const found = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found.asks[0]?.giverName).toBeNull();
  });

  it('lets the Member asked read it, because they cannot answer what they may not read', async () => {
    const { useCase } = setUp();

    const found = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: GIVER,
      requestId: REQUEST_ID,
    });

    expect(found.topic).toBe('my presentation skills');
  });

  it('answers not-found to a Member who is neither the Requester nor a Giver', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        callerAccountId: BYSTANDER,
        requestId: REQUEST_ID,
      }),
    ).rejects.toThrow(FeedbackRequestNotFoundError);
  });

  it("answers not-found for a request in somebody else's Workspace", async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: OTHER_WORKSPACE_ID,
        callerAccountId: REQUESTER,
        requestId: REQUEST_ID,
      }),
    ).rejects.toThrow(FeedbackRequestNotFoundError);
  });
});
