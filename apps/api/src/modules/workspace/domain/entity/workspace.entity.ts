import {
  MemberRole,
  type MemberRoleValue,
} from '../value-object/member-role.vo';
import { TeamSize, type TeamSizeValue } from '../value-object/team-size.vo';
import { WorkspaceName } from '../value-object/workspace-name.vo';

export interface MemberSnapshot {
  readonly id: string;
  readonly accountId: string;
  readonly role: MemberRoleValue;
}

export interface WorkspaceSnapshot {
  readonly id: string;
  readonly name: string;
  readonly teamSize: TeamSizeValue | null;
  readonly members: readonly MemberSnapshot[];
}

interface Member {
  readonly id: string;
  readonly accountId: string;
  readonly role: MemberRole;
}

/**
 * One company's space in Thrive, and the Members who belong to it. A Workspace never
 * exists without its Owner: founding one makes the founder its only Member, as Owner.
 */
export class Workspace {
  private constructor(
    private readonly id: string,
    private readonly name: WorkspaceName,
    private readonly teamSize: TeamSize | null,
    private readonly members: readonly Member[],
  ) {}

  static found(details: {
    readonly id: string;
    readonly name: WorkspaceName;
    readonly teamSize: TeamSize | null;
    readonly founder: { readonly memberId: string; readonly accountId: string };
  }): Workspace {
    return new Workspace(details.id, details.name, details.teamSize, [
      {
        id: details.founder.memberId,
        accountId: details.founder.accountId,
        role: MemberRole.Owner,
      },
    ]);
  }

  /** Rebuilds a stored Workspace. */
  static restore(snapshot: WorkspaceSnapshot): Workspace {
    return new Workspace(
      snapshot.id,
      WorkspaceName.of(snapshot.name),
      snapshot.teamSize === null ? null : TeamSize.of(snapshot.teamSize),
      snapshot.members.map((member) => ({
        id: member.id,
        accountId: member.accountId,
        role: MemberRole.of(member.role),
      })),
    );
  }

  snapshot(): WorkspaceSnapshot {
    return {
      id: this.id,
      name: this.name.toString(),
      teamSize: this.teamSize?.toString() ?? null,
      members: this.members.map((member) => ({
        id: member.id,
        accountId: member.accountId,
        role: member.role.toString(),
      })),
    };
  }
}
