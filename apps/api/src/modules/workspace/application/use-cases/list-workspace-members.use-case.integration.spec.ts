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
  it('names each by email and Profile name, the founding Owner first, and no one from elsewhere', async () => {
    const owner = await fixtures.aSignedInAccount('members-owner');
    const workspaceId = await fixtures.aWorkspace(owner);
    const member = await fixtures.aSignedInAccount('members-member');
    await fixtures.addMember(workspaceId, member, 'member');
    const outsider = await fixtures.aSignedInAccount('members-outsider');
    await fixtures.aWorkspace(outsider, 'Globex');
    accountSummaryPort.summaries.push(
      { accountId: owner.accountId, email: owner.email, fullName: 'Ann Lee' },
      { accountId: member.accountId, email: member.email, fullName: null },
      { accountId: outsider.accountId, email: outsider.email, fullName: 'Cat' },
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
          accountId: owner.accountId,
          email: owner.email,
          fullName: 'Ann Lee',
          role: 'OWNER',
        },
        {
          accountId: member.accountId,
          email: member.email,
          fullName: null,
          role: 'MEMBER',
        },
      ],
      total: 2,
    });
  });
});
