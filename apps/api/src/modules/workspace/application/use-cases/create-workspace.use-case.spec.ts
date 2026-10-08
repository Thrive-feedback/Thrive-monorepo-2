import { describe, expect, it } from 'bun:test';
import { FakeIdGenerator } from '@test/support/id-generator.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  aWorkspaceSnapshot,
  FakeHasProfilePort,
  FakeWorkspaceRepository,
} from '@test/support/workspace.fakes';
import { WorkspaceNameEmptyError } from '../../domain/workspace.errors';
import {
  AlreadyInAWorkspaceError,
  ProfileRequiredError,
} from '../workspace.errors';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const MEMBER_ID = '0199a0f0-0000-7000-8000-0000000000bb';

function request(
  overrides: Partial<{ name: string; teamSize: string | null }> = {},
) {
  return {
    accountId: 'account-ann',
    name: '  Acme   Corp ',
    teamSize: 'FROM_11_TO_50',
    ...overrides,
  };
}

function setUp() {
  const workspaceRepository = new FakeWorkspaceRepository();
  const hasProfilePort = new FakeHasProfilePort();
  hasProfilePort.introduced.add('account-ann');
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new CreateWorkspaceUseCase(
    workspaceRepository,
    hasProfilePort,
    unitOfWork,
    new FakeIdGenerator(WORKSPACE_ID, MEMBER_ID),
  );
  return { workspaceRepository, hasProfilePort, unitOfWork, useCase };
}

describe('creating a Workspace', () => {
  it('stores it with a tidied name, the team size, and the founder as its only Owner', async () => {
    const { workspaceRepository, useCase } = setUp();

    const created = await useCase.execute(request());

    expect(created).toEqual({ id: WORKSPACE_ID });
    expect(workspaceRepository.saved).toEqual([
      {
        id: WORKSPACE_ID,
        name: 'Acme Corp',
        teamSize: 'FROM_11_TO_50',
        members: [{ id: MEMBER_ID, accountId: 'account-ann', role: 'OWNER' }],
      },
    ]);
  });

  it('stores it without a team size when none was picked', async () => {
    const { workspaceRepository, useCase } = setUp();

    await useCase.execute(request({ teamSize: null }));

    expect(workspaceRepository.saved[0]?.teamSize).toBeNull();
  });

  it('serializes the founder, so two tabs cannot both create one', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(request());

    expect(unitOfWork.opened).toEqual([
      { serializeOn: 'workspace-founder:account-ann' },
    ]);
  });

  it('is refused to someone who has not introduced themselves', async () => {
    const { hasProfilePort, workspaceRepository, useCase } = setUp();
    hasProfilePort.introduced.clear();

    await expect(useCase.execute(request())).rejects.toThrow(
      ProfileRequiredError,
    );
    expect(workspaceRepository.saved).toEqual([]);
  });

  it('is refused to someone who is already a Member of a Workspace', async () => {
    const { workspaceRepository, useCase } = setUp();
    workspaceRepository.holding(aWorkspaceSnapshot());

    await expect(useCase.execute(request())).rejects.toThrow(
      AlreadyInAWorkspaceError,
    );
    expect(workspaceRepository.saved).toHaveLength(1);
  });

  it('saves nothing when the name is blank', async () => {
    const { workspaceRepository, useCase } = setUp();

    await expect(useCase.execute(request({ name: '   ' }))).rejects.toThrow(
      WorkspaceNameEmptyError,
    );
    expect(workspaceRepository.saved).toEqual([]);
  });
});
