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
import { BetterAuthWorkspaceInvitingAdapter } from '../../infrastructure/adapter/better-auth-workspace-inviting.adapter';
import { PrismaInvitationQuery } from '../../infrastructure/query/prisma-invitation.query';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { AlreadyInAWorkspaceError } from '../workspace.errors';
import { AcceptInvitationUseCase } from './accept-invitation.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const workspaceInviting = new BetterAuthWorkspaceInvitingAdapter(auth);
const acceptInvitationUseCase = new AcceptInvitationUseCase(
  workspaceInviting,
  new PrismaInvitationQuery(prismaTransactionContext),
  new PrismaMembershipQuery(prismaTransactionContext),
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  new FakeClock(new Date()),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

/** A fresh Workspace whose Owner has invited `invitee`; answers the Invitation's id. */
async function anInvitationFor(invitee: SignedInAccount): Promise<string> {
  const owner = await fixtures.aSignedInAccount('accept-owner');
  const workspaceId = await fixtures.aWorkspace(owner);
  const stored = await workspaceInviting.invite({
    credential: owner.credential,
    workspaceId,
    email: invitee.email,
  });
  if (stored.outcome !== 'invited') {
    throw new Error(`Expected an Invitation, got ${stored.outcome}.`);
  }
  return stored.invitationId;
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
    const invitationId = await anInvitationFor(invitee);
    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    await acceptInvitationUseCase.execute(acceptanceBy(invitee, invitationId));

    expect(
      await prismaService.member.count({
        where: { userId: invitee.accountId },
      }),
    ).toBe(1);
  });

  it('lets one of two Invitations accepted at once in, and refuses the other', async () => {
    const invitee = await fixtures.aSignedInAccount('accept-race');
    const first = await anInvitationFor(invitee);
    const second = await anInvitationFor(invitee);

    const results = await Promise.allSettled([
      acceptInvitationUseCase.execute(acceptanceBy(invitee, first)),
      acceptInvitationUseCase.execute(acceptanceBy(invitee, second)),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const refused = results.find((r) => r.status === 'rejected');
    expect(refused?.status === 'rejected' && refused.reason).toBeInstanceOf(
      AlreadyInAWorkspaceError,
    );
    expect(
      await prismaService.member.count({
        where: { userId: invitee.accountId },
      }),
    ).toBe(1);
  });
});
