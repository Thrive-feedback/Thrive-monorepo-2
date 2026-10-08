import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { aWorkspaceSnapshot } from '@test/support/workspace.fakes';
import { v7 as uuidv7 } from 'uuid';
import type { MembershipQuery } from '../../application/query-port/membership.query-port';
import { Workspace } from '../../domain/entity/workspace.entity';
import type { WorkspaceRepository } from '../../domain/repository/workspace-repository.port';
import { PrismaMembershipQuery } from '../query/prisma-membership.query';
import { PrismaWorkspaceRepository } from './prisma-workspace.repository';

const prismaService = new PrismaService(loadConfiguration().database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const workspaceRepository: WorkspaceRepository = new PrismaWorkspaceRepository(
  prismaTransactionContext,
);
const membershipQuery: MembershipQuery = new PrismaMembershipQuery(
  prismaTransactionContext,
);

const createdWorkspaceIds: string[] = [];

/** A Workspace whose ids nobody else in the run can hold, owned by `accountId`. */
function aWorkspaceOwnedBy(accountId: string, name = 'Acme Corp'): Workspace {
  const id = uuidv7();
  createdWorkspaceIds.push(id);
  return Workspace.restore(
    aWorkspaceSnapshot({
      id,
      name,
      members: [{ id: uuidv7(), accountId, role: 'OWNER' }],
    }),
  );
}

afterAll(async () => {
  // Its Members go with it.
  await prismaService.workspace.deleteMany({
    where: { id: { in: createdWorkspaceIds } },
  });
  await prismaService.$disconnect();
});

describe('Workspaces in Postgres, through the repository', () => {
  it('gives back what was saved, Members included', async () => {
    const workspace = aWorkspaceOwnedBy(uuidv7());

    await workspaceRepository.save(workspace);

    expect(
      (await workspaceRepository.findById(workspace.snapshot().id))?.snapshot(),
    ).toEqual(workspace.snapshot());
  });

  it('gives back a Workspace saved without a team size', async () => {
    const workspace = Workspace.restore({
      ...aWorkspaceOwnedBy(uuidv7()).snapshot(),
      teamSize: null,
    });

    await workspaceRepository.save(workspace);

    expect(
      (await workspaceRepository.findById(workspace.snapshot().id))?.snapshot()
        .teamSize,
    ).toBeNull();
  });

  it('finds the Workspace an Account is a Member of', async () => {
    const accountId = uuidv7();
    const workspace = aWorkspaceOwnedBy(accountId);
    await workspaceRepository.save(workspace);

    expect(
      (await workspaceRepository.findByMemberAccount(accountId))?.snapshot(),
    ).toEqual(workspace.snapshot());
  });

  it('finds nothing for an Account in no Workspace', async () => {
    expect(await workspaceRepository.findByMemberAccount(uuidv7())).toBeNull();
  });
});

describe("an Account's memberships in Postgres, through the query", () => {
  it('lists each Workspace with the Role held in it', async () => {
    const accountId = uuidv7();
    const workspace = aWorkspaceOwnedBy(accountId, 'Dream Team');
    await workspaceRepository.save(workspace);

    expect(
      await membershipQuery.membershipsOfAccount(accountId, {
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({
      items: [
        {
          workspace: { id: workspace.snapshot().id, name: 'Dream Team' },
          role: 'OWNER',
        },
      ],
      total: 1,
    });
  });

  it('pages them, counting every one', async () => {
    // Several Workspaces for one Account cannot be created through the use case today;
    // the store allows it, so the page shape is ready for when the rule is lifted.
    const accountId = uuidv7();
    for (const name of ['First', 'Second', 'Third']) {
      await workspaceRepository.save(aWorkspaceOwnedBy(accountId, name));
    }

    const page = await membershipQuery.membershipsOfAccount(accountId, {
      page: 2,
      pageSize: 2,
    });

    expect(page.total).toBe(3);
    expect(page.items.map((item) => item.workspace.name)).toEqual(['Third']);
  });

  it('is empty for an Account in no Workspace', async () => {
    expect(
      await membershipQuery.membershipsOfAccount(uuidv7(), {
        page: 1,
        pageSize: 20,
      }),
    ).toEqual({ items: [], total: 0 });
  });
});
