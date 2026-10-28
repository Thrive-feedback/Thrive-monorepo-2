import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';
import { FeedbackAskNotFoundError } from '../feedback-request.errors';
import { PeopleService } from '../service/people.service';
import { GetFeedbackAskUseCase } from './get-feedback-ask.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const REQUEST_ID = '0199a0f0-0000-7000-8000-0000000000f1';
const ASK_FOR_BEN = '0199a0f0-0000-7000-8000-0000000000a1';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';
const CREATED_AT = new Date('2026-10-11T03:00:00.000Z');

function setUp(visibility: VisibilityValue = 'ONLY_ME') {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  feedbackRequestQuery.rows.push({
    id: REQUEST_ID,
    workspaceId: WORKSPACE_ID,
    requesterAccountId: ANA,
    message: 'my presentation skills',
    tags: NO_TAGS,
    visibility,
    selectedAccountIds: [],
    createdAt: CREATED_AT,
    asks: [{ askId: ASK_FOR_BEN, giverAccountId: BEN, status: 'PENDING' }],
  });
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: ANA,
    email: 'ana@acme.test',
    fullName: 'Ana Silva',
    displayName: 'Ana',
    slug: null,
    photoUrl: null,
  });
  const useCase = new GetFeedbackAskUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { workspaceMembershipPort, accountSummaryPort, useCase };
}

describe('reading one Ask waiting for me', () => {
  it('says who asked, about what, and where the Ask stands', async () => {
    const { useCase } = setUp();

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask).toEqual({
      askId: ASK_FOR_BEN,
      feedbackRequestId: REQUEST_ID,
      message: 'my presentation skills',
      tags: NO_TAGS,
      requesterAccountId: ANA,
      requesterName: 'Ana Silva',
      requesterPhotoUrl: null,
      requesterStatus: 'ACTIVE',
      status: 'PENDING',
      createdAt: CREATED_AT,
      onWorkspaceFeed: false,
    });
  });

  it('tells the Member asked that their answer goes on the Workspace feed when the request is shared with everyone', async () => {
    const { useCase } = setUp('EVERYONE');

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask.onWorkspaceFeed).toBe(true);
  });

  it('does not say the answer goes on the feed when the request is shared with selected people', async () => {
    const { useCase } = setUp('SELECTED_PEOPLE');

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask.onWorkspaceFeed).toBe(false);
  });

  it('shows a Requester who has since been Deactivated as inactive', async () => {
    const { workspaceMembershipPort, useCase } = setUp();
    workspaceMembershipPort.withDeactivated(WORKSPACE_ID, ANA);

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask.requesterStatus).toBe('DEACTIVATED');
  });

  it('leaves the Requester unnamed while they have not introduced themselves', async () => {
    const { accountSummaryPort, useCase } = setUp();
    accountSummaryPort.summaries.length = 0;

    const ask = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      giverAccountId: BEN,
      askId: ASK_FOR_BEN,
    });

    expect(ask.requesterName).toBeNull();
  });

  it('answers not-found for an Ask addressed to somebody else', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: WORKSPACE_ID,
        giverAccountId: CARA,
        askId: ASK_FOR_BEN,
      }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
  });

  it('answers not-found for an Ask in another Workspace', async () => {
    const { useCase } = setUp();

    await expect(
      useCase.execute({
        workspaceId: OTHER_WORKSPACE_ID,
        giverAccountId: BEN,
        askId: ASK_FOR_BEN,
      }),
    ).rejects.toThrow(FeedbackAskNotFoundError);
  });
});
