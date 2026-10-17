import {
  type AccountSummary,
  AccountSummaryPort,
  HasProfilePort,
  ProfileNamePort,
} from '@app/modules/identity';
import {
  MemberDeactivating,
  type MemberDeactivation,
} from '@app/modules/workspace/application/port/member-deactivating.port';
import {
  type MemberRoleChange,
  MemberRoleChanging,
} from '@app/modules/workspace/application/port/member-role-changing.port';
import {
  type FoundedWorkspace,
  WorkspaceFounding,
  type WorkspaceFoundingInput,
} from '@app/modules/workspace/application/port/workspace-founding.port';
import {
  type InvitationAcceptance,
  type InvitationReissued,
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
  PendingInvitationPage,
  PendingInvitationView,
} from '@app/modules/workspace/application/types/invitation.types';
import type {
  MemberStatus,
  MembershipPage,
  MembershipView,
  PageRequest,
  WorkspaceMemberPage,
} from '@app/modules/workspace/application/types/membership.types';
import { AlreadyInAWorkspaceError } from '@app/modules/workspace/application/workspace.errors';
import type { InvitationRecipient } from '@app/modules/workspace/domain/value-object/invitation-recipient.vo';
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
  readonly displayNames = new Map<string, string>();

  async displayNameOf(accountId: string): Promise<string | null> {
    return this.displayNames.get(accountId) ?? null;
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

  /** Ids whose revoke fails, as one the store could not be reached for would. */
  readonly revokeFailsFor = new Set<string>();

  async revoke(revocation: InvitationRevocation): Promise<void> {
    if (this.revokeFails || this.revokeFailsFor.has(revocation.invitationId)) {
      throw new Error('The store refused the revoke.');
    }
    this.revoked.push(revocation);
    this.pending.delete(revocation.invitationId);
  }

  /**
   * Like the store: an address with a Pending Invitation keeps it, extended to `expiresAt`, and
   * any other is given a new one from the ids. List an id in `expired` to have its address
   * treated as having none Pending.
   */
  readonly expired = new Set<string>();

  /** Every resend asked for, in order. */
  readonly reissues: InvitationRequest[] = [];

  async reissue(request: InvitationRequest): Promise<InvitationReissued> {
    this.reissues.push(request);
    if (this.members.has(request.email)) {
      return { outcome: 'already_member' };
    }
    const pendingId = [...this.pending].find(
      ([id, email]) => email === request.email && !this.expired.has(id),
    )?.[0];
    if (pendingId !== undefined) {
      return {
        outcome: 'reissued',
        invitationId: pendingId,
        expiresAt: this.expiresAt,
      };
    }
    const invitationId = this.ids.shift();
    if (invitationId === undefined) {
      throw new Error('FakeWorkspaceInviting ran out of ids.');
    }
    this.pending.set(invitationId, request.email);
    return { outcome: 'reissued', invitationId, expiresAt: this.expiresAt };
  }

  /** When each Invitation's email was recorded as sent, by id. */
  readonly sentAt = new Map<string, Date>();

  async markSent(invitationId: string, sentAt: Date): Promise<void> {
    this.sentAt.set(invitationId, sentAt);
  }
}

/**
 * Memberships held in memory, keyed by Account and Workspace. One with a `deactivatedAt` is kept
 * but, like the real store, answered only where Deactivated Members are asked for.
 */
export class FakeMembershipQuery extends MembershipQuery {
  readonly memberships: (MembershipView & {
    readonly accountId: string;
    readonly deactivatedAt?: Date;
  })[] = [];

  private get active() {
    return this.memberships.filter((m) => m.deactivatedAt === undefined);
  }

  async membershipsOfAccount(
    accountId: string,
    page: PageRequest,
  ): Promise<MembershipPage> {
    const items = this.active
      .filter((m) => m.accountId === accountId)
      .map((m) => ({ workspace: m.workspace, role: m.role }));
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
    const found = this.active.find(
      (m) => m.accountId === accountId && m.workspace.id === workspaceId,
    );
    return found ? { workspace: found.workspace, role: found.role } : null;
  }

