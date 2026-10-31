import { describe, expect, it } from 'bun:test';
import {
  FakeFeedbackRequestQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import type { WaitingAskSort } from '../types/feedback-request.types';
import { ListWaitingAsksUseCase } from './list-waiting-asks.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const ANA = 'account-ana';
const BEN = 'account-ben';
const CARA = 'account-cara';

function setUp() {
  const feedbackRequestQuery = new FakeFeedbackRequestQuery();
  const ask = (
    id: string,
    giverAccountId: string,
    status: 'PENDING' | 'ANSWERED',
    day: number,
  ) =>
    feedbackRequestQuery.rows.push({
      id: `request-${id}`,
      workspaceId: WORKSPACE_ID,
      requesterAccountId: ANA,
      message: `Asked on day ${day}`,
      postcard: null,
      tags: NO_TAGS,
      visibility: 'ONLY_ME',
      selectedAccountIds: [],
      createdAt: new Date(Date.UTC(2026, 9, day)),
      asks: [{ askId: id, giverAccountId, status }],
    });
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push({
    accountId: ANA,
    email: 'ana@acme.test',
    fullName: 'Ana Silva',
    displayName: 'Ana',
    slug: null,
    photoUrl: null,
  });
  const useCase = new ListWaitingAsksUseCase(
    feedbackRequestQuery,
    new PeopleService(accountSummaryPort, new FakeWorkspaceMembershipPort()),
  );
  return { ask, useCase };
}

const read = (
  useCase: ListWaitingAsksUseCase,
  afterId: string | null,
  sort: WaitingAskSort = 'NEWEST',
) =>
  useCase.execute({
    workspaceId: WORKSPACE_ID,
    giverAccountId: BEN,
    sort,
    page: { afterId, limit: 2 },
  });

describe('reading the Asks still waiting for me', () => {
  it('names who asked, newest first, and says where the next page starts', async () => {
    const { ask, useCase } = setUp();
    ask('ask-1', BEN, 'PENDING', 1);
    ask('ask-2', BEN, 'PENDING', 2);
    ask('ask-3', BEN, 'PENDING', 3);

    const page = await read(useCase, null);

    expect(page.items.map((item) => item.askId)).toEqual(['ask-3', 'ask-2']);
    expect(page.items[0]?.requesterName).toBe('Ana Silva');
    expect(page.nextAfterId).toBe('ask-2');
  });

  it('reads oldest first when asked, and pages on in that order', async () => {
    const { ask, useCase } = setUp();
    ask('ask-1', BEN, 'PENDING', 1);
    ask('ask-2', BEN, 'PENDING', 2);
    ask('ask-3', BEN, 'PENDING', 3);

    const first = await read(useCase, null, 'OLDEST');
    const second = await read(useCase, first.nextAfterId, 'OLDEST');

    expect(first.items.map((item) => item.askId)).toEqual(['ask-1', 'ask-2']);
    expect(second.items.map((item) => item.askId)).toEqual(['ask-3']);
    expect(second.nextAfterId).toBeNull();
  });

  it('ends on the last page', async () => {
    const { ask, useCase } = setUp();
    ask('ask-1', BEN, 'PENDING', 1);
    ask('ask-2', BEN, 'PENDING', 2);
    ask('ask-3', BEN, 'PENDING', 3);

    const page = await read(useCase, 'ask-2');

    expect(page.items.map((item) => item.askId)).toEqual(['ask-1']);
    expect(page.nextAfterId).toBeNull();
  });

  it('reads on from an Ask that was answered since', async () => {
    const { ask, useCase } = setUp();
    ask('ask-1', BEN, 'PENDING', 1);
    ask('ask-2', BEN, 'ANSWERED', 2);
    ask('ask-3', BEN, 'PENDING', 3);

    const page = await read(useCase, 'ask-2');

    expect(page.items.map((item) => item.askId)).toEqual(['ask-1']);
  });

  it('leaves out what was answered and what waits on somebody else', async () => {
    const { ask, useCase } = setUp();
    ask('ask-1', BEN, 'ANSWERED', 1);
    ask('ask-2', CARA, 'PENDING', 2);

    const page = await read(useCase, null);

    expect(page.items).toEqual([]);
    expect(page.nextAfterId).toBeNull();
  });
});
