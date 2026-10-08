import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { PrismaUnitOfWork } from '@app/infrastructure/database/prisma-unit-of-work.adapter';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeHasProfilePort } from '@test/support/workspace.fakes';
import { v7 as uuidv7 } from 'uuid';
import { PrismaWorkspaceRepository } from '../../infrastructure/repository/prisma-workspace.repository';
import { AlreadyInAWorkspaceError } from '../workspace.errors';
import { CreateWorkspaceUseCase } from './create-workspace.use-case';

const prismaService = new PrismaService(loadConfiguration().database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const hasProfilePort = new FakeHasProfilePort();
const createWorkspaceUseCase = new CreateWorkspaceUseCase(
  new PrismaWorkspaceRepository(prismaTransactionContext),
  hasProfilePort,
  new PrismaUnitOfWork(prismaService, prismaTransactionContext),
  new UuidIdGenerator(),
);

const founders: string[] = [];

afterAll(async () => {
  await prismaService.workspace.deleteMany({
    where: { members: { some: { userId: { in: founders } } } },
  });
  await prismaService.$disconnect();
});

describe('creating a Workspace from two tabs at once', () => {
  it('creates one Workspace and refuses the other', async () => {
    const accountId = uuidv7();
    founders.push(accountId);
    hasProfilePort.introduced.add(accountId);
    const request = { accountId, name: 'Acme Corp', teamSize: null };

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
