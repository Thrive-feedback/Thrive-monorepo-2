import { describe, expect, it } from 'bun:test';
import { FakeWorkspaceGoalQuery } from '@test/support/workspace-goal.fakes';
import { FindActiveWorkspaceGoalsUseCase } from './find-active-workspace-goals.use-case';

const WORKSPACE_ID = 'workspace-acme';

function setUp() {
  const workspaceGoalQuery = new FakeWorkspaceGoalQuery(undefined, [
    { id: 'goal-ownership', name: 'Ownership' },
    { id: 'goal-thai', name: 'ลูกค้ามาก่อน' },
  ]);
  return {
    workspaceGoalQuery,
    useCase: new FindActiveWorkspaceGoalsUseCase(workspaceGoalQuery),
  };
}

describe('finding the active Workspace Goals some hashtags name', () => {
  it('matches a hashtag in any letter case and answers the Admin’s spelling', async () => {
    const { useCase } = setUp();

    expect(
      await useCase.execute({
        workspaceId: WORKSPACE_ID,
        names: ['OWNERSHIP', 'ลูกค้ามาก่อน', 'notalist'],
      }),
    ).toEqual([
      { id: 'goal-ownership', name: 'Ownership' },
      { id: 'goal-thai', name: 'ลูกค้ามาก่อน' },
    ]);
  });

  it('asks once per Workspace Goal however many times, and in whatever case, it is written', async () => {
    const { workspaceGoalQuery, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      names: ['ownership', 'Ownership', 'OWNERSHIP'],
    });

    expect(workspaceGoalQuery.keysAsked).toEqual([
      { workspaceId: WORKSPACE_ID, nameKeys: ['ownership'] },
    ]);
  });

  it('leaves out a name no Workspace Goal could have', async () => {
    const { workspaceGoalQuery, useCase } = setUp();

    await useCase.execute({
      workspaceId: WORKSPACE_ID,
      names: ['a'.repeat(31)],
    });

    expect(workspaceGoalQuery.keysAsked).toEqual([
      { workspaceId: WORKSPACE_ID, nameKeys: [] },
    ]);
  });
});
