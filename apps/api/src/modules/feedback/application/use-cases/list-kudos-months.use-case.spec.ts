import { describe, expect, it } from 'bun:test';
import { FakeKudosQuery, NO_TAGS } from '@test/support/feedback.fakes';
import { ListKudosMonthsUseCase } from './list-kudos-months.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w1';
const OTHER_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000w2';

function kudosRow(id: string, createdAt: string, workspaceId = WORKSPACE_ID) {
  return {
    id,
    workspaceId,
    giverAccountId: 'account-ann',
    recipientAccountIds: [],
    message: `Kudos ${id}`,
    tags: NO_TAGS,
    card: null,
    createdAt: new Date(createdAt),
  };
}

function setUp() {
  const kudosQuery = new FakeKudosQuery();
  return { kudosQuery, useCase: new ListKudosMonthsUseCase(kudosQuery) };
}

describe('counting a Workspace’s Kudos by month', () => {
  it('lists the months that hold a Kudos, newest first, and how many in all', async () => {
    const { kudosQuery, useCase } = setUp();
    kudosQuery.rows.push(
      kudosRow('k1', '2026-09-15T03:00:00.000Z'),
      kudosRow('k2', '2026-11-02T03:00:00.000Z'),
      kudosRow('k3', '2026-11-03T03:00:00.000Z'),
      kudosRow('k4', '2026-10-03T03:00:00.000Z', OTHER_WORKSPACE_ID),
    );

    const view = await useCase.execute({ workspaceId: WORKSPACE_ID });

    expect(view).toEqual({
      total: 3,
      months: [
        { month: '2026-11', count: 2 },
        { month: '2026-09', count: 1 },
      ],
    });
  });

  it('answers none for a Workspace with no Kudos', async () => {
    const { useCase } = setUp();

    expect(await useCase.execute({ workspaceId: WORKSPACE_ID })).toEqual({
      total: 0,
      months: [],
    });
  });
});