  async membersAmong(
    workspaceId: string,
    accountIds: readonly string[],
  ): Promise<readonly string[]> {
    return this.active
      .filter(
        (m) =>
          m.workspace.id === workspaceId && accountIds.includes(m.accountId),
      )
      .map((m) => m.accountId);
  }

  async membersOfWorkspace(
    workspaceId: string,
    page: PageRequest,
    status: MemberStatus,
  ): Promise<WorkspaceMemberPage> {
    const items = this.memberships
      .filter(
        (m) =>
          m.workspace.id === workspaceId &&
          (m.deactivatedAt === undefined) === (status === 'ACTIVE'),
      )
      .map((m) => ({ accountId: m.accountId, role: m.role }));
    const start = (page.page - 1) * page.pageSize;
    return {
      items: items.slice(start, start + page.pageSize),
      total: items.length,
    };
  }

  async adminCountOf(workspaceId: string): Promise<number> {
    return this.active.filter(
      (m) => m.workspace.id === workspaceId && m.role === 'ADMIN',
    ).length;
  }

  async isDeactivatedIn(
    accountId: string,
    workspaceId: string,
  ): Promise<boolean> {
    return this.memberships.some(
      (m) =>
        m.accountId === accountId &&
        m.workspace.id === workspaceId &&
        m.deactivatedAt !== undefined,
    );
  }
}

/** Deactivates in the memberships a `FakeMembershipQuery` holds, and records each one. */
export class FakeMemberDeactivating extends MemberDeactivating {
  readonly deactivations: MemberDeactivation[] = [];

  constructor(private readonly membershipQuery: FakeMembershipQuery) {
    super();
  }

  async deactivate(deactivation: MemberDeactivation): Promise<void> {
    this.deactivations.push(deactivation);
    const index = this.membershipQuery.memberships.findIndex(
      (m) =>
        m.accountId === deactivation.accountId &&
        m.workspace.id === deactivation.workspaceId,
    );
    const found = this.membershipQuery.memberships[index];
    if (found) {
      this.membershipQuery.memberships[index] = {
        ...found,
        deactivatedAt: deactivation.deactivatedAt,
      };
    }
  }
}

/** Changes Roles in the memberships a `FakeMembershipQuery` holds, and records each change. */
export class FakeMemberRoleChanging extends MemberRoleChanging {
  readonly changes: MemberRoleChange[] = [];

  constructor(private readonly membershipQuery: FakeMembershipQuery) {
    super();
  }

  async change(change: MemberRoleChange): Promise<void> {
    this.changes.push(change);
    const index = this.membershipQuery.memberships.findIndex(
      (m) =>
        m.accountId === change.accountId &&
        m.workspace.id === change.workspaceId,
    );
    const found = this.membershipQuery.memberships[index];
    if (found) {
      this.membershipQuery.memberships[index] = { ...found, role: change.role };
    }
  }
}

/** Answers the Accounts the test has described, as Identity would. */
export class FakeAccountSummaryPort extends AccountSummaryPort {
  readonly summaries: AccountSummary[] = [];
  /** One entry per call, holding what was asked for: how a test sees an N+1 read. */
  readonly calls: (readonly string[])[] = [];

  async summariesOf(accountIds: readonly string[]): Promise<AccountSummary[]> {
    this.calls.push([...accountIds]);
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

  /** Invitations as their recipients read them, keyed by the stored address. */
  readonly sentTo = new Map<string, PendingInvitationView[]>();

  async pendingInvitationsTo(
    recipient: InvitationRecipient,
    now: Date,
    page: PageRequest,
  ): Promise<PendingInvitationPage> {
    const items = (this.sentTo.get(recipient.toString()) ?? []).filter(
      (invitation) => invitation.expiresAt > now,
    );
    const start = (page.page - 1) * page.pageSize;
    return {
      items: items.slice(start, start + page.pageSize),
      total: items.length,
    };
  }
}
