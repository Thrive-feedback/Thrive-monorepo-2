import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import type { ConnectionToStore } from '../../domain/repository/connection-repository.port';
import { PrismaConnectionQuery } from '../query/prisma-connection.query';
import { PrismaConnectionRepository } from './prisma-connection.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const transactionContext = new PrismaTransactionContext(prismaService);
const connectionRepository = new PrismaConnectionRepository(transactionContext);
const connectionQuery = new PrismaConnectionQuery(transactionContext);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
const idGenerator = new UuidIdGenerator();
const PAGE = { page: 1, pageSize: 20 };

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

function aConnection(
  overrides: Partial<ConnectionToStore> & {
    workspaceId: string;
    connectedByAccountId: string;
  },
): ConnectionToStore {
  return {
    id: idGenerator.next(),
    provider: 'DISCORD',
    externalWorkspaceId: 'guild-acme',
    externalWorkspaceName: 'Acme HQ',
    externalChannelId: 'channel-general',
    externalChannelName: 'general',
    ...overrides,
  };
}

async function aWorkspaceWithAnAdmin(name: string) {
  const admin = await fixtures.aSignedInAccount(name);
  const workspaceId = await fixtures.aWorkspace(admin);
  return { workspaceId, accountId: admin.accountId };
}

describe('storing a Workspace’s Connection', () => {
  it('reads back the server and channel it was given, with who connected it', async () => {
    const { workspaceId, accountId } =
      await aWorkspaceWithAnAdmin('connection-first');

    await connectionRepository.save(
      aConnection({ workspaceId, connectedByAccountId: accountId }),
    );

    const { items, total } = await connectionQuery.connectionsOfWorkspace(
      workspaceId,
      PAGE,
    );
    expect(total).toBe(1);
    expect(items[0]).toMatchObject({
      provider: 'DISCORD',
      externalWorkspaceName: 'Acme HQ',
      externalChannelName: 'general',
      connectedByAccountId: accountId,
    });
  });

  it('replaces the Connection in place when the Workspace connects again, keeping one row', async () => {
    const { workspaceId, accountId } =
      await aWorkspaceWithAnAdmin('connection-again');
    const first = aConnection({
      workspaceId,
      connectedByAccountId: accountId,
    });
    await connectionRepository.save(first);

    await connectionRepository.save(
      aConnection({
        workspaceId,
        connectedByAccountId: accountId,
        externalWorkspaceId: 'guild-acme-two',
        externalWorkspaceName: 'Acme Second Server',
        externalChannelId: 'channel-standups',
        externalChannelName: 'standups',
      }),
    );

    const { items, total } = await connectionQuery.connectionsOfWorkspace(
      workspaceId,
      PAGE,
    );
    expect(total).toBe(1);
    expect(items[0]).toMatchObject({
      externalWorkspaceName: 'Acme Second Server',
      externalChannelName: 'standups',
    });
    // The row the Workspace had is the row it still has, so a reconnection invalidates nothing
    // that may later name a Connection.
    const stored = await prismaService.integrationConnection.findFirst({
      where: { workspaceId },
      select: { id: true },
    });
    expect(stored?.id).toBe(first.id);
  });

  it('keeps one Workspace’s Connection out of another’s', async () => {
    const acme = await aWorkspaceWithAnAdmin('connection-acme');
    const globex = await aWorkspaceWithAnAdmin('connection-globex');

    await connectionRepository.save(
      aConnection({
        workspaceId: acme.workspaceId,
        connectedByAccountId: acme.accountId,
        externalChannelName: 'acme-general',
      }),
    );
    await connectionRepository.save(
      aConnection({
        workspaceId: globex.workspaceId,
        connectedByAccountId: globex.accountId,
        externalChannelName: 'globex-general',
      }),
    );

    const theirs = await connectionQuery.connectionsOfWorkspace(
      globex.workspaceId,
      PAGE,
    );
    expect(theirs.items).toHaveLength(1);
    expect(theirs.items[0]?.externalChannelName).toBe('globex-general');
  });

  it('refuses a second row for the same Workspace and tool, whatever the application does', async () => {
    const { workspaceId, accountId } =
      await aWorkspaceWithAnAdmin('connection-unique');
    await connectionRepository.save(
      aConnection({ workspaceId, connectedByAccountId: accountId }),
    );

    // Written past the repository on purpose: the index is what holds when two requests race,
    // which no check in the application can do on its own.
    await expect(
      (async () =>
        prismaService.integrationConnection.create({
          data: {
            id: idGenerator.next(),
            workspaceId,
            provider: 'DISCORD',
            externalWorkspaceId: 'guild-someone-else',
            externalWorkspaceName: 'Someone else',
            externalChannelId: 'channel-theirs',
            externalChannelName: 'theirs',
            connectedByAccountId: accountId,
          },
        }))(),
    ).rejects.toThrow();
  });

  it('leaves room for a second chat tool in the same Workspace, without a migration', async () => {
    const { workspaceId, accountId } = await aWorkspaceWithAnAdmin(
      'connection-two-tools',
    );
    await connectionRepository.save(
      aConnection({ workspaceId, connectedByAccountId: accountId }),
    );

    // Written directly, because `SLACK` is not a provider this release connects to yet. It is
    // the index's shape that is under test — `(workspaceId, provider)`, not `workspaceId`.
    await prismaService.integrationConnection.create({
      data: {
        id: idGenerator.next(),
        workspaceId,
        provider: 'SLACK',
        externalWorkspaceId: 'team-acme',
        externalWorkspaceName: 'Acme',
        externalChannelId: 'channel-slack',
        externalChannelName: 'general',
        connectedByAccountId: accountId,
      },
    });

    expect(
      await prismaService.integrationConnection.count({
        where: { workspaceId },
      }),
    ).toBe(2);
  });
});
