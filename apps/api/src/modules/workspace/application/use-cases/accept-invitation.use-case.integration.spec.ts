import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeClock } from '@test/support/clock.fake';
import {
  type SignedInAccount,
  WorkspaceFixtures,
} from '@test/support/workspace.integration-fixtures';
import { BetterAuthSessionWorkspaceAdapter } from '../../infrastructure/adapter/better-auth-session-workspace.adapter';
import { BetterAuthWorkspaceInvitingAdapter } from '../../infrastructure/adapter/better-auth-workspace-inviting.adapter';
import { PrismaInvitationSettlingAdapter } from '../../infrastructure/adapter/prisma-invitation-settling.adapter';
import { PrismaMemberRejoiningAdapter } from '../../infrastructure/adapter/prisma-member-rejoining.adapter';
import { PrismaWorkspaceSwitchingAdapter } from '../../infrastructure/adapter/prisma-workspace-switching.adapter';
import { PrismaInvitationQuery } from '../../infrastructure/query/prisma-invitation.query';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const clock = new FakeClock(new Date());
const workspaceInviting = new BetterAuthWorkspaceInvitingAdapter(auth, clock);
const acceptInvitationUseCase = new AcceptInvitationUseCase(
  workspaceInviting,
  new PrismaMemberRejoiningAdapter(prismaTransactionContext),
  new PrismaInvitationSettlingAdapter(prismaTransactionContext),
  new PrismaWorkspaceSwitchingAdapter(prismaTransactionContext),
  new BetterAuthSessionWorkspaceAdapter(auth),
  new PrismaInvitationQuery(prismaTransactionContext),
  new PrismaMembershipQuery(prismaTransactionContext),
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  clock,
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

interface Invited {
  readonly workspaceId: string;
  readonly invitationId: string;
}

/** An Invitation for `invitee` into `workspaceId`, sent by its Admin. */
async function anInvitationInto(
  workspaceId: string,
  admin: SignedInAccount,
  invitee: SignedInAccount,
): Promise<string> {
  const stored = await workspaceInviting.invite({
    credential: admin.credential,
    inviterAccountId: admin.accountId,
    workspaceId,
    email: invitee.email,
    role: 'MEMBER',
  });
  if (stored.outcome !== 'invited') {
    throw new Error(`Expected an Invitation, got ${stored.outcome}.`);
  }
  return stored.invitationId;
}

/** A fresh Workspace whose Admin has invited `invitee`. */
async function anInvitationFor(invitee: SignedInAccount): Promise<Invited> {
  const admin = await fixtures.aSignedInAccount('accept-admin');
  const workspaceId = await fixtures.aWorkspace(admin);
  return {
    workspaceId,
    invitationId: await anInvitationInto(workspaceId, admin, invitee),
  };
}

function acceptanceBy(invitee: SignedInAccount, invitationId: string) {
  return {
    accountId: invitee.accountId,
    accountEmail: invitee.email,
    credential: invitee.credential,
    invitationId,
  };
}

describe('accepting an Invitation in Postgres', () => {
  it('changes nothing when the same person accepts again, from a reload or a second click', async () => {
    const invitee = await fixtures.aSignedInAccount('accept-twice');
    const { invitationId } = await anInvitationFor(invitee);
    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    expect(
      await prismaService.member.count({
        where: { userId: invitee.accountId },
      }),
    ).toBe(1);
  });

  it('lets one person into two Workspaces whose Invitations they accept at once', async () => {
    const invitee = await fixtures.aSignedInAccount('accept-two');
    const first = await anInvitationFor(invitee);
    const second = await anInvitationFor(invitee);

    await Promise.all([
      acceptInvitationUseCase.execute(
        acceptanceBy(invitee, first.invitationId),
      ),
      acceptInvitationUseCase.execute(
        acceptanceBy(invitee, second.invitationId),
      ),
    ]);

    expect(
      await prismaService.member.count({
        where: { userId: invitee.accountId, deactivatedAt: null },
      }),
    ).toBe(2);
  });

  it("puts the person's session in the Workspace joined, and lists it first", async () => {
    const invitee = await fixtures.aSignedInAccount('accept-current');
    const home = await fixtures.aWorkspace(invitee, 'Home');
    const { workspaceId, invitationId } = await anInvitationFor(invitee);

    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    const current = await new PrismaMembershipQuery(
      prismaTransactionContext,
    ).membershipsOfAccount(
      invitee.accountId,
      { page: 1, pageSize: 2 },
      'ACTIVE',
    );
    expect(current.items.map((m) => m.workspace.id)).toEqual([
      workspaceId,
      home,
    ]);
    expect(
      await new BetterAuthSessionWorkspaceAdapter(auth).selectedIn(
        invitee.credential,
      ),
    ).toBe(workspaceId);
  });

  it('brings back someone Deactivated there, once, with the Role the Invitation names', async () => {
    const admin = await fixtures.aSignedInAccount('rejoin-admin');
    const invitee = await fixtures.aSignedInAccount('rejoin-invitee');
    const workspaceId = await fixtures.aWorkspace(admin);
    await fixtures.addMember(workspaceId, invitee, 'member');
    await prismaService.member.updateMany({
      where: { workspaceId, userId: invitee.accountId },
      data: { deactivatedAt: new Date() },
    });
    const stored = await workspaceInviting.inviteBack({
      credential: admin.credential,
      inviterAccountId: admin.accountId,
      workspaceId,
      email: invitee.email,
      role: 'ADMIN',
    });
    if (stored.outcome !== 'invited') {
      throw new Error(`Expected an Invitation, got ${stored.outcome}.`);
    }
    const { invitationId } = stored;

    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    expect(
      await prismaService.member.findMany({
        where: { workspaceId, userId: invitee.accountId },
        select: { role: true, deactivatedAt: true },
      }),
    ).toEqual([{ role: 'admin', deactivatedAt: null }]);
    expect(
      await prismaService.invitation.findUniqueOrThrow({
        where: { id: invitationId },
        select: { status: true },
      }),
    ).toEqual({ status: 'accepted' });
  });
});
