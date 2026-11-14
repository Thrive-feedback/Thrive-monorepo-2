import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import {
  aTagsService,
  FakeFeedbackRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeOutbox } from '@test/support/outbox.fake';
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
import { SummaryRefreshService } from '../service/summary-refresh.service';
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

/** Fixed, so the period a refresh names does not move with the calendar. */
const NOW = new Date('2026-11-08T09:00:00.000Z');

function setUp() {
  const feedbackRepository = new FakeFeedbackRepository();
  const unitOfWork = new FakeUnitOfWork();
  const outbox = new FakeOutbox();
  const useCase = new OfferFeedbackUseCase(
    feedbackRepository,
    new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(FEEDBACK_ID),
    unitOfWork,
    outbox,
    new SummaryRefreshService(outbox, new FakeClock(NOW), true),
  );
  return {
    feedbackRepository,
    unitOfWork,
    useCase,
    outbox,
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
      stickers: [],
      stampKey: null,
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
            stickers: [],
            stampKey: null,
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
  const WRITTEN = 'notifications.feedback_written';

  it('names the Receiver and the Feedback to open', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering());

    expect(outbox.ofType(WRITTEN)).toHaveLength(1);
    expect(outbox.ofType(WRITTEN)[0]?.payload).toMatchObject({
      actorAccountId: ANN,
      receiverAccountIds: [BEN],
      feedbackId: FEEDBACK_ID,
    });
  });

  it('names the people the Giver chose to share it with', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(
      offering({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(outbox.ofType(WRITTEN)[0]?.payload).toMatchObject({
      sharedWithAccountIds: [CARA],
    });
  });

  it('shares with nobody when the Feedback is for the Receiver alone', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering());

    expect(outbox.ofType(WRITTEN)[0]?.payload).toMatchObject({
      sharedWithAccountIds: [],
    });
  });

  it('carries none of the Feedback message', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering());

    // #215: neither message carries any of the Feedback's words.
    expect(JSON.stringify(outbox.ofType(WRITTEN)[0]?.payload)).not.toContain(
      'Keep the recap',
    );
  });

  it('is enqueued for every Feedback, whoever may read it', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'ONLY_ME' }));

    // The bell is the floor: the Receiver is told whatever the Visibility, unlike the channel
    // announcement, which is for Everyone alone.
    expect(outbox.ofType(WRITTEN)).toHaveLength(1);
  });

  it('keys the message by the Feedback, so a retried request tells each person once', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering());

    expect(outbox.ofType(WRITTEN)[0]?.idempotencyKey).toBe(
      `${WRITTEN}:${FEEDBACK_ID}`,
    );
  });
});

describe('telling the Workspace channel', () => {
  const PUBLISHED = 'integrations.feedback_published';

  it('enqueues an announcement for Feedback the Giver showed everyone', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(outbox.ofType(PUBLISHED)).toHaveLength(1);
    expect(outbox.ofType(PUBLISHED)[0]?.payload).toEqual({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANN,
      receiverAccountIds: [BEN],
      feedbackId: FEEDBACK_ID,
    });
  });

  it('keys the message by the Feedback, so a retried request announces once', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(outbox.ofType(PUBLISHED)[0]?.idempotencyKey).toBe(
      `${PUBLISHED}:${FEEDBACK_ID}`,
    );
  });

  it('enqueues nothing when the Feedback is for the Receiver alone', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'ONLY_ME' }));

    expect(outbox.ofType(PUBLISHED)).toHaveLength(0);
  });

  it('enqueues nothing when only Selected people may read it', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(
      offering({
        visibility: 'SELECTED_PEOPLE',
        selectedAccountIds: [CARA],
      }),
    );

    // A channel is a wider room than the people the Giver picked.
    expect(outbox.ofType(PUBLISHED)).toHaveLength(0);
  });

  it('carries none of the Feedback message (brain ADR-0040)', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    expect(JSON.stringify(outbox.ofType(PUBLISHED)[0]?.payload)).not.toContain(
      'Keep the recap',
    );
  });

  it('never touches a chat tool while the Giver waits', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(offering({ visibility: 'EVERYONE' }));

    // Giving Feedback used to call the announcer and swallow whatever came back. It now records
    // a row and returns, so an unreachable chat tool cannot reach this request at all — the
    // guarantee of brain `ADR-0035` §8, kept by the shape rather than by a `.catch`.
    expect(outbox.ofType(PUBLISHED)).toHaveLength(1);
  });
});
