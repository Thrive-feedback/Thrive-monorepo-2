import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import type { WorkspaceMembershipPort } from '../../domain/port/workspace-membership.port';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { WorkspaceMembershipAdapter } from './workspace-membership.adapter';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
// Typed as the port, so this proves what another module is promised, not the adapter's extras.
const workspaceMembershipPort: WorkspaceMembershipPort =
  new WorkspaceMembershipAdapter(
    new PrismaMembershipQuery(new PrismaTransactionContext(prismaService)),
  );
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

describe('telling another module who is a Member', () => {
  it('answers which of the Accounts named are Members, leaving out everyone else', async () => {
    const admin = await fixtures.aSignedInAccount('among-admin');
    const workspaceId = await fixtures.aWorkspace(admin);
    const member = await fixtures.aSignedInAccount('among-member');
    await fixtures.addMember(workspaceId, member, 'member');
    const outsider = await fixtures.aSignedInAccount('among-outsider');
    await fixtures.aWorkspace(outsider, 'Globex');

    const members = await workspaceMembershipPort.membersAmong({
      workspaceId,
      accountIds: [admin.accountId, member.accountId, outsider.accountId],
    });

    expect([...members].sort()).toEqual(
      [admin.accountId, member.accountId].sort(),
    );
  });

  it('answers nobody when nobody is named', async () => {
    const admin = await fixtures.aSignedInAccount('among-alone');
    const workspaceId = await fixtures.aWorkspace(admin);

    expect(
      await workspaceMembershipPort.membersAmong({
        workspaceId,
        accountIds: [],
      }),
    ).toEqual([]);
  });
});
