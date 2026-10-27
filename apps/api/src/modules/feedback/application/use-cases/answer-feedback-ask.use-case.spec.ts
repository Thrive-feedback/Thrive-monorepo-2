import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRequestRepository,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeChannelAnnouncer } from '@test/support/integrations.fakes';
import { FakePersonNotifier } from '@test/support/notifications.fakes';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import {
  AskAlreadyAnsweredError,
  FeedbackMessageEmptyError,
} from '../../domain/feedback-request.errors';
import { BoundTags } from '../../domain/value-object/bound-tags.vo';
import { RequestMessage } from '../../domain/value-object/request-message.vo';
import { Visibility } from '../../domain/value-object/visibility.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { AnswerFeedbackAskUseCase } from './answer-feedback-ask.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e1';
/** A second id, for the test that tries to answer twice: an id is minted per attempt. */
const SECOND_FEEDBACK_ID = '0199a0f0-0000-7000-8000-0000000000e2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';
const WRITTEN = 'You open strongly and lose the room at the detail.';

async function setUp(visibility: Visibility = Visibility.onlyMe()) {
  const feedbackRequestRepository = new FakeFeedbackRequestRepository();
  await feedbackRequestRepository.save(
    FeedbackRequest.send({
      id: REQUEST_ID,
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANN,
      message: RequestMessage.of('my presentation skills'),
      tags: BoundTags.none(),
      visibility,
      givers: [{ askId: ASK_ID, giverAccountId: BEN }],
    }),
  );
  const unitOfWork = new FakeUnitOfWork();
  const personNotifier = new FakePersonNotifier();
  const channelAnnouncer = new FakeChannelAnnouncer();
  const useCase = new AnswerFeedbackAskUseCase(
    feedbackRequestRepository,
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(FEEDBACK_ID, SECOND_FEEDBACK_ID),
    unitOfWork,
    personNotifier,
    channelAnnouncer,
  );
  return {
    feedbackRequestRepository,
    unitOfWork,
    useCase,
    personNotifier,
    channelAnnouncer,
  };
}

const answering = {
  workspaceId: WORKSPACE_ID,
  giverAccountId: BEN,
  askId: ASK_ID,
  message: WRITTEN,
};

