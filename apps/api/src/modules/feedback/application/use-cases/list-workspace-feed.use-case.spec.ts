import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListWorkspaceFeedUseCase } from './list-workspace-feed.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
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
      message: 'You start with the three goals on one slide.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
      visibility: 'EVERYONE',
      selectedAccountIds: [],
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
      visibility: 'EVERYONE',
      selectedAccountIds: [],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d3',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      message: 'Your notes answered every question I had.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-13T03:00:00.000Z'),
      visibility: 'SELECTED_PEOPLE',
      selectedAccountIds: [ANA],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d4',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      message: 'They read clearly and they land a day late.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-14T03:00:00.000Z'),
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d5',
      workspaceId: OTHER_WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      giverAccountId: BEN,
      receiverAccountIds: [CARA],
      message: 'Nobody here should read this.',
      postcard: null,
      tags: NO_TAGS,
      createdAt: new Date('2026-10-15T03:00:00.000Z'),
      visibility: 'EVERYONE',
      selectedAccountIds: [],
    },
  );
  // The request Cara's answer responds to: Ben asked Cara, then Ana, who has not answered.
  feedbackRequestQuery.rows.push({
    id: '0199a0f0-0000-7000-8000-0000000000f1',
    workspaceId: WORKSPACE_ID,
    requesterAccountId: BEN,
    message: 'my presentation skills',
    postcard: null,
    tags: NO_TAGS,
    visibility: 'EVERYONE',
    selectedAccountIds: [],
    createdAt: new Date('2026-10-10T03:00:00.000Z'),
    asks: [
      {
        askId: '0199a0f0-0000-7000-8000-0000000000a1',
        giverAccountId: CARA,
        status: 'ANSWERED',
      },
      {
        askId: '0199a0f0-0000-7000-8000-0000000000a2',
        giverAccountId: ANA,
        status: 'PENDING',
      },
    ],
  });
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
  const useCase = new ListWorkspaceFeedUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
}

describe('reading the Workspace feed', () => {
  it('lists what was shared with everyone, newest first, naming both people', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    expect(feed.total).toBe(2);
    expect(feed.items.map((feedback) => feedback.message)).toEqual([
      'You kept the room with you when the demo broke.',
      'You start with the three goals on one slide.',
    ]);
    expect(feed.items[0]?.giverName).toBe('Ben Carter');
    expect(feed.items[0]?.receivers.map((person) => person.name)).toEqual([
      'Cara Diaz',
    ]);
  });

  it('gives an answer the request it responds to, naming the Requester and everyone asked', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    const answer = feed.items.find(
      (feedback) => feedback.origin === 'REQUESTED',
    );
    expect(answer?.request).toEqual({
      message: 'my presentation skills',
      tags: NO_TAGS,
      requester: {
        accountId: BEN,
        name: 'Ben Carter',
        photoUrl: null,
        status: 'ACTIVE',
      },
      asked: [
        {
          accountId: CARA,
          name: 'Cara Diaz',
          photoUrl: null,
          status: 'ACTIVE',
        },
        { accountId: ANA, name: null, photoUrl: null, status: 'ACTIVE' },
      ],
    });
  });

  it('gives Feedback offered without being asked no request', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    const offered = feed.items.find(
      (feedback) => feedback.origin === 'OFFERED',
    );
    expect(offered?.request).toBeNull();
  });

  it('shows a person who has since been Deactivated as inactive, and keeps their Feedback on the feed', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, BEN);

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    expect(feed.total).toBe(2);
    expect(
      feed.items.map((feedback) => [
        feedback.giverStatus,
        feedback.receivers[0]?.status,
      ]),
    ).toEqual([
      ['DEACTIVATED', 'ACTIVE'],
      ['ACTIVE', 'DEACTIVATED'],
    ]);
  });

  it('tells an answer from Feedback given without being asked', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    expect(
      feed.items.map((feedback) => [
        feedback.origin,
        feedback.feedbackRequestId,
      ]),
    ).toEqual([
      ['OFFERED', null],
      ['REQUESTED', '0199a0f0-0000-7000-8000-0000000000f1'],
    ]);
  });

  it('leaves out everything somebody kept narrower than Everyone', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    const messages = feed.items.map((feedback) => feedback.message);
    expect(messages).not.toContain('Your notes answered every question I had.');
    expect(messages).not.toContain(
      'They read clearly and they land a day late.',
    );
  });

  it('leaves out another Workspace’s feed, however public it is there', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    expect(feed.items.map((feedback) => feedback.message)).not.toContain(
      'Nobody here should read this.',
    );
  });

  it('shows an empty feed where nobody has shared anything with everyone', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: '0199a0f0-0000-7000-8000-0000000000w3',
      page: ONE_PAGE,
    });

    expect(feed).toEqual({ items: [], total: 0 });
  });

  it('names everybody on the page in one call, everyone a request asked included', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({ workspaceId: WORKSPACE_ID, page: ONE_PAGE });

    expect(accountSummaryPort.calls).toHaveLength(1);
    expect(accountSummaryPort.calls[0]).toEqual([BEN, CARA, ANA]);
  });

  it('leaves somebody unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: ONE_PAGE,
    });

    expect(feed.items[0]?.giverName).toBeNull();
    expect(feed.items[0]?.receivers[0]?.name).toBeNull();
  });

  it('counts the whole feed, not only the page asked for', async () => {
    const { useCase } = setUp();

    const feed = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { page: 1, pageSize: 1 },
    });

    expect(feed.items).toHaveLength(1);
    expect(feed.total).toBe(2);
  });
});
