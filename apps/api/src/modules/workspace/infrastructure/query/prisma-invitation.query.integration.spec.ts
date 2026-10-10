import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { v7 as uuidv7 } from 'uuid';
import { PrismaInvitationQuery } from './prisma-invitation.query';

const DAY_MS = 24 * 60 * 60 * 1000;

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const invitationQuery = new PrismaInvitationQuery(
  new PrismaTransactionContext(prismaService),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

describe('reading the open Invitations of a Workspace', () => {
  it('answers pending ones and expired ones, and leaves out revoked and accepted ones', async () => {
    const owner = await fixtures.aSignedInAccount('invitation-query');
    const workspaceId = await fixtures.aWorkspace(owner);
    const now = new Date();
    const anInvitation = (email: string, status: string, expiresInMs: number) =>
      prismaService.invitation.create({
        data: {
          id: uuidv7(),
          workspaceId,
          email,
          role: 'member',
          status,
          expiresAt: new Date(now.getTime() + expiresInMs),
          inviterId: owner.accountId,
        },
      });
    await anInvitation('pending@acme.test', 'pending', 7 * DAY_MS);
    await anInvitation('expired@acme.test', 'pending', -DAY_MS);
    await anInvitation('canceled@acme.test', 'canceled', 7 * DAY_MS);
    await anInvitation('accepted@acme.test', 'accepted', 7 * DAY_MS);

    const page = await invitationQuery.openInvitationsOfWorkspace(
      workspaceId,
      now,
      { page: 1, pageSize: 20 },
    );

    expect(page.total).toBe(2);
    expect(page.items.map((i) => [i.email, i.status, i.role]).sort()).toEqual([
      ['expired@acme.test', 'EXPIRED', 'MEMBER'],
      ['pending@acme.test', 'PENDING', 'MEMBER'],
    ]);
  });
});
