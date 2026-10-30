import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeChannelAnnouncer } from '@test/support/integrations.fakes';
import { FakePersonNotifier } from '@test/support/notifications.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotGiveYourselfFeedbackError,
  FeedbackMessageEmptyError,
  PostcardInvalidError,
} from '../../domain/feedback-request.errors';
import type { PostcardSnapshot } from '../../domain/value-object/postcard.vo';
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
    receiverAccountIds: [BEN],
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
  const channelAnnouncer = new FakeChannelAnnouncer();
  const useCase = new OfferFeedbackUseCase(
    feedbackRepository,
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(FEEDBACK_ID),
    unitOfWork,
    personNotifier,
    channelAnnouncer,
  );
  return {
    feedbackRepository,
    unitOfWork,
    useCase,
    personNotifier,
    channelAnnouncer,
  };
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
        receiverAccountIds: [BEN],
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        message: 'You kept the room with you.\n\nKeep the recap.',
        postcard: null,
        workspaceGoals: [],
        mentions: [],
      },
    ]);
  });

  it('keeps the postcard it was written on', async () => {
    const { feedbackRepository, useCase } = setUp();
    const postcard: PostcardSnapshot = {
      templateKey: 'system/postcard_template_2',
      tone: 'sage',
      textStyle: { font: 'classic', sizeStep: 2, align: 'left', ink: 'navy' },
      stamps: [],
    };

    await useCase.execute(offering({ postcard }));

    expect(feedbackRepository.saved[0]?.postcard).toEqual(postcard);
  });

  it('refuses a postcard that does not fit and stores nothing', async () => {
    const { feedbackRepository, useCase } = setUp();

    await expect(
      useCase.execute(
        offering({
          postcard: {
            templateKey: 'not a picture',
            tone: 'sage',
            textStyle: {
              font: 'classic',
              sizeStep: 2,
              align: 'left',
              ink: 'navy',
            },
            stamps: [],
          },
        }),
      ),
    ).rejects.toThrow(PostcardInvalidError);
    expect(feedbackRepository.saved).toEqual([]);
  });

  it('binds what its Feedback message names', async () => {
    const { feedbackRepository, useCase } = setUp();

    await useCase.execute(
      offering({
        message: 'The launch #Ownership. Thanks to @cara.',
        visibility: 'EVERYONE',
      }),
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
      useCase.execute(offering({ receiverAccountIds: [DAN] })),
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
      useCase.execute(offering({ receiverAccountIds: [ANN] })),
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
    expect(told?.receiverAccountIds).toEqual([BEN]);
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

describe('telling the Workspace channel', () => {
  it('announces Feedback the Giver showed everyone', async () => {
    const { useCase, channelAnnouncer } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(channelAnnouncer.feedbackPublished_).toHaveLength(1);
    expect(channelAnnouncer.feedbackPublished_[0]).toEqual({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANN,
      receiverAccountIds: [BEN],
      feedbackId: FEEDBACK_ID,
    });
  });

  it('announces nothing when the Feedback is for the Receiver alone', async () => {
    const { useCase, channelAnnouncer } = setUp();

    await useCase.execute(offering({ visibility: 'ONLY_ME' }));

    expect(channelAnnouncer.feedbackPublished_).toHaveLength(0);
  });

  it('announces nothing when only Selected people may read it', async () => {
    const { useCase, channelAnnouncer } = setUp();

    await useCase.execute(
      offering({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: [CARA],
      }),
    );

    // A channel is a wider room than the people the Giver picked.
    expect(channelAnnouncer.feedbackPublished_).toHaveLength(0);
  });

  it('carries none of the Feedback message (brain ADR-0040)', async () => {
    const { useCase, channelAnnouncer } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(
      JSON.stringify(channelAnnouncer.feedbackPublished_[0]),
    ).not.toContain('Keep the recap');
  });

  it('succeeds, and still stores the Feedback, when no channel can be told', async () => {
    const { useCase, channelAnnouncer, feedbackRepository } = setUp();
    channelAnnouncer.rejectingEverything();

    const given = await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(given.id).toBe(FEEDBACK_ID);
    expect(feedbackRepository.saved).toHaveLength(1);
  });
});
