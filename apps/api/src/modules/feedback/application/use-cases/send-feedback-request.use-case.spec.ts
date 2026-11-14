import { describe, expect, it } from 'bun:test';
import {
  aTagsService,
  FakeFeedbackRequestRepository,
  FakeWorkspaceMembershipPort,
} from '@test/support/feedback.fakes';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeOutbox } from '@test/support/outbox.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  CannotAskYourselfError,
  PostcardInvalidError,
  RequestMessageEmptyError,
} from '../../domain/feedback-request.errors';
import type { PostcardSnapshot } from '../../domain/value-object/postcard.vo';
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
    postcard: PostcardSnapshot;
  }> = {},
) {
  return {
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANN,
    message: '  my presentation skills ',
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
  const outbox = new FakeOutbox();
  const useCase = new SendFeedbackRequestUseCase(
    feedbackRequestRepository,
    workspaceMembershipPort,
    aTagsService(WORKSPACE_ID),
    new FakeIdGenerator(REQUEST_ID, ASK_ID),
    unitOfWork,
    outbox,
  );
  return {
    outbox,
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
        postcard: null,
        visibility: 'ONLY_ME',
        selectedAccountIds: [],
        workspaceGoals: [],
        mentions: [],
        asks: [{ id: ASK_ID, giverAccountId: BEN, status: 'PENDING' }],
      },
    ]);
  });

  it('keeps the postcard it was written on', async () => {
    const { feedbackRequestRepository, useCase } = setUp();
    const postcard: PostcardSnapshot = {
      templateKey: 'system/postcard_template_2',
      tone: 'blush',
      textStyle: { font: 'modern', sizeStep: 2, align: 'left', ink: 'ink' },
      stickers: [],
      stampKey: null,
    };

    await useCase.execute(request({ postcard }));

    expect(feedbackRequestRepository.saved[0]?.postcard).toEqual(postcard);
  });

  it('refuses a postcard that does not fit and stores nothing', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await expect(
      useCase.execute(
        request({
          postcard: {
            templateKey: 'not a picture',
            tone: 'blush',
            textStyle: {
              font: 'modern',
              sizeStep: 2,
              align: 'left',
              ink: 'ink',
            },
            stickers: [],
            stampKey: null,
          },
        }),
      ),
    ).rejects.toThrow(PostcardInvalidError);
    expect(feedbackRequestRepository.saved).toEqual([]);
  });

  it('opens one Ask for every Member asked, in one request', async () => {
    const SECOND_ASK_ID = '0199a0f0-0000-7000-8000-0000000000a2';
    const feedbackRequestRepository = new FakeFeedbackRequestRepository();
    const useCase = new SendFeedbackRequestUseCase(
      feedbackRequestRepository,
      new FakeWorkspaceMembershipPort().with(WORKSPACE_ID, ANN, BEN, CARA),
      aTagsService(WORKSPACE_ID),
      new FakeIdGenerator(REQUEST_ID, ASK_ID, SECOND_ASK_ID),
      new FakeUnitOfWork(),
      new FakeOutbox(),
    );

    await useCase.execute(request({ giverAccountIds: [BEN, CARA] }));

    expect(feedbackRequestRepository.saved[0]?.asks).toEqual([
      { id: ASK_ID, giverAccountId: BEN, status: 'PENDING' },
      { id: SECOND_ASK_ID, giverAccountId: CARA, status: 'PENDING' },
    ]);
  });

  it('binds what its Request message names', async () => {
    const { feedbackRequestRepository, useCase } = setUp();

    await useCase.execute(
      request({
        message: 'The launch with @cara #OWNERSHIP',
        visibility: 'EVERYONE',
      }),
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

describe('telling the people asked', () => {
  const ASK_RECEIVED = 'notifications.ask_received';

  it('names every Giver, the Ask each of them opens, and who asked', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(request());

    expect(outbox.ofType(ASK_RECEIVED)).toHaveLength(1);
    expect(outbox.ofType(ASK_RECEIVED)[0]?.payload).toMatchObject({
      workspaceId: WORKSPACE_ID,
      actorAccountId: ANN,
      giverAccountIds: [BEN],
      askIdByGiver: { [BEN]: ASK_ID },
    });
  });

  it('keys the message by the request, so a retried send tells each person once', async () => {
    const { useCase, outbox } = setUp();

    await useCase.execute(request());

    expect(outbox.ofType(ASK_RECEIVED)[0]?.idempotencyKey).toBe(
      `${ASK_RECEIVED}:${REQUEST_ID}`,
    );
  });

  it('records the promise in the request own transaction', async () => {
    const { useCase, outbox, feedbackRequestRepository } = setUp();

    const sent = await useCase.execute(request());

    // Nobody is asked without the promise to tell them, and no promise survives a request that
    // rolled back (ADR 0076).
    expect(sent.id).toBe(REQUEST_ID);
    expect(feedbackRequestRepository.saved).toHaveLength(1);
    expect(outbox.ofType(ASK_RECEIVED)).toHaveLength(1);
  });

  it('fails the send when the promise cannot be recorded', async () => {
    const { useCase, outbox } = setUp();
    outbox.rejectingEverything();

    // The old behaviour swallowed this and asked people nobody would ever be told about. The
    // enqueue now runs inside the use case's unit of work, so the failure reaches the caller.
    // That the *write* is undone with it is the transaction's doing and is proved against
    // Postgres in `outbox.integration.spec.ts` — this fake runs the work and records nothing.
    await expect(useCase.execute(request())).rejects.toThrow(
      'the outbox refused',
    );
  });
});
