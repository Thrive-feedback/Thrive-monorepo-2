import { describe, expect, it } from 'bun:test';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeHasProfilePort,
  FakeWorkspaceFounding,
} from '@test/support/workspace.fakes';
import { WorkspaceNameEmptyError } from '../../domain/workspace.errors';
import {
  AlreadyInAWorkspaceError,
  ProfileRequiredError,
} from '../workspace.errors';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const ANN_COOKIE = 'thrive.session_token=ann';

function request(
  overrides: Partial<{ name: string; teamSize: string | null }> = {},
) {
  return {
    accountId: 'account-ann',
    credential: ANN_COOKIE,
    name: '  Acme   Corp ',
    teamSize: 'FROM_11_TO_50',
    ...overrides,
  };
}

function setUp() {
  const workspaceFounding = new FakeWorkspaceFounding(WORKSPACE_ID);
  const hasProfilePort = new FakeHasProfilePort();
  hasProfilePort.introduced.add('account-ann');
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new CreateWorkspaceUseCase(
    workspaceFounding,
    hasProfilePort,
    unitOfWork,
  );
  return {
    workspaceFounding,
    hasProfilePort,
    unitOfWork,
    useCase,
  };
}

describe('creating a Workspace', () => {
  it("founds it with a tidied name and the team size, on the founder's session", async () => {
    const { workspaceFounding, useCase } = setUp();

    const created = await useCase.execute(request());

    expect(created).toEqual({ id: WORKSPACE_ID });
    expect(workspaceFounding.founded).toEqual([
      {
        credential: ANN_COOKIE,
        name: 'Acme Corp',
        teamSize: 'FROM_11_TO_50',
      },
    ]);
  });

  it('founds it without a team size when none was picked', async () => {
    const { workspaceFounding, useCase } = setUp();

    await useCase.execute(request({ teamSize: null }));

    expect(workspaceFounding.founded[0]?.teamSize).toBeNull();
  });

  it('serializes the founder, so two tabs cannot both create one', async () => {
    const { unitOfWork, useCase } = setUp();

    await useCase.execute(request());

    expect(unitOfWork.opened).toEqual([
      { serializeOn: 'account-workspace:account-ann' },
    ]);
  });

  it('is refused to someone who has not introduced themselves', async () => {
    const { hasProfilePort, workspaceFounding, useCase } = setUp();
    hasProfilePort.introduced.clear();

    await expect(useCase.execute(request())).rejects.toThrow(
      ProfileRequiredError,
    );
    expect(workspaceFounding.founded).toEqual([]);
  });

  it('is refused to someone who is already a Member of a Workspace', async () => {
    const { workspaceFounding, useCase } = setUp();
    workspaceFounding.alreadyMembers.add(ANN_COOKIE);

    await expect(useCase.execute(request())).rejects.toThrow(
      AlreadyInAWorkspaceError,
    );
    expect(workspaceFounding.founded).toEqual([]);
  });

  it('founds nothing when the name is blank', async () => {
    const { workspaceFounding, useCase } = setUp();

    await expect(useCase.execute(request({ name: '   ' }))).rejects.toThrow(
      WorkspaceNameEmptyError,
    );
    expect(workspaceFounding.founded).toEqual([]);
  });
});