describe('a Giver answering an Ask', () => {
  it('stores the Feedback for the Member who asked', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    const answered = await useCase.execute(answering);

    expect(answered).toEqual({ feedbackId: FEEDBACK_ID });
    expect(feedbackRequestRepository.answers).toEqual([
      {
        id: FEEDBACK_ID,
        workspaceId: WORKSPACE_ID,
        origin: 'REQUESTED',
        feedbackRequestId: REQUEST_ID,
        feedbackAskId: ASK_ID,
        giverAccountId: BEN,
        receiverAccountIds: [ANN],
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        message: WRITTEN,
        workspaceGoals: [],
        mentions: [],
      },
    ]);
  });

  it('binds what the Giver wrote', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    await useCase.execute({ ...answering, message: 'You owned it #ownership' });

    expect(feedbackRequestRepository.answers[0]).toMatchObject({
      workspaceGoals: [
        { workspaceGoalId: 'goal-ownership', name: 'ownership' },
      ],
    });
  });

  it('leaves the Ask answered, so it stops waiting on its Giver', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    await useCase.execute(answering);

    expect(feedbackRequestRepository.saved[0]?.asks[0]?.status).toBe(
      'ANSWERED',
    );
  });

  it('writes the answer and the Ask in one unit of work', async () => {
    const { unitOfWork, useCase } = await setUp();

    await useCase.execute(answering);

    // One transaction, and no key: unlike founding a Workspace, two people answering two Asks
    // are not racing — the one race there is, a Giver pressing Send twice, the store refuses.
    expect(unitOfWork.opened).toEqual([{}]);
  });

  it('refuses a blank answer before it reads anything', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    await expect(
      useCase.execute({ ...answering, message: '   ' }),
    ).rejects.toThrow(FeedbackMessageEmptyError);
    expect(feedbackRequestRepository.answers).toEqual([]);
  });

  it('refuses a second answer to the same Ask', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();
    await useCase.execute(answering);

    await expect(
      useCase.execute({ ...answering, message: 'And another thing.' }),
    ).rejects.toThrow(AskAlreadyAnsweredError);
    expect(feedbackRequestRepository.answers).toHaveLength(1);
  });

  it('answers not-found for an Ask waiting on somebody else, and writes nothing', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    await expect(
      useCase.execute({ ...answering, giverAccountId: CARA }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
    expect(feedbackRequestRepository.answers).toEqual([]);
    expect(feedbackRequestRepository.saved[0]?.asks[0]?.status).toBe('PENDING');
  });

  it('answers not-found through another Workspace, even for the right Giver', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();

    await expect(
      useCase.execute({ ...answering, workspaceId: OTHER_WORKSPACE_ID }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
    expect(feedbackRequestRepository.answers).toEqual([]);
  });

  it('answers not-found for an Ask that does not exist', async () => {
    const { useCase } = await setUp();

    await expect(
      useCase.execute({
        ...answering,
        askId: '0199a0f0-0000-7000-8000-00000000aaaa',
      }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
  });
});

describe('telling the Requester their request was answered', () => {
  it('tells the Requester, naming who answered and the request to open', async () => {
    const { useCase, personNotifier } = await setUp();

    await useCase.execute(answering);

    expect(personNotifier.asksAnswered).toHaveLength(1);
    const told = personNotifier.asksAnswered[0];
    expect(told?.workspaceId).toBe(WORKSPACE_ID);
    // Ben answered, so Ben is the actor and is never told about his own action.
    expect(told?.actorAccountId).toBe(BEN);
    expect(told?.requesterAccountId).toBe(ANN);
    expect(told?.feedbackRequestId).toBe(REQUEST_ID);
  });

  it('carries nothing of what was written', async () => {
    const { useCase, personNotifier } = await setUp();

    await useCase.execute(answering);

    // #214: the answer is the part of Feedback people are most careful about. The link does
    // that job, behind a sign-in.
    expect(JSON.stringify(personNotifier.asksAnswered[0])).not.toContain(
      answering.message,
    );
  });

  it('succeeds, and still stores the answer, when nobody can be told', async () => {
    const { useCase, personNotifier, feedbackRequestRepository } =
      await setUp();
    personNotifier.rejectingEverything();

    const answered = await useCase.execute(answering);

    expect(answered.feedbackId).toBe(FEEDBACK_ID);
    expect(feedbackRequestRepository.answers).toHaveLength(1);
  });
});

describe('telling the Workspace channel about an answer', () => {
  /** A request the Requester set to Everyone, so what it collects is public too. */
  function everyone(): Visibility {
    return Visibility.of({ value: 'EVERYONE', selectedAccountIds: [] });
  }

  it('announces an answer to a request set to Everyone', async () => {
    const { useCase, channelAnnouncer } = await setUp(everyone());

    await useCase.execute(answering);

    // The Workspace feed shows public Feedback whatever its origin, so the channel must agree
    // with it rather than showing Offered Feedback only (ADR 0062).
    expect(channelAnnouncer.feedbackPublished_).toHaveLength(1);
    expect(channelAnnouncer.feedbackPublished_[0]).toEqual({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      receiverAccountIds: [ANN],
      feedbackId: FEEDBACK_ID,
    });
  });

  it('announces nothing when the request was for the Requester alone', async () => {
    const { useCase, channelAnnouncer } = await setUp();

    await useCase.execute(answering);

    expect(channelAnnouncer.feedbackPublished_).toHaveLength(0);
  });

  it('carries none of what was written (brain ADR-0040)', async () => {
    const { useCase, channelAnnouncer } = await setUp(everyone());

    await useCase.execute(answering);

    expect(
      JSON.stringify(channelAnnouncer.feedbackPublished_[0]),
    ).not.toContain('lose the room');
  });

  it('succeeds, and still stores the answer, when no channel can be told', async () => {
    const { useCase, channelAnnouncer, feedbackRequestRepository } =
      await setUp(everyone());
    channelAnnouncer.rejectingEverything();

    const answered = await useCase.execute(answering);

    expect(answered.feedbackId).toBe(FEEDBACK_ID);
    expect(feedbackRequestRepository.answers).toHaveLength(1);
  });
});
