import { describe, expect, it } from 'bun:test';
import {
  FakeKudosQuery,
  FakeWorkspaceMembershipPort,
  NO_TAGS,
} from '@test/support/feedback.fakes';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { PeopleService } from '../service/people.service';
import { ListWorkspaceKudosUseCase } from './list-workspace-kudos.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';
const ANN = 'account-ann';
const BEN = 'account-ben';
const CARA = 'account-cara';

function kudosRow(id: string, day: number, workspaceId = WORKSPACE_ID) {
  return {
    id,
    workspaceId,
    giverAccountId: ANN,
    recipientAccountIds: [BEN, CARA],
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt: new Date(`2026-10-${day}T03:00:00.000Z`),
  };
}

function setUp() {
  const kudosQuery = new FakeKudosQuery();
  kudosQuery.rows.push(
    kudosRow('k1', 11),
    kudosRow('k2', 12),
    kudosRow('k3', 13),
    kudosRow('k4', 14, OTHER_WORKSPACE_ID),
  );
  const workspaceMembershipPort = new FakeWorkspaceMembershipPort();
  const accountSummaryPort = new FakeAccountSummaryPort();
  accountSummaryPort.summaries.push(
    {
      accountId: ANN,
      email: 'ann@acme.test',
      fullName: 'Ann Lee',
      displayName: 'Ann',
      slug: 'ann',
      photoUrl: 'https://lh3.googleusercontent.com/ann',
    },
    {
      accountId: BEN,
      email: 'ben@acme.test',
      fullName: 'Ben Carter',
      displayName: 'Ben',
      slug: 'ben',
      photoUrl: null,
    },
  );
  const useCase = new ListWorkspaceKudosUseCase(
    kudosQuery,
    new PeopleService(accountSummaryPort, workspaceMembershipPort),
  );
  return { accountSummaryPort, kudosQuery, useCase };
}

describe('reading the Kudos of a Workspace', () => {
  it('lists this Workspace’s Kudos newest first, naming everyone in them', async () => {
    const { useCase } = setUp();

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { afterId: null, limit: 20 },
      month: null,
    });

    expect(page.items.map((kudos) => kudos.id)).toEqual(['k3', 'k2', 'k1']);
    expect(page.items[0]?.giver).toEqual({
      accountId: ANN,
      name: 'Ann Lee',
      photoUrl: 'https://lh3.googleusercontent.com/ann',
      status: 'ACTIVE',
    });
    expect(page.items[0]?.recipients.map((person) => person.name)).toEqual([
      'Ben Carter',
      null,
    ]);
    expect(page.nextAfterId).toBeNull();
  });

  it('says where the next page starts while more remain', async () => {
    const { useCase } = setUp();

    const first = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { afterId: null, limit: 2 },
      month: null,
    });
    const second = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { afterId: first.nextAfterId, limit: 2 },
      month: null,
    });

    expect(first.items.map((kudos) => kudos.id)).toEqual(['k3', 'k2']);
    expect(first.nextAfterId).toBe('k2');
    expect(second.items.map((kudos) => kudos.id)).toEqual(['k1']);
    expect(second.nextAfterId).toBeNull();
  });

  it('narrows to one month, by the clock everyone shares', async () => {
    const { kudosQuery, useCase } = setUp();
    kudosQuery.rows.push({
      ...kudosRow('k5', 11),
      // 06:00 on 1 November at UTC+7 is still 31 October in UTC.
      createdAt: new Date('2026-10-31T23:00:00.000Z'),
    });

    const page = await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { afterId: null, limit: 20 },
      month: '2026-11',
    });

    expect(page.items.map((kudos) => kudos.id)).toEqual(['k5']);
  });

  it('asks who people are once for the whole page', async () => {
    const { accountSummaryPort, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      page: { afterId: null, limit: 20 },
      month: null,
    });

    expect(accountSummaryPort.calls).toHaveLength(1);
  });
});
