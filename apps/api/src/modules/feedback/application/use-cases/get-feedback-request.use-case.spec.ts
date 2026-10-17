import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { FeedbackRequestNotFoundError } from '../feedback-request.errors';
import { PeopleService } from '../service/people.service';
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
    selectedAccountIds: [],
    createdAt: CREATED_AT,
    asks: [{ askId: ASK_ID, giverAccountId: GIVER, status: 'PENDING' }],
  });
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: GIVER,
    email: 'ben@acme.test',
    fullName: 'Ben Carter',
    displayName: 'Ben',
    photoUrl: null,
  });
  const useCase = new GetFeedbackRequestUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return {
    workspaceMembershipPort,
    accountSummaryPort,
    feedbackRequestQuery,
    useCase,
  };
}

const ANSWERED_AT = new Date('2026-10-12T04:00:00.000Z');

function benHasAnswered(setUpResult: ReturnType<typeof setUp>): void {
  const { feedbackRequestQuery } = setUpResult;
  const row = feedbackRequestQuery.rows[0];
  if (!row) {
    throw new Error('The fixture has no Feedback Request.');
  }
  feedbackRequestQuery.rows[0] = {
    ...row,
    asks: [{ askId: ASK_ID, giverAccountId: GIVER, status: 'ANSWERED' }],
  };
  feedbackRequestQuery.answers.push({
    askId: ASK_ID,
    body: 'You open strongly and lose the room at the detail.',
    answeredAt: ANSWERED_AT,
  });
}

function sharedWithBystander(setUpResult: ReturnType<typeof setUp>): void {
  const { accountSummaryPort, feedbackRequestQuery } = setUpResult;
  const row = feedbackRequestQuery.rows[0];
  if (!row) {
    throw new Error('The fixture has no Feedback Request.');
  }
  feedbackRequestQuery.rows[0] = {
    ...row,
    visibility: 'SELECTED_PEOPLE',
    selectedAccountIds: [BYSTANDER],
  };
  accountSummaryPort.summaries.push({
    accountId: BYSTANDER,
    email: 'cara@acme.test',
    fullName: 'Cara Diaz',
    displayName: 'Cara',
    photoUrl: null,
  });
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
      visibility: { value: 'ONLY_ME', selectedPeople: [] },
      asks: [
        {
          askId: ASK_ID,
          giverAccountId: GIVER,
          giverName: 'Ben Carter',
          giverStatus: 'ACTIVE',
          status: 'PENDING',
          answer: null,
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
      photoUrl: null,
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

  it('tells the Requester who they shared it with, by name', async () => {
    const context = setUp();
    sharedWithBystander(context);

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found.visibility).toEqual({
      value: 'SELECTED_PEOPLE',
      selectedPeople: [
        { accountId: BYSTANDER, name: 'Cara Diaz', status: 'ACTIVE' },
      ],
    });
  });

  it('shows the Requester which of the people named have since been Deactivated', async () => {
    const context = setUp();
    sharedWithBystander(context);
    context.workspaceMembershipPort.withDeactivated(
      WORKSPACE_ID,
      GIVER,
      BYSTANDER,
    );

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found.asks.map((ask) => ask.giverStatus)).toEqual(['DEACTIVATED']);
    expect(
      found.visibility?.selectedPeople.map((person) => person.status),
    ).toEqual(['DEACTIVATED']);
  });

  it('does not tell the Giver who else reads their answer', async () => {
    const context = setUp();
    sharedWithBystander(context);

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: GIVER,
      requestId: REQUEST_ID,
    });

    expect(found.visibility).toBeNull();
  });

  it('answers not-found to a Member it is shared with, who reads its Feedback rather than the request', async () => {
    const context = setUp();
    sharedWithBystander(context);

    await expect(
      context.useCase.execute({
        workspaceId: WORKSPACE_ID,
        callerAccountId: BYSTANDER,
        requestId: REQUEST_ID,
      }),
    ).rejects.toThrow(FeedbackRequestNotFoundError);
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

  it('gives the Requester, who is the Receiver, what their Giver wrote', async () => {
    const context = setUp();
    benHasAnswered(context);

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found.asks[0]?.answer).toEqual({
      body: 'You open strongly and lose the room at the detail.',
      answeredAt: ANSWERED_AT,
    });
  });

  it('gives a Giver back their own answer', async () => {
    const context = setUp();
    benHasAnswered(context);

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: GIVER,
      requestId: REQUEST_ID,
    });

    expect(found.asks[0]?.answer?.body).toBe(
      'You open strongly and lose the room at the detail.',
    );
  });

  it("never gives a Giver another Giver's answer", async () => {
    // Two Asks on one request is #31's shape; the store can already hold it, and who may read
    // which answer is decided here rather than when the cap is raised.
    const context = setUp();
    const row = context.feedbackRequestQuery.rows[0];
    if (!row) {
      throw new Error('The fixture has no Feedback Request.');
    }
    const OTHER_ASK = '0199a0f0-0000-7000-8000-0000000000a2';
    context.feedbackRequestQuery.rows[0] = {
      ...row,
      asks: [
        { askId: ASK_ID, giverAccountId: GIVER, status: 'ANSWERED' },
        { askId: OTHER_ASK, giverAccountId: BYSTANDER, status: 'ANSWERED' },
      ],
    };
    context.feedbackRequestQuery.answers.push(
      { askId: ASK_ID, body: 'Ben wrote this.', answeredAt: ANSWERED_AT },
      { askId: OTHER_ASK, body: 'Cara wrote this.', answeredAt: ANSWERED_AT },
    );

    const found = await context.useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: GIVER,
      requestId: REQUEST_ID,
    });

    expect(found.asks.map((ask) => ask.answer?.body ?? null)).toEqual([
      'Ben wrote this.',
      null,
    ]);
  });

  it('shows no answer while the Ask is still waiting', async () => {
    const { useCase } = setUp();

    const found = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      callerAccountId: REQUESTER,
      requestId: REQUEST_ID,
    });

    expect(found.asks[0]?.answer).toBeNull();
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
