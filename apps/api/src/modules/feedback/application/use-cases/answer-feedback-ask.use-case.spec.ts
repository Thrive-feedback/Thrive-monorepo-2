import { describe, expect, it } from 'bun:test';
import { FakeFeedbackRequestRepository } from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import { FeedbackRequest } from '../../domain/entity/feedback-request.entity';
import {
  AskAlreadyAnsweredError,
  FeedbackBodyEmptyError,
} from '../../domain/feedback-request.errors';
import { Topic } from '../../domain/value-object/topic.vo';
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

async function setUp() {
  const feedbackRequestRepository = new FakeFeedbackRequestRepository();
  await feedbackRequestRepository.save(
    FeedbackRequest.send({
      id: REQUEST_ID,
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANN,
      topic: Topic.of('my presentation skills'),
      visibility: Visibility.onlyMe(),
      givers: [{ askId: ASK_ID, giverAccountId: BEN }],
    }),
  );
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new AnswerFeedbackAskUseCase(
    feedbackRequestRepository,
    new FakeIdGenerator(FEEDBACK_ID, SECOND_FEEDBACK_ID),
    unitOfWork,
  );
  return { feedbackRequestRepository, unitOfWork, useCase };
}

const answering = {
  workspaceId: WORKSPACE_ID,
  giverAccountId: BEN,
  askId: ASK_ID,
  body: WRITTEN,
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
        feedbackRequestId: REQUEST_ID,
        feedbackAskId: ASK_ID,
        giverAccountId: BEN,
        receiverAccountId: ANN,
        body: WRITTEN,
      },
    ]);
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
      useCase.execute({ ...answering, body: '   ' }),
    ).rejects.toThrow(FeedbackBodyEmptyError);
    expect(feedbackRequestRepository.answers).toEqual([]);
  });

  it('refuses a second answer to the same Ask', async () => {
    const { feedbackRequestRepository, useCase } = await setUp();
    await useCase.execute(answering);

    await expect(
      useCase.execute({ ...answering, body: 'And another thing.' }),
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
