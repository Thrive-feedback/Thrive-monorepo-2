import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListSharedFeedbackUseCase } from './list-shared-feedback.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const DAN = 'account-dan';
const ONE_PAGE = { page: 1, pageSize: 20 };

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.feedbackWithVisibility.push(
    {
      id: '0199a0f0-0000-7000-8000-0000000000d1',
      workspaceId: WORKSPACE_ID,
      origin: 'REQUESTED',
      feedbackRequestId: '0199a0f0-0000-7000-8000-0000000000f1',
      giverAccountId: CARA,
      receiverAccountIds: [BEN],
      message:
        'You start with the three goals on one slide, which keeps the side topics out.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d2',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      message: 'You kept the room with you when the demo broke.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-12T03:00:00.000Z'),
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA, DAN],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d3',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: CARA,
      receiverAccountIds: [DAN],
      message: 'Your notes answered every question I had in my first week.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-13T03:00:00.000Z'),
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [BEN],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d4',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: CARA,
      receiverAccountIds: [DAN],
      message: 'They read clearly and they land a day late.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-14T03:00:00.000Z'),
      visibility: 'EVERYONE',
      selectedAccountIds: [],
    },
  );
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: BEN,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
      slug: null,
      photoUrl: null,
    },
    {
      accountId: CARA,
      email: 'cara@acme.test',
      fullName: 'Cara Diaz',
      displayName: 'Cara',
      slug: null,
      photoUrl: null,
    },
  );
  const useCase = new ListSharedFeedbackUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
}

describe('reading the Feedback shared with me', () => {
  it('lists what I was selected for, newest first, naming both people', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(shared.total).toBe(2);
    expect(shared.items.map((feedback) => feedback.message)).toEqual([
      'You kept the room with you when the demo broke.',
      'You start with the three goals on one slide, which keeps the side topics out.',
    ]);
    expect(shared.items[0]?.giverName).toBe('Ben Carter');
    expect(shared.items[0]?.receivers.map((person) => person.name)).toEqual([
      'Cara Diaz',
    ]);
  });

  it('shows whichever of the two people has since been Deactivated as inactive', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, CARA);

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(shared.items[0]).toMatchObject({
      giverName: 'Ben Carter',
      giverStatus: 'ACTIVE',
      receivers: [
        expect.objectContaining({ name: 'Cara Diaz', status: 'DEACTIVATED' }),
      ],
    });
  });

  it('tells Feedback given without being asked from an answer, which names its request', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      shared.items.map((feedback) => [
        feedback.origin,
        feedback.feedbackRequestId,
      ]),
    ).toEqual([
      ['OFFERED', null],
      ['REQUESTED', '0199a0f0-0000-7000-8000-0000000000f1'],
    ]);
  });

  it('leaves out what another Member of my Workspace was selected for', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      shared.items.some(
        (feedback) =>
          feedback.message ===
          'Your notes answered every question I had in my first week.',
      ),
    ).toBe(false);
  });

  it('leaves out Feedback nobody was selected for, whoever else may read it', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      shared.items.some(
        (feedback) =>
          feedback.message === 'They read clearly and they land a day late.',
      ),
    ).toBe(false);
  });

  it('lists nothing in a Workspace where nothing was shared with me', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: OTHER_WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(shared).toEqual({ items: [], total: 0 });
  });

  it('names everybody on the page in one call, however many pieces it holds', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(accountSummaryPort.calls).toHaveLength(1);
    expect(accountSummaryPort.calls[0]).toEqual([BEN, CARA]);
  });

  it('leaves somebody unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(shared.items[0]?.giverName).toBeNull();
    expect(shared.items[0]?.receivers[0]?.name).toBeNull();
  });

  it('counts every piece shared with me, not only the page asked for', async () => {
    const { useCase } = setUp();

    const shared = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      readerAccountId: ANA,
      page: { page: 1, pageSize: 1 },
    });

    expect(shared.items).toHaveLength(1);
    expect(shared.total).toBe(2);
  });
});
