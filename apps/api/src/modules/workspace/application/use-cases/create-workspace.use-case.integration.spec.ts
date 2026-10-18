import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { SystemClock } from '@app/infrastructure/system-clock.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeHasProfilePort } from '@test/support/workspace.fakes';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import { BetterAuthSessionWorkspaceAdapter } from '../../infrastructure/adapter/better-auth-session-workspace.adapter';
import { BetterAuthWorkspaceFoundingAdapter } from '../../infrastructure/adapter/better-auth-workspace-founding.adapter';
import { PrismaWorkspaceSwitchingAdapter } from '../../infrastructure/adapter/prisma-workspace-switching.adapter';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const idGenerator = new UuidIdGenerator();
const hasProfilePort = new FakeHasProfilePort();
const auth = createAuth(prismaService, configuration.auth, idGenerator);
const createWorkspaceUseCase = new CreateWorkspaceUseCase(
  new BetterAuthWorkspaceFoundingAdapter(auth, idGenerator),
  new PrismaWorkspaceSwitchingAdapter(prismaTransactionContext),
  new BetterAuthSessionWorkspaceAdapter(auth),
  hasProfilePort,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  new SystemClock(),
);

const founders: string[] = [];

/** The `cookie` header a browser holding this session would send. */
async function cookieFor(token: string): Promise<string> {
  const signature = await makeSignature(token, configuration.auth.secret);
  return `thrive.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

/** A signed-in founder who has introduced themselves. */
async function aFounder(): Promise<{ accountId: string; credential: string }> {
  const accountId = uuidv7();
  await prismaService.user.create({
    data: {
      id: accountId,
      name: 'Ann Lee',
      email: `create-workspace-${accountId}@acme.test`,
    },
  });
  founders.push(accountId);
  hasProfilePort.introduced.add(accountId);
  const { internalAdapter } = await auth.$context;
  const session = await internalAdapter.createSession(accountId);
  return { accountId, credential: await cookieFor(session.token) };
}

afterAll(async () => {
  await prismaService.workspace.deleteMany({
    where: { members: { some: { userId: { in: founders } } } },
  });
  await prismaService.user.deleteMany({ where: { id: { in: founders } } });
  await prismaService.$disconnect();
});

describe('creating Workspaces in Postgres', () => {
  it('makes one Workspace for each of two tabs creating at once', async () => {
    const { accountId, credential } = await aFounder();
    const request = {
      accountId,
      credential,
      name: 'Acme Corp',
      teamSize: null,
    };

    await Promise.all([
      createWorkspaceUseCase.execute(request),
      createWorkspaceUseCase.execute(request),
    ]);

    expect(
      await prismaService.member.count({
        where: { userId: accountId, role: 'admin' },
      }),
    ).toBe(2);
  });

  it("puts the founder's session in the new Workspace, and lists it first", async () => {
    const { accountId, credential } = await aFounder();
    const request = { accountId, credential, teamSize: null };
    await createWorkspaceUseCase.execute({ ...request, name: 'First' });

    const second = await createWorkspaceUseCase.execute({
      ...request,
      name: 'Second',
    });

    const current = await new PrismaMembershipQuery(
      prismaTransactionContext,
    ).membershipsOfAccount(accountId, { page: 1, pageSize: 1 }, 'ACTIVE');
    expect(current.items.map((m) => m.workspace.id)).toEqual([second.id]);
    expect(
      await new BetterAuthSessionWorkspaceAdapter(auth).selectedIn(credential),
    ).toBe(second.id);
  });
});
