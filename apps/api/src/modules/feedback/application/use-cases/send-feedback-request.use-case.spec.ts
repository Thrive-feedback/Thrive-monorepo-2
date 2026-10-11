import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotAskYourselfError,
  TopicEmptyError,
} from '../../domain/feedback-request.errors';
import { GiverNotInWorkspaceError } from '../feedback-request.errors';
import { SendFeedbackRequestUseCase } from './send-feedback-request.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const ANN = 'account-ann';
const BEN = 'account-ben';

function request(
  overrides: Partial<{ topic: string; giverAccountIds: string[] }> = {},
) {
  return {
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANN,
    topic: '  my presentation   skills ',
    giverAccountIds: [BEN],
    ...overrides,
  };
}

function setUp() {
  const feedbackRequestRepository = new FakeFeedbackRequestRepository();
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort().with(
    WORKSPACE_ID,
    ANN,
    BEN,
  );
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new SendFeedbackRequestUseCase(
    feedbackRequestRepository,
    workspaceMembershipPort,
    new FakeIdGenerator(REQUEST_ID, ASK_ID),
    unitOfWork,
  );
  return {
    feedbackRequestRepository,
    workspaceMembershipPort,
    unitOfWork,
    useCase,
  };
}

describe('a Requester asking a teammate for Feedback', () => {
  it('stores the request with a tidied Topic and one Ask for the Member asked', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    const sent = await useCase.execute(request());

    expect(sent).toEqual({ id: REQUEST_ID });
    expect(feedbackRequestRepository.saved).toEqual([
      {
        id: REQUEST_ID,
        workspaceId: WORKSPACE_ID,
        requesterAccountId: ANN,
        topic: 'my presentation skills',
        visibility: 'ONLY_ME',
        asks: [{ id: ASK_ID, giverAccountId: BEN, status: 'PENDING' }],
      },
    ]);
  });

  it('writes inside one unit of work, so a request without its Asks cannot be stored', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(request());

    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('keeps it ONLY_ME until the Requester can choose who may read the answers', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await useCase.execute(request());

    expect(feedbackRequestRepository.saved[0]?.visibility).toBe('ONLY_ME');
  });

  it('refuses a Member of another Workspace and stores nothing', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(
      useCase.execute(request({ giverAccountIds: ['account-outsider'] })),
    ).rejects.toThrow(GiverNotInWorkspaceError);
    expect(feedbackRequestRepository.saved).toEqual([]);
  });

  it('refuses the Requester asking themselves and stores nothing', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(
      useCase.execute(request({ giverAccountIds: [ANN] })),
    ).rejects.toThrow(CannotAskYourselfError);
    expect(feedbackRequestRepository.saved).toEqual([]);
  });

  it('refuses a blank Topic before it asks the Workspace anything', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(useCase.execute(request({ topic: '   ' }))).rejects.toThrow(
      TopicEmptyError,
    );
    expect(feedbackRequestRepository.saved).toEqual([]);
  });
});
