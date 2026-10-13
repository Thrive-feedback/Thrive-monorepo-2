import type { Configuration } from '@app/config/configuration';
import type { Auth } from '@app/infrastructure/auth/auth';
import type { PrismaService } from '@app/infrastructure/database/prisma.service';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';

export interface SignedInAccount {
  readonly accountId: string;
  readonly email: string;
  /** The `cookie` header a browser holding this session would send. */
  readonly credential: string;
}

/**
 * Builds signed-in Accounts and Workspaces in the real database for the Invitation suites and
 * the `@api` scenarios, and removes everything it built.
 */
export class WorkspaceFixtures {
  private readonly accountIds: string[] = [];

  constructor(
    private readonly prismaService: PrismaService,
    private readonly auth: Auth,
    private readonly configuration: Configuration,
  ) {}

  async aSignedInAccount(label: string): Promise<SignedInAccount> {
    const accountId = uuidv7();
    const email = `${label}-${accountId}@acme.test`;
    // Verified, as Google marks every account it signs in; the plugin will not let an
    // unverified one accept an Invitation.
    await this.prismaService.user.create({
      data: { id: accountId, name: 'Ann Lee', email, emailVerified: true },
    });
    this.accountIds.push(accountId);
    const { internalAdapter } = await this.auth.$context;
    const session = await internalAdapter.createSession(accountId);
    const signature = await makeSignature(
      session.token,
      this.configuration.auth.secret,
    );
    return {
      accountId,
      email,
      credential: `thrive.session_token=${encodeURIComponent(`${session.token}.${signature}`)}`,
    };
  }

  /** A Workspace named `name`, founded by `owner` through the plugin. */
  async aWorkspace(owner: SignedInAccount, name = 'Acme'): Promise<string> {
    const workspace = await this.auth.api.createOrganization({
      body: { name, slug: uuidv7() },
      headers: new Headers({ cookie: owner.credential }),
    });
    return workspace.id;
  }

  /** Adds `account` to the Workspace with the plugin's role name (`admin`, `member`). */
  async addMember(
    workspaceId: string,
    account: SignedInAccount,
    role: 'admin' | 'member',
  ): Promise<void> {
    await this.prismaService.member.create({
      data: {
        id: uuidv7(),
        workspaceId,
        userId: account.accountId,
        role,
      },
    });
  }

  /**
   * An Invitation row written straight to the store, for the states the API cannot reach on
   * demand — expired, accepted, sent days ago. Pending, to a fresh address, sent now, unless
   * told otherwise. Removed with its Workspace.
   */
  async anInvitation(
    workspaceId: string,
    inviter: SignedInAccount,
    options: {
      readonly expiresAt: Date;
      readonly email?: string;
      readonly status?: 'pending' | 'accepted' | 'canceled' | 'rejected';
      readonly createdAt?: Date;
    },
  ): Promise<string> {
    const id = uuidv7();
    await this.prismaService.invitation.create({
      data: {
        id,
        workspaceId,
        email: options.email ?? `invitee-${id}@acme.test`,
        role: 'member',
        status: options.status ?? 'pending',
        createdAt: options.createdAt,
        expiresAt: options.expiresAt,
        inviterId: inviter.accountId,
      },
    });
    return id;
  }

  async removeAll(): Promise<void> {
    // Feedback names its Workspace and people by id only, with no foreign key to cascade
    // through, so its rows go first and by hand.
    await this.prismaService.feedbackRequest.deleteMany({
      where: { requesterAccountId: { in: this.accountIds } },
    });
    await this.prismaService.workspace.deleteMany({
      where: { members: { some: { userId: { in: this.accountIds } } } },
    });
    // Deleting the Better Auth user cascades to its sessions.
    await this.prismaService.user.deleteMany({
      where: { id: { in: this.accountIds } },
    });
  }
}
