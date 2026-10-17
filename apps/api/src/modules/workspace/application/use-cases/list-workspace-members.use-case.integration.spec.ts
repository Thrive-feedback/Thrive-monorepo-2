import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { FakeAccountSummaryPort } from '@test/support/workspace.fakes';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { PrismaMembershipQuery } from '../../infrastructure/query/prisma-membership.query';
import { ListWorkspaceMembersUseCase } from './list-workspace-members.use-case';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
// Identity answers through its published port, whose own contract test is in Identity; here
// the Workspace's stored Members are what is real.
const accountSummaryPort = new FakeAccountSummaryPort();
const listWorkspaceMembersUseCase = new ListWorkspaceMembersUseCase(
  new PrismaMembershipQuery(new PrismaTransactionContext(prismaService)),
  accountSummaryPort,
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

describe('listing the Members of a Workspace', () => {
  it('names each by email and Profile name, the founding Admin first, and no one from elsewhere', async () => {
    const admin = await fixtures.aSignedInAccount('members-admin');
    const workspaceId = await fixtures.aWorkspace(admin);
    const member = await fixtures.aSignedInAccount('members-member');
    await fixtures.addMember(workspaceId, member, 'member');
    const outsider = await fixtures.aSignedInAccount('members-outsider');
    await fixtures.aWorkspace(outsider, 'Globex');
    accountSummaryPort.summaries.push(
      {
        accountId: admin.accountId,
        email: admin.email,
        fullName: 'Ann Lee',
        displayName: 'Ann',
        photoUrl: null,
      },
      {
        accountId: member.accountId,
        email: member.email,
        fullName: null,
        displayName: null,
        photoUrl: null,
      },
      {
        accountId: outsider.accountId,
        email: outsider.email,
        fullName: 'Cat',
        displayName: 'Cat',
        photoUrl: null,
      },
    );

    const members = await listWorkspaceMembersUseCase.execute({
      membership: {
        workspace: { id: workspaceId, name: 'Acme' },
        role: 'MEMBER',
      },
      page: { page: 1, pageSize: 20 },
    });

    expect(members).toEqual({
      items: [
        {
          accountId: admin.accountId,
          email: admin.email,
          fullName: 'Ann Lee',
          displayName: 'Ann',
          photoUrl: null,
          role: 'ADMIN',
        },
        {
          accountId: member.accountId,
          email: member.email,
          fullName: null,
          displayName: null,
          photoUrl: null,
          role: 'MEMBER',
        },
      ],
      total: 2,
    });
  });
});
