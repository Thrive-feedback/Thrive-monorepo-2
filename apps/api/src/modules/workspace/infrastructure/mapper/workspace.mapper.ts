import type {
  Member as MemberRecord,
  Workspace as WorkspaceRecord,
} from '@app/infrastructure/database/generated/client';
import { Workspace } from '../../domain/entity/workspace.entity';

/**
 * The only place that knows both the stored `workspace` and `member` rows and the Workspace.
 * A stored `userId` is the domain's `accountId`: the same Thrive Account, named in the
 * column after the `user` table it points at.
 */

export function toWorkspace(
  record: WorkspaceRecord & { readonly members: readonly MemberRecord[] },
): Workspace {
  return Workspace.restore({
    id: record.id,
    name: record.name,
    teamSize: record.teamSize,
    members: record.members.map((member) => ({
      id: member.id,
      accountId: member.userId,
      role: member.role,
    })),
  });
}

type Unstamped<T> = Omit<T, 'createdAt' | 'updatedAt'>;

/** The audit timestamps are the database's to set. */
export function toWorkspaceRecord(workspace: Workspace): {
  readonly workspace: Unstamped<WorkspaceRecord>;
  readonly members: readonly Omit<Unstamped<MemberRecord>, 'workspaceId'>[];
} {
  const snapshot = workspace.snapshot();
  return {
    workspace: {
      id: snapshot.id,
      name: snapshot.name,
      teamSize: snapshot.teamSize,
    },
    members: snapshot.members.map((member) => ({
      id: member.id,
      userId: member.accountId,
      role: member.role,
    })),
  };
}
