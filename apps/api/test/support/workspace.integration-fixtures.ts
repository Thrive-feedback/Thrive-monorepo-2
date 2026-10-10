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
 * Builds signed-in Accounts and Workspaces in the real database for the Invitation suites,
 * and removes everything it built.
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

  async removeAll(): Promise<void> {
    await this.prismaService.workspace.deleteMany({
      where: { members: { some: { userId: { in: this.accountIds } } } },
    });
    // Deleting the Better Auth user cascades to its sessions.
    await this.prismaService.user.deleteMany({
      where: { id: { in: this.accountIds } },
    });
  }
}
