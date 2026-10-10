import {
  type AccountSummary,
  AccountSummaryPort,
  HasProfilePort,
  ProfileNamePort,
} from '@app/modules/identity';
import {
  type FoundedWorkspace,
  WorkspaceFounding,
  type WorkspaceFoundingInput,
} from '@app/modules/workspace/application/port/workspace-founding.port';
import {
  type InvitationAcceptance,
  type InvitationRequest,
  type InvitationRevocation,
  type InvitationStored,
  WorkspaceInviting,
} from '@app/modules/workspace/application/port/workspace-inviting.port';
import { InvitationQuery } from '@app/modules/workspace/application/query-port/invitation.query-port';
import { MembershipQuery } from '@app/modules/workspace/application/query-port/membership.query-port';
import type {
  InvitationDetailView,
  InvitationPage,
  InvitationView,
} from '@app/modules/workspace/application/types/invitation.types';
import type {
  MembershipPage,
  MembershipView,
  PageRequest,
  WorkspaceMemberPage,
} from '@app/modules/workspace/application/types/membership.types';
import { AlreadyInAWorkspaceError } from '@app/modules/workspace/application/workspace.errors';
import { InvitationStatus } from '@app/modules/workspace/domain/value-object/invitation-status.vo';

/**
 * Remembers each Workspace it was asked to found, and answers the ids it was given. Like the
 * real store, it refuses a credential whose founder already has one.
 */
export class FakeWorkspaceFounding extends WorkspaceFounding {
  readonly founded: WorkspaceFoundingInput[] = [];
  /** Credentials whose founder is already a Member of a Workspace. */
  readonly alreadyMembers = new Set<string>();
  private readonly ids: string[];

  constructor(...ids: string[]) {
    super();
    this.ids = ids;
  }

  async found(input: WorkspaceFoundingInput): Promise<FoundedWorkspace> {
    if (this.alreadyMembers.has(input.credential)) {
      throw new AlreadyInAWorkspaceError();
    }
    const workspaceId = this.ids.shift();
    if (workspaceId === undefined) {
      throw new Error('FakeWorkspaceFounding ran out of ids.');
    }
    this.founded.push(input);
    return { workspaceId };
  }
}

/** Answers from the Accounts the test says have introduced themselves. */
export class FakeHasProfilePort extends HasProfilePort {
  readonly introduced = new Set<string>();

  async hasProfile(accountId: string): Promise<boolean> {
    return this.introduced.has(accountId);
  }
}

/** Answers the names of the Accounts the test says have introduced themselves. */
export class FakeProfileNamePort extends ProfileNamePort {
  readonly fullNames = new Map<string, string>();

  async fullNameOf(accountId: string): Promise<string | null> {
    return this.fullNames.get(accountId) ?? null;
  }
}

/**
 * Invitations held in memory. Like the real store, it answers `already_member` for an address
 * in `members` and `already_invited` for one with a Pending Invitation, and stores the rest
 * with the ids it was given, expiring at `expiresAt`.
 */
export class FakeWorkspaceInviting extends WorkspaceInviting {
  readonly members = new Set<string>();
  readonly pending = new Map<string, string>();
  readonly revoked: InvitationRevocation[] = [];
  readonly requests: InvitationRequest[] = [];
  private readonly ids: string[];

  constructor(
    readonly expiresAt: Date,
    ...ids: string[]
  ) {
    super();
    this.ids = ids;
  }

  async invite(request: InvitationRequest): Promise<InvitationStored> {
    this.requests.push(request);
    if (this.members.has(request.email)) {
      return { outcome: 'already_member' };
    }
    if ([...this.pending.values()].includes(request.email)) {
      return { outcome: 'already_invited' };
    }
    const invitationId = this.ids.shift();
    if (invitationId === undefined) {
      throw new Error('FakeWorkspaceInviting ran out of ids.');
    }
    this.pending.set(invitationId, request.email);
    return { outcome: 'invited', invitationId, expiresAt: this.expiresAt };
  }

  readonly accepted: InvitationAcceptance[] = [];

  async accept(acceptance: InvitationAcceptance): Promise<void> {
    this.accepted.push(acceptance);
  }

  /** Set to make every revoke fail, as a store that cannot be reached would. */
  revokeFails = false;

  async revoke(revocation: InvitationRevocation): Promise<void> {
    if (this.revokeFails) {
      throw new Error('The store refused the revoke.');
    }
    this.revoked.push(revocation);
    this.pending.delete(revocation.invitationId);
  }
}

/** Memberships held in memory, keyed by Account and Workspace. */
export class FakeMembershipQuery extends MembershipQuery {
  readonly memberships: (MembershipView & { readonly accountId: string })[] =
    [];

  async membershipsOfAccount(
    accountId: string,
    page: PageRequest,
  ): Promise<MembershipPage> {
    const items = this.memberships.filter((m) => m.accountId === accountId);
    const start = (page.page - 1) * page.pageSize;
    return {
      items: items.slice(start, start + page.pageSize),
      total: items.length,
    };
  }

  async membershipInWorkspace(
    accountId: string,
    workspaceId: string,
  ): Promise<MembershipView | null> {
    const found = this.memberships.find(
      (m) => m.accountId === accountId && m.workspace.id === workspaceId,
    );
    return found ? { workspace: found.workspace, role: found.role } : null;
  }

  async membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
  ): Promise<WorkspaceMemberPage> {
    const items = this.memberships
      .filter((m) => m.workspace.id === workspaceId)
      .map((m) => ({ accountId: m.accountId, role: m.role }));
    const start = (page.page - 1) * page.pageSize;
    return {
      items: items.slice(start, start + page.pageSize),
      total: items.length,
    };
  }
}

/** Answers the Accounts the test has described, as Identity would. */
export class FakeAccountSummaryPort extends AccountSummaryPort {
  readonly summaries: AccountSummary[] = [];

  async summariesOf(accountIds: readonly string[]): Promise<AccountSummary[]> {
    return this.summaries.filter((s) => accountIds.includes(s.accountId));
  }
}

/**
 * Invitations held in memory, answered as the store would at the instant given: open ones for a
 * Workspace's list, and single ones in whatever status the test set.
 */
export class FakeInvitationQuery extends InvitationQuery {
  readonly invitations: (Omit<InvitationView, 'status'> & {
    readonly workspaceId: string;
  })[] = [];

  async openInvitationsOfWorkspace(
    workspaceId: string,
    now: Date,
    page: PageRequest,
  ): Promise<InvitationPage> {
    const items = this.invitations
      .filter((i) => i.workspaceId === workspaceId)
      .map(({ workspaceId: _, ...invitation }) => ({
        ...invitation,
        status: InvitationStatus.openAt(invitation.expiresAt, now),
      }));
    const start = (page.page - 1) * page.pageSize;
    return {
      items: items.slice(start, start + page.pageSize),
      total: items.length,
    };
  }

  /** Single Invitations as the store would answer them, keyed by id, status already worked out. */
  readonly details = new Map<string, InvitationDetailView>();

  async invitationById(
    invitationId: string,
  ): Promise<InvitationDetailView | null> {
    return this.details.get(invitationId) ?? null;
  }
}
