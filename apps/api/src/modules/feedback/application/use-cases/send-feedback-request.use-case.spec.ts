import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRequestRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotAskYourselfError,
  RequestMessageEmptyError,
} from '../../domain/feedback-request.errors';
import {
  GiverNotInWorkspaceError,
  SelectedPersonNotInWorkspaceError,
} from '../feedback-request.errors';
import { SendFeedbackRequestUseCase } from './send-feedback-request.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_ID = '0199a0f0-0000-7000-8000-0000000000a1';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

function request(
  overrides: Partial<{
    message: string;
    giverAccountIds: string[];
    visibility: string;
    selectedAccountIds: string[];
  }> = {},
) {
  return {
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANN,
    message: '  my presentation   skills ',
    giverAccountIds: [BEN],
    visibility: 'ONLY_ME',
    selectedAccountIds: [],
    ...overrides,
  };
}

function setUp() {
  const feedbackRequestRepository = new FakeFeedbackRequestRepository();
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort().with(
    WORKSPACE_ID,
    ANN,
    BEN,
    CARA,
  );
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new SendFeedbackRequestUseCase(
    feedbackRequestRepository,
    workspaceMembershipPort,
    aTagsService(WORKSPACE_ID),
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
  it('stores the request with a tidied Request message and one Ask for the Member asked', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    const sent = await useCase.execute(request());

    expect(sent).toEqual({ id: REQUEST_ID });
    expect(feedbackRequestRepository.saved).toEqual([
      {
        id: REQUEST_ID,
        workspaceId: WORKSPACE_ID,
        requesterAccountId: ANN,
        message: 'my presentation skills',
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        workspaceGoals: [],
        mentions: [],
        asks: [{ id: ASK_ID, giverAccountId: BEN, status: 'PENDING' }],
      },
    ]);
  });

  it('binds what its Request message names', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await useCase.execute(
      request({ message: 'The launch with @cara #OWNERSHIP' }),
    );

    expect(feedbackRequestRepository.saved[0]).toMatchObject({
      workspaceGoals: [
        { workspaceGoalId: 'goal-ownership', name: 'ownership' },
      ],
      mentions: [{ accountId: CARA, slug: 'cara', displayName: 'Cara' }],
    });
  });

  it('writes inside one unit of work, so a request without its Asks cannot be stored', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(request());

    expect(unitOfWork.opened).toHaveLength(1);
  });

  it('stores the people the Requester chose to read the answers', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await useCase.execute(
      request({ visibility: 'SELECTED_PEOPLE', selectedAccountIds: [CARA] }),
    );

    expect(feedbackRequestRepository.saved[0]).toMatchObject({
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [CARA],
    });
  });

  it('refuses sharing it with somebody outside the Workspace and stores nothing', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(
      useCase.execute(
        request({
          visibility: 'SELECTED_PEOPLE',
          selectedAccountIds: ['account-outsider'],
        }),
      ),
    ).rejects.toThrow(SelectedPersonNotInWorkspaceError);
    expect(feedbackRequestRepository.saved).toEqual([]);
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

  it('refuses a blank Request message before it asks the Workspace anything', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(useCase.execute(request({ message: '   ' }))).rejects.toThrow(
      RequestMessageEmptyError,
    );
    expect(feedbackRequestRepository.saved).toEqual([]);
  });
});
