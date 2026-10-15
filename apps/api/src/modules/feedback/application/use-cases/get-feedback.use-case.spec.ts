import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestQuery } from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { FeedbackNotFoundError } from '../feedback-request.errors';
import { AccountNamesService } from '../service/account-names.service';
import { GetFeedbackUseCase } from './get-feedback.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const RECEIVER = 'account-ana';
const GIVER = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';
const CREATED_AT = new Date('2026-10-12T04:00:00.000Z');

function setUp(visibility: string, selectedAccountIds: string[] = []) {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.feedbackWithVisibility.push({
    id: FEEDBACK_ID,
    workspaceId: WORKSPACE_ID,
    origin: 'REQUESTED',
    feedbackRequestId: REQUEST_ID,
    topic: 'my presentation skills',
    giverAccountId: GIVER,
    receiverAccountId: RECEIVER,
    body: 'You open strongly and lose the room at the detail.',
    createdAt: CREATED_AT,
    visibility,
    selectedAccountIds,
  });
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: GIVER,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
      photoUrl: null,
    },
    {
      accountId: RECEIVER,
      email: 'ana@acme.test',
      fullName: 'Ana Lee',
      displayName: 'Ana',
      photoUrl: null,
    },
  );
  return new GetFeedbackUseCase(
    feedbackRequestQuery,
    new AccountNamesService(accountSummaryPort),
  );
}

function readAs(
  useCase: GetFeedbackUseCase,
  readerAccountId: string,
  workspaceId = WORKSPACE_ID,
) {
  return useCase.execute({
    workspaceId,
    readerAccountId,
    feedbackId: FEEDBACK_ID,
  });
}

describe('reading one piece of Feedback', () => {
  it('gives a selected Member what was written, naming who wrote it and whom it is for', async () => {
    const useCase = setUp('SELECTED_PEOPLE', [CARA]);

    expect(await readAs(useCase, CARA)).toEqual({
      id: FEEDBACK_ID,
      origin: 'REQUESTED',
      feedbackRequestId: REQUEST_ID,
      topic: 'my presentation skills',
      giverAccountId: GIVER,
      giverName: 'Ben Carter',
      receiverAccountId: RECEIVER,
      receiverName: 'Ana Lee',
      body: 'You open strongly and lose the room at the detail.',
      createdAt: CREATED_AT,
    });
  });

  it('lets the Receiver read it when nobody else may', async () => {
    const useCase = setUp('ONLY_ME');

    expect((await readAs(useCase, RECEIVER)).id).toBe(FEEDBACK_ID);
  });

  it('lets the Giver read what they wrote when nobody else may', async () => {
    const useCase = setUp('ONLY_ME');

    expect((await readAs(useCase, GIVER)).id).toBe(FEEDBACK_ID);
  });

  it('lets any Member read it when it is shared with Everyone', async () => {
    const useCase = setUp('EVERYONE');

    expect((await readAs(useCase, DAN)).id).toBe(FEEDBACK_ID);
  });

  it('answers not-found to another Member when it is Only me', async () => {
    const useCase = setUp('ONLY_ME');

    await expect(readAs(useCase, CARA)).rejects.toThrow(FeedbackNotFoundError);
  });

  it('answers not-found to a Member who was not selected', async () => {
    const useCase = setUp('SELECTED_PEOPLE', [CARA]);

    await expect(readAs(useCase, DAN)).rejects.toThrow(FeedbackNotFoundError);
  });

  it('answers not-found for another Workspace’s Feedback, even to its Receiver', async () => {
    const useCase = setUp('EVERYONE');

    await expect(readAs(useCase, RECEIVER, OTHER_WORKSPACE_ID)).rejects.toThrow(
      FeedbackNotFoundError,
    );
  });
});
