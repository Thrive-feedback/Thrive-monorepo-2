import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { FeedbackNotFoundError } from '../feedback-request.errors';
import { PeopleService } from '../service/people.service';
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

function setUp(
  visibility: string,
  selectedAccountIds: string[] = [],
  deactivatedAccountIds: string[] = [],
  feedbackRequestQuery = new FakeFeedbackRequestQuery(),
) {
  feedbackRequestQuery.feedbackWithVisibility.push({
    id: FEEDBACK_ID,
    workspaceId: WORKSPACE_ID,
    origin: 'REQUESTED',
    feedbackRequestId: REQUEST_ID,
    giverAccountId: GIVER,
    receiverAccountIds: [RECEIVER],
    message: 'You open strongly and lose the room at the detail.',
    postcard: null,
    tags: NO_TAGS,
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
      slug: null,
      photoUrl: null,
    },
    {
      accountId: RECEIVER,
      email: 'ana@acme.test',
      fullName: 'Ana Lee',
      displayName: 'Ana',
      slug: null,
      photoUrl: null,
    },
  );
  return new GetFeedbackUseCase(
    feedbackRequestQuery,
    new PeopleService(
      accountSummaryPort,
      new FakeWorkspaceMembershipPort().withDeactivated(
        WORKSPACE_ID,
        ...deactivatedAccountIds,
      ),
    ),
  );
}

const answer = (
  id: string,
  giverAccountId: string,
  visibility: string,
  selectedAccountIds: string[] = [],
) => ({
  id,
  giverAccountId,
  message: `Written by ${giverAccountId}`,
  tags: NO_TAGS,
  postcard: null,
  answeredAt: CREATED_AT,
  visibility,
  selectedAccountIds,
});

function withCard(visibility: string, selectedAccountIds: string[] = []) {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.openedRequests.push({
    id: REQUEST_ID,
    workspaceId: WORKSPACE_ID,
    message: 'How clear was the plan?',
    tags: NO_TAGS,
    requesterAccountId: RECEIVER,
    postcard: null,
    answers: [
      answer(FEEDBACK_ID, GIVER, visibility, selectedAccountIds),
      answer('second-answer', CARA, visibility, selectedAccountIds),
    ],
  });
  return setUp(visibility, selectedAccountIds, [], feedbackRequestQuery);
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
    const useCase = withCard('SELECTED_PEOPLE', [CARA]);

    expect(await readAs(useCase, CARA)).toEqual({
      id: FEEDBACK_ID,
      origin: 'REQUESTED',
      feedbackRequestId: REQUEST_ID,
      giverAccountId: GIVER,
      giverName: 'Ben Carter',
      giverPhotoUrl: null,
      giverStatus: 'ACTIVE',
      receivers: [
        {
          accountId: RECEIVER,
          name: 'Ana Lee',
          photoUrl: null,
          status: 'ACTIVE',
        },
      ],
      message: 'You open strongly and lose the room at the detail.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: CREATED_AT,
      request: expect.objectContaining({
        message: 'How clear was the plan?',
        requester: {
          accountId: RECEIVER,
          name: 'Ana Lee',
          photoUrl: null,
          status: 'ACTIVE',
        },
      }),
    });
  });

  it('shows a Giver who has since been Deactivated as inactive, and keeps what they wrote', async () => {
    const useCase = setUp('ONLY_ME', [], [GIVER]);

    const feedback = await readAs(useCase, RECEIVER);

    expect([feedback.giverStatus, feedback.receivers[0]?.status]).toEqual([
      'DEACTIVATED',
      'ACTIVE',
    ]);
    expect(feedback.message).toBe(
      'You open strongly and lose the room at the detail.',
    );
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

  describe('the card an answer is on', () => {
    const answersRead = async (
      useCase: GetFeedbackUseCase,
      readerAccountId: string,
    ) =>
      (
        await useCase.execute({
          workspaceId: WORKSPACE_ID,
          readerAccountId,
          feedbackId: FEEDBACK_ID,
        })
      ).request?.answers.map((each) => each.giver.accountId);

    it('gives the Requester every answer when they kept them to themselves', async () => {
      const useCase = withCard('ONLY_ME');

      expect(await answersRead(useCase, RECEIVER)).toEqual([GIVER, CARA]);
    });

    it('gives a Giver only their own when it was kept to the Requester', async () => {
      const useCase = withCard('ONLY_ME');

      expect(await answersRead(useCase, GIVER)).toEqual([GIVER]);
    });

    it('gives somebody selected every answer', async () => {
      const useCase = withCard('SELECTED_PEOPLE', [DAN]);

      expect(await answersRead(useCase, DAN)).toEqual([GIVER, CARA]);
    });

    it('gives a Giver who was not selected only their own', async () => {
      const useCase = withCard('SELECTED_PEOPLE', [DAN]);

      expect(await answersRead(useCase, GIVER)).toEqual([GIVER]);
    });

    it('gives a Giver who was selected too every answer', async () => {
      const useCase = withCard('SELECTED_PEOPLE', [GIVER]);

      expect(await answersRead(useCase, GIVER)).toEqual([GIVER, CARA]);
    });
  });

  it('has no card for Feedback given without being asked', async () => {
    const feedbackRequestQuery = new FakeFeedbackRequestQuery();
    const useCase = setUp('EVERYONE', [], [], feedbackRequestQuery);
    const [offered] = feedbackRequestQuery.feedbackWithVisibility;
    if (!offered) {
      throw new Error('setUp wrote no Feedback.');
    }
    feedbackRequestQuery.feedbackWithVisibility[0] = {
      ...offered,
      origin: 'OFFERED',
      feedbackRequestId: null,
    };

    expect((await readAs(useCase, DAN)).request).toBeNull();
  });

  it('answers not-found for another Workspace’s Feedback, even to its Receiver', async () => {
    const useCase = setUp('EVERYONE');

    await expect(readAs(useCase, RECEIVER, OTHER_WORKSPACE_ID)).rejects.toThrow(
      FeedbackNotFoundError,
    );
  });
});
