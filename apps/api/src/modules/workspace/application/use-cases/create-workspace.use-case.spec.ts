import { describe, expect, it } from 'bun:test';
import { FakeClock } from '@test/support/clock.fake';
import { FakeUnitOfWork } from '@test/support/unit-of-work.fake';
import {
  FakeHasProfilePort,
  FakeMembershipQuery,
  FakeSessionWorkspace,
  FakeWorkspaceFounding,
  FakeWorkspaceSwitching,
} from '@test/support/workspace.fakes';
import { WorkspaceNameEmptyError } from '../../domain/workspace.errors';
import { ProfileRequiredError } from '../workspace.errors';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000aa';
const SECOND_WORKSPACE_ID = '0199a0f0-0000-7000-8000-0000000000bb';
const NOW = new Date('2026-10-18T03:00:00Z');
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
  const workspaceFounding = new FakeWorkspaceFounding(
    WORKSPACE_ID,
    SECOND_WORKSPACE_ID,
  );
  const workspaceSwitching = new FakeWorkspaceSwitching(
    new FakeMembershipQuery(),
  );
  const sessionWorkspace = new FakeSessionWorkspace();
  const hasProfilePort = new FakeHasProfilePort();
  hasProfilePort.introduced.add('account-ann');
  const unitOfWork = new FakeUnitOfWork();
  const useCase = new CreateWorkspaceUseCase(
    workspaceFounding,
    workspaceSwitching,
    sessionWorkspace,
    hasProfilePort,
    unitOfWork,
    new FakeClock(NOW),
  );
  return {
    workspaceFounding,
    workspaceSwitching,
    sessionWorkspace,
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

  it("puts the founder's session in the new Workspace", async () => {
    const { sessionWorkspace, useCase } = setUp();

    await useCase.execute(request());

    expect(await sessionWorkspace.selectedIn(ANN_COOKIE)).toBe(WORKSPACE_ID);
  });

  it('lists the new Workspace first, as the one used last', async () => {
    const { workspaceSwitching, useCase } = setUp();

    await useCase.execute(request());

    expect(workspaceSwitching.switches).toEqual([
      { workspaceId: WORKSPACE_ID, accountId: 'account-ann', switchedAt: NOW },
    ]);
  });

  it('founds one Workspace for each request, however many the founder has', async () => {
    const { workspaceFounding, useCase } = setUp();

    const first = await useCase.execute(request());
    const second = await useCase.execute(request({ name: 'Beta' }));

    expect([first.id, second.id]).toEqual([WORKSPACE_ID, SECOND_WORKSPACE_ID]);
    expect(workspaceFounding.founded).toHaveLength(2);
  });

  it('is refused to someone who has not introduced themselves', async () => {
    const { hasProfilePort, workspaceFounding, useCase } = setUp();
    hasProfilePort.introduced.clear();

    await expect(useCase.execute(request())).rejects.toThrow(
      ProfileRequiredError,
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
