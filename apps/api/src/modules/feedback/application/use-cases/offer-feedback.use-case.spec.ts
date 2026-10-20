import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotGiveYourselfFeedbackError,
  FeedbackBodyEmptyError,
  TopicEmptyError,
} from '../../domain/feedback-request.errors';
import {
  ReceiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';
import {
  type OfferFeedbackInput,
  OfferFeedbackUseCase,
} from './offer-feedback.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';

function offering(
  overrides: Partial<OfferFeedbackInput> = {},
): OfferFeedbackInput {
  return {
    workspaceId: WORKSPACE_ID,
    giverAccountId: ANN,
    receiverAccountId: BEN,
    topic: '  the customer   demo ',
    body: '  You kept the room with you.\n\nKeep the recap. ',
    visibility: 'ONLY_ME',
    selectedAccountIds: [],
    ...overrides,
  };
}

function setUp() {
  const feedbackRepository = new FakeFeedbackRepository();
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new OfferFeedbackUseCase(
    feedbackRepository,
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(FEEDBACK_ID),
    unitOfWork,
  );
  return { feedbackRepository, unitOfWork, useCase };
}

describe('a Giver giving a teammate Feedback without being asked', () => {
  it('stores Offered Feedback for the Receiver, with a tidied Topic and body', async () => {
    const { feedbackRepository, useCase } = setUp();

    const given = await useCase.execute(offering());

    expect(given).toEqual({ id: FEEDBACK_ID });
    expect(feedbackRepository.saved).toEqual([
      {
        id: FEEDBACK_ID,
        workspaceId: WORKSPACE_ID,
        origin: 'OFFERED',
        feedbackRequestId: null,
        feedbackAskId: null,
        giverAccountId: ANN,
        receiverAccountId: BEN,
        topic: 'the customer demo',
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        body: 'You kept the room with you.\n\nKeep the recap.',
        workspaceGoals: [],
        mentions: [],
      },
    ]);
  });

  it('binds what its Topic and its text name together', async () => {
    const { feedbackRepository, useCase } = setUp();

    await useCase.execute(
      offering({ topic: 'The launch #Ownership', body: 'Thanks to @cara.' }),
    );

    expect(feedbackRepository.saved[0]).toMatchObject({
      workspaceGoals: [
        { workspaceGoalId: 'goal-ownership', name: 'ownership' },
      ],
      mentions: [{ accountId: CARA, slug: 'cara', displayName: 'Cara' }],
    });
  });

  it('keeps who the Giver chose to share it with', async () => {
    const { feedbackRepository, useCase } = setUp();

    await useCase.execute(
      offering({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(feedbackRepository.saved[0]).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [CARA],
    });
  });

  it('writes inside one unit of work', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(offering());

    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('refuses a Receiver outside the Workspace and stores nothing', async () => {
    const { feedbackRepository, useCase } = setUp();

    await expect(
      useCase.execute(offering({ receiverAccountId: DAN })),
    ).rejects.toThrow(ReceiverNotInWorkspaceError);
    expect(feedbackRepository.saved).toEqual([]);
  });

  it('refuses sharing with somebody outside the Workspace and stores nothing', async () => {
    const { feedbackRepository, useCase } = setUp();

    await expect(
      useCase.execute(
        offering({
          visibility: 'SELECTED_PEOPLE',
          selectedAccountIds: [DAN],
        }),
      ),
    ).rejects.toThrow(SelectedPersonNotInWorkspaceError);
    expect(feedbackRepository.saved).toEqual([]);
  });

  it('refuses a blank Topic', async () => {
    const { useCase } = setUp();

    await expect(useCase.execute(offering({ topic: '   ' }))).rejects.toThrow(
      TopicEmptyError,
    );
  });

  it('refuses blank Feedback', async () => {
    const { useCase } = setUp();

    await expect(useCase.execute(offering({ body: ' \n ' }))).rejects.toThrow(
      FeedbackBodyEmptyError,
    );
  });

  it('refuses a Giver giving themselves Feedback', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute(offering({ receiverAccountId: ANN })),
    ).rejects.toThrow(CannotGiveYourselfFeedbackError);
  });
});
