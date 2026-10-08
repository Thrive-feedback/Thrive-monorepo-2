import { HasProfilePort } from '@app/modules/identity';
import {
  Workspace,
  type WorkspaceSnapshot,
} from '@app/modules/workspace/domain/entity/workspace.entity';
import { WorkspaceRepository } from '@app/modules/workspace/domain/repository/workspace-repository.port';

/** A stored Workspace with its Owner, with any field the test cares about overridden. */
export function aWorkspaceSnapshot(
  overrides: Partial<WorkspaceSnapshot> = {},
): WorkspaceSnapshot {
  return {
    id: '0199a0f0-0000-7000-8000-0000000000w1',
    name: 'Acme Corp',
    teamSize: 'FROM_11_TO_50',
    members: [
      {
        id: '0199a0f0-0000-7000-8000-0000000000m1',
        accountId: 'account-ann',
        role: 'OWNER',
      },
    ],
    ...overrides,
  };
}

/** Workspaces held in memory. */
export class FakeWorkspaceRepository extends WorkspaceRepository {
  readonly saved: WorkspaceSnapshot[] = [];

  holding(...snapshots: WorkspaceSnapshot[]): this {
    this.saved.push(...snapshots);
    return this;
  }

  async findById(id: string): Promise<Workspace | null> {
    const found = this.saved.find((workspace) => workspace.id === id);
    return found ? Workspace.restore(found) : null;
  }

  async findByMemberAccount(accountId: string): Promise<Workspace | null> {
    const found = this.saved.find((workspace) =>
      workspace.members.some((member) => member.accountId === accountId),
    );
    return found ? Workspace.restore(found) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    this.saved.push(workspace.snapshot());
  }
}

/** Answers from the Accounts the test says have introduced themselves. */
export class FakeHasProfilePort extends HasProfilePort {
  readonly introduced = new Set<string>();

  async hasProfile(accountId: string): Promise<boolean> {
    return this.introduced.has(accountId);
  }
}
