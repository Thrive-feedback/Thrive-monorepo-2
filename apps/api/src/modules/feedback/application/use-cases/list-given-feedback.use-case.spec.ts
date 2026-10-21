import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListGivenFeedbackUseCase } from './list-given-feedback.use-case';

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
      topic: 'how Ben runs the planning meeting',
      topicTags: NO_TAGS,
      giverAccountId: ANA,
      receiverAccountId: BEN,
      body: 'You start with the three goals on one slide, which keeps the side topics out.',
      tags: NO_TAGS,
      createdAt: new Date('2026-10-11T03:00:00.000Z'),
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
    },
    {
      id: '0199a0f0-0000-7000-8000-0000000000d2',
      workspaceId: WORKSPACE_ID,
      origin: 'OFFERED',
      feedbackRequestId: null,
      topic: 'the customer demo on Tuesday',
      topicTags: NO_TAGS,
      giverAccountId: ANA,
      receiverAccountId: CARA,
      body: 'You kept the room with you when the demo broke.',
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
      topic: 'how Ana writes release notes',
      topicTags: NO_TAGS,
      giverAccountId: BEN,
      receiverAccountId: ANA,
      body: 'They read clearly and they land a day late.',
      tags: NO_TAGS,
      createdAt: new Date('2026-10-13T03:00:00.000Z'),
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
  const useCase = new ListGivenFeedbackUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
}

describe('reading the Feedback I have given', () => {
  it('lists what I wrote, newest first, naming each Receiver', async () => {
    const { useCase } = setUp();

    const given = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(given.total).toBe(2);
    expect(
      given.items.map((feedback) => [feedback.topic, feedback.receiverName]),
    ).toEqual([
      ['the customer demo on Tuesday', 'Cara Diaz'],
      ['how Ben runs the planning meeting', 'Ben Carter'],
    ]);
  });

  it('lists answers and Feedback given without being asked alike', async () => {
    const { useCase } = setUp();

    const given = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(given.items.map((feedback) => feedback.origin)).toEqual([
      'OFFERED',
      'REQUESTED',
    ]);
  });

  it('leaves out Feedback written to me, even where everyone may read it', async () => {
    const { useCase } = setUp();

    const given = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(
      given.items.some(
        (feedback) => feedback.topic === 'how Ana writes release notes',
      ),
    ).toBe(false);
  });

  it('lists nothing for a Workspace I have given nothing in', async () => {
    const { useCase } = setUp();

    const given = await useCase.execute({
      workspaceId: OTHER_WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(given).toEqual({ items: [], total: 0 });
  });

  it('shows a Receiver who has since been Deactivated as inactive, and keeps what I wrote', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, CARA);

    const given = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(given.items.map((feedback) => feedback.receiverStatus)).toEqual([
      'DEACTIVATED',
      'ACTIVE',
    ]);
    expect(given.items[0]?.body).toBe(
      'You kept the room with you when the demo broke.',
    );
  });

  it('names every Receiver on the page in one call, however many pieces it holds', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: ANA,
      page: ONE_PAGE,
    });

    expect(accountSummaryPort.calls).toEqual([[ANA, CARA, BEN]]);
  });
});
