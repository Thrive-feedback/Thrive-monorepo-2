import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakePersonNotifier } from '@test/support/notifications.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotGiveYourselfFeedbackError,
  FeedbackMessageEmptyError,
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
    message: '  You kept the room with you.\n\nKeep the recap. ',
    visibility: 'ONLY_ME',
    selectedAccountIds: [],
    ...overrides,
  };
}

function setUp() {
  const feedbackRepository = new FakeFeedbackRepository();
  const unitOfWork = new FakeUnitOfWork();
  const personNotifier = new FakePersonNotifier();
  const useCase = new OfferFeedbackUseCase(
    feedbackRepository,
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(FEEDBACK_ID),
    unitOfWork,
    personNotifier,
  );
  return { feedbackRepository, unitOfWork, useCase, personNotifier };
}

describe('a Giver giving a teammate Feedback without being asked', () => {
  it('stores Offered Feedback for the Receiver, with a tidied Feedback message', async () => {
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
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        message: 'You kept the room with you.\n\nKeep the recap.',
        workspaceGoals: [],
        mentions: [],
      },
    ]);
  });

  it('binds what its Feedback message names', async () => {
    const { feedbackRepository, useCase } = setUp();

    await useCase.execute(
      offering({ message: 'The launch #Ownership. Thanks to @cara.' }),
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

  it('refuses blank Feedback', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute(offering({ message: ' \n ' })),
    ).rejects.toThrow(FeedbackMessageEmptyError);
  });

  it('refuses a Giver giving themselves Feedback', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute(offering({ receiverAccountId: ANN })),
    ).rejects.toThrow(CannotGiveYourselfFeedbackError);
  });
});

describe('telling the people Feedback was written for', () => {
  it('names the Receiver and the Feedback to open', async () => {
    const { useCase, personNotifier } = setUp();

    await useCase.execute(offering());

    expect(personNotifier.feedbackWritten_).toHaveLength(1);
    const told = personNotifier.feedbackWritten_[0];
    expect(told?.actorAccountId).toBe(ANN);
    expect(told?.receiverAccountId).toBe(BEN);
    expect(told?.feedbackId).toBe(FEEDBACK_ID);
  });

  it('names the people the Giver chose to share it with', async () => {
    const { useCase, personNotifier } = setUp();

    await useCase.execute(
      offering({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(personNotifier.feedbackWritten_[0]?.sharedWithAccountIds).toEqual([
      CARA,
    ]);
  });

  it('shares with nobody when the Feedback is for the Receiver alone', async () => {
    const { useCase, personNotifier } = setUp();

    await useCase.execute(offering());

    expect(personNotifier.feedbackWritten_[0]?.sharedWithAccountIds).toEqual(
      [],
    );
  });

  it('carries none of the Feedback message', async () => {
    const { useCase, personNotifier } = setUp();

    await useCase.execute(offering());

    // #215: neither message carries any of the Feedback's words.
    expect(JSON.stringify(personNotifier.feedbackWritten_[0])).not.toContain(
      'Keep the recap',
    );
  });

  it('succeeds, and still stores the Feedback, when nobody can be told', async () => {
    const { useCase, personNotifier, feedbackRepository } = setUp();
    personNotifier.rejectingEverything();

    const given = await useCase.execute(offering());

    expect(given.id).toBe(FEEDBACK_ID);
    expect(feedbackRepository.saved).toHaveLength(1);
  });
});
