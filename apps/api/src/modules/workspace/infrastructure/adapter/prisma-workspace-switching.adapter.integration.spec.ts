import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { createAuth } from '@app/infrastructure/auth/auth';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { UuidIdGenerator } from '@app/infrastructure/uuid-id-generator.adapter';
import { WorkspaceFixtures } from '@test/support/workspace.integration-fixtures';
import { PrismaWorkspaceSwitchingAdapter } from './prisma-workspace-switching.adapter';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const auth = createAuth(
  prismaService,
  configuration.auth,
  new UuidIdGenerator(),
);
const workspaceSwitching = new PrismaWorkspaceSwitchingAdapter(
  new PrismaTransactionContext(prismaService),
);
const fixtures = new WorkspaceFixtures(prismaService, auth, configuration);
const SWITCHED_AT = new Date('2026-10-18T03:00:00Z');

afterAll(async () => {
  await fixtures.removeAll();
  await prismaService.$disconnect();
});

async function lastUsedAtOf(workspaceId: string, accountId: string) {
  const member = await prismaService.member.findUniqueOrThrow({
    where: { workspaceId_userId: { workspaceId, userId: accountId } },
    select: { lastUsedAt: true },
  });
  return member.lastUsedAt;
}

describe('switching Workspace in Postgres', () => {
  it('stamps when an active Member switched to the Workspace', async () => {
    const ann = await fixtures.aSignedInAccount('switching-ann');
    const workspaceId = await fixtures.aWorkspace(ann);

    await workspaceSwitching.switchTo({
      workspaceId,
      accountId: ann.accountId,
      switchedAt: SWITCHED_AT,
    });

    expect(await lastUsedAtOf(workspaceId, ann.accountId)).toEqual(SWITCHED_AT);
  });

  it('leaves the row of someone Deactivated there untouched', async () => {
    const ann = await fixtures.aSignedInAccount('switching-admin');
    const ben = await fixtures.aSignedInAccount('switching-ben');
    const workspaceId = await fixtures.aWorkspace(ann);
    await fixtures.addMember(workspaceId, ben, 'member');
    await prismaService.member.updateMany({
      where: { workspaceId, userId: ben.accountId },
      data: { deactivatedAt: new Date() },
    });

    await workspaceSwitching.switchTo({
      workspaceId,
      accountId: ben.accountId,
      switchedAt: SWITCHED_AT,
    });

    expect(await lastUsedAtOf(workspaceId, ben.accountId)).toBeNull();
  });
});
