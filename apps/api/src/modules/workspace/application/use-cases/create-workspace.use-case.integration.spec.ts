import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeHasProfilePort } from '@test/support/workspace.fakes';
import { makeSignature } from 'better-auth/crypto';
import { v7 as uuidv7 } from 'uuid';
import { BetterAuthWorkspaceFoundingAdapter } from '../../infrastructure/adapter/better-auth-workspace-founding.adapter';
import { AlreadyInAWorkspaceError } from '../workspace.errors';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const idGenerator = new UuidIdGenerator();
const hasProfilePort = new FakeHasProfilePort();
const auth = createAuth(prismaService, configuration.auth, idGenerator);
const createWorkspaceUseCase = new CreateWorkspaceUseCase(
  new BetterAuthWorkspaceFoundingAdapter(auth, idGenerator),
  hasProfilePort,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
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

describe('creating a Workspace from two tabs at once', () => {
  it('creates one Workspace and refuses the other', async () => {
    const { accountId, credential } = await aFounder();
    const request = {
      accountId,
      credential,
      name: 'Acme Corp',
      teamSize: null,
    };

    const results = await Promise.allSettled([
      createWorkspaceUseCase.execute(request),
      createWorkspaceUseCase.execute(request),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const refused = results.find((r) => r.status === 'rejected');
    expect(refused?.status === 'rejected' && refused.reason).toBeInstanceOf(
      AlreadyInAWorkspaceError,
    );
    expect(
      await prismaService.member.count({ where: { userId: accountId } }),
    ).toBe(1);
  });
});
