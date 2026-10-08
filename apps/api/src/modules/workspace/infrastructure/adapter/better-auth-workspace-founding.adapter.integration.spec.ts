import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import { AlreadyInAWorkspaceError } from '../../application/workspace.errors';
import { PrismaMembershipQuery } from '../query/prisma-membership.query';
import { BetterAuthWorkspaceFoundingAdapter } from './better-auth-workspace-founding.adapter';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const idGenerator = new UuidIdGenerator();
const auth = createAuth(prismaService, configuration.auth, idGenerator);
const workspaceFounding = new BetterAuthWorkspaceFoundingAdapter(
  auth,
  idGenerator,
);
const membershipQuery = new PrismaMembershipQuery(
  new PrismaTransactionContext(prismaService),
);

const createdAccountIds: string[] = [];

/** The `cookie` header a browser holding this session would send. */
async function cookieFor(token: string): Promise<string> {
  const signature = await makeSignature(token, configuration.auth.secret);
  return `thrive.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

/** A signed-in Account: its id, its session's id, and the `cookie` header it sends. */
async function aSignedInAccount(): Promise<{
  accountId: string;
  sessionId: string;
  credential: string;
}> {
  const accountId = uuidv7();
  await prismaService.user.create({
    data: {
      id: accountId,
      name: 'Ann Lee',
      email: `founding-${accountId}@acme.test`,
    },
  });
  createdAccountIds.push(accountId);
  const { internalAdapter } = await auth.$context;
  const session = await internalAdapter.createSession(accountId);
  return {
    accountId,
    sessionId: session.id,
    credential: await cookieFor(session.token),
  };
}

afterAll(async () => {
  await prismaService.workspace.deleteMany({
    where: { members: { some: { userId: { in: createdAccountIds } } } },
  });
  // Deleting the Better Auth user cascades to its sessions.
  await prismaService.user.deleteMany({
    where: { id: { in: createdAccountIds } },
  });
  await prismaService.$disconnect();
});

describe('founding a Workspace through the organization plugin', () => {
  it('stores the Workspace with its team size, and the founder as its owner', async () => {
    const { accountId, credential } = await aSignedInAccount();

    const { workspaceId } = await workspaceFounding.found({
      credential,
      name: 'Acme Corp',
      teamSize: 'FROM_2_TO_10',
    });

    expect(
      await prismaService.workspace.findUnique({ where: { id: workspaceId } }),
    ).toMatchObject({ name: 'Acme Corp', teamSize: 'FROM_2_TO_10' });
    expect(
      await prismaService.member.findMany({
        where: { workspaceId },
        select: { userId: true, role: true },
      }),
    ).toEqual([{ userId: accountId, role: 'owner' }]);
  });

  it("makes it the founder's active Workspace", async () => {
    const { sessionId, credential } = await aSignedInAccount();

    const { workspaceId } = await workspaceFounding.found({
      credential,
      name: 'Acme Corp',
      teamSize: null,
    });

    expect(
      await prismaService.session.findUnique({
        where: { id: sessionId },
        select: { activeOrganizationId: true },
      }),
    ).toEqual({ activeOrganizationId: workspaceId });
  });

  it('is read back as an OWNER membership', async () => {
    const { accountId, credential } = await aSignedInAccount();
    const { workspaceId } = await workspaceFounding.found({
      credential,
      name: 'Acme Corp',
      teamSize: null,
    });

    expect(
      await membershipQuery.membershipsOfAccount(accountId, {
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({
      items: [
        { workspace: { id: workspaceId, name: 'Acme Corp' }, role: 'OWNER' },
      ],
      total: 1,
    });
  });

  it('refuses a second Workspace to the same founder', async () => {
    const { accountId, credential } = await aSignedInAccount();
    await workspaceFounding.found({
      credential,
      name: 'Acme Corp',
      teamSize: null,
    });

    await expect(
      workspaceFounding.found({ credential, name: 'Beta Ltd', teamSize: null }),
    ).rejects.toThrow(AlreadyInAWorkspaceError);
    expect(
      await prismaService.member.count({ where: { userId: accountId } }),
    ).toBe(1);
  });

  it('refuses a caller with no session', async () => {
    await expect(
      workspaceFounding.found({
        credential: '',
        name: 'Acme Corp',
        teamSize: null,
      }),
    ).rejects.toMatchObject({ status: 'UNAUTHORIZED' });
  });
});
