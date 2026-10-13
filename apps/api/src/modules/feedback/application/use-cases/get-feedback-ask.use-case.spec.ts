import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestQuery } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { AccountNamesService } from '../service/account-names.service';
import { GetFeedbackAskUseCase } from './get-feedback-ask.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_FOR_BEN = '0199a0f0-0000-7000-8000-0000000000a1';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const CREATED_AT = new Date('2026-10-11T03:00:00.000Z');

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.rows.push({
    id: REQUEST_ID,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANA,
    topic: 'my presentation skills',
    visibility: 'ONLY_ME',
    createdAt: CREATED_AT,
    asks: [{ askId: ASK_FOR_BEN, giverAccountId: BEN, status: 'PENDING' }],
  });
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: ANA,
    email: 'ana@acme.test',
    fullName: 'Ana Silva',
    displayName: 'Ana',
  });
  const useCase = new GetFeedbackAskUseCase(
    feedbackRequestQuery,
    new AccountNamesService(accountSummaryPort),
  );
  return { accountSummaryPort, useCase };
}

describe('reading one Ask waiting for me', () => {
  it('says who asked, about what, and where the Ask stands', async () => {
    const { useCase } = setUp();

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask).toEqual({
      askId: ASK_FOR_BEN,
      feedbackRequestId: REQUEST_ID,
      topic: 'my presentation skills',
      requesterAccountId: ANA,
      requesterName: 'Ana Silva',
      status: 'PENDING',
      createdAt: CREATED_AT,
    });
  });

  it('leaves the Requester unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask.requesterName).toBeNull();
  });

  it('answers not-found for an Ask addressed to somebody else', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        giverAccountId: CARA,
        askId: ASK_FOR_BEN,
      }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
  });

  it('answers not-found for an Ask in another Workspace', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: OTHER_WORKSPACE_ID,
        giverAccountId: BEN,
        askId: ASK_FOR_BEN,
      }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
  });
});
