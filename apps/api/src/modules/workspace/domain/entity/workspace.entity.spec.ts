import { describe, expect, it } from 'bun:test';
import { aWorkspaceSnapshot } from '@test/support/workspace.fakes';
import { TeamSize } from '../value-object/team-size.vo';
import { WorkspaceName } from '../value-object/workspace-name.vo';
import { Workspace } from './workspace.entity';

describe('founding a Workspace', () => {
  it('makes the founder its only Member, as Owner', () => {
    const workspace = Workspace.found({
      id: 'workspace-1',
      name: WorkspaceName.of('Acme Corp'),
      teamSize: TeamSize.of('FROM_2_TO_10'),
      founder: { memberId: 'member-1', accountId: 'account-ann' },
    });

    expect(workspace.snapshot()).toEqual({
      id: 'workspace-1',
      name: 'Acme Corp',
      teamSize: 'FROM_2_TO_10',
      members: [{ id: 'member-1', accountId: 'account-ann', role: 'OWNER' }],
    });
  });

  it('needs no team size', () => {
    const workspace = Workspace.found({
      id: 'workspace-1',
      name: WorkspaceName.of('Acme Corp'),
      teamSize: null,
      founder: { memberId: 'member-1', accountId: 'account-ann' },
    });

    expect(workspace.snapshot().teamSize).toBeNull();
  });
});

describe('a stored Workspace', () => {
  it('comes back as it was stored', () => {
    const snapshot = aWorkspaceSnapshot();

    expect(Workspace.restore(snapshot).snapshot()).toEqual(snapshot);
  });
});
