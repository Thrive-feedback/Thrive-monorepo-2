import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { PrismaService } from '@app/infrastructure/database/prisma.service';
import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { v7 as uuidv7 } from 'uuid';
import { WorkspaceGoal } from '../../domain/entity/workspace-goal.entity';
import { WorkspaceGoalDescription } from '../../domain/value-object/workspace-goal-description.vo';
import { WorkspaceGoalName } from '../../domain/value-object/workspace-goal-name.vo';
import { WorkspaceGoalNameTakenError } from '../../domain/workspace-goal.errors';
import { PrismaWorkspaceGoalQuery } from '../query/prisma-workspace-goal.query';
import { PrismaWorkspaceGoalRepository } from './prisma-workspace-goal.repository';

const configuration = loadConfiguration();
const prismaService = new PrismaService(configuration.database);
const context = new PrismaTransactionContext(prismaService);
const repository = new PrismaWorkspaceGoalRepository(context);
const query = new PrismaWorkspaceGoalQuery(context);
const ONE_PAGE = { page: 1, pageSize: 20 };

const workspaces: string[] = [];

/**
 * A fresh Workspace id with no Workspace behind it: the table holds it without a foreign key,
 * which is the boundary this suite also proves.
 */
function aWorkspaceId(): string {
  const workspaceId = uuidv7();
  workspaces.push(workspaceId);
  return workspaceId;
}

function aWorkspaceGoal(
  workspaceId: string,
  name: string,
  description: string | null = null,
): WorkspaceGoal {
  return WorkspaceGoal.create({
    id: uuidv7(),
    workspaceId,
    name: WorkspaceGoalName.of(name),
    description:
      description === null ? null : WorkspaceGoalDescription.of(description),
  });
}

afterAll(async () => {
  await prismaService.workspaceGoal.deleteMany({
    where: { workspaceId: { in: workspaces } },
  });
  await prismaService.$disconnect();
});

describe('storing Workspace Goals', () => {
  it('reads back what was saved, and what it became once hidden', async () => {
    const workspaceId = aWorkspaceId();
    const workspaceGoal = aWorkspaceGoal(
      workspaceId,
      'Ownership',
      'We finish what we start.',
    );
    await repository.save(workspaceGoal);
    workspaceGoal.hide();
    await repository.save(workspaceGoal);

    const found = await repository.findById(
      workspaceId,
      workspaceGoal.snapshot().id,
    );

    expect(found?.snapshot()).toEqual(workspaceGoal.snapshot());
  });

  it("does not find one by another Workspace's id", async () => {
    const workspaceGoal = aWorkspaceGoal(aWorkspaceId(), 'ownership');
    await repository.save(workspaceGoal);

    expect(
      await repository.findById(aWorkspaceId(), workspaceGoal.snapshot().id),
    ).toBeNull();
  });

  it('knows a name is taken in any letter case, in that Workspace only', async () => {
    const workspaceId = aWorkspaceId();
    await repository.save(aWorkspaceGoal(workspaceId, 'Ownership'));

    expect(
      await repository.existsWithName(
        workspaceId,
        WorkspaceGoalName.of('OWNERSHIP'),
      ),
    ).toBe(true);
    expect(
      await repository.existsWithName(
        aWorkspaceId(),
        WorkspaceGoalName.of('ownership'),
      ),
    ).toBe(false);
  });

  it('refuses a second one that differs only in letter case, as the domain rule', async () => {
    const workspaceId = aWorkspaceId();
    await repository.save(aWorkspaceGoal(workspaceId, 'ownership'));

    await expect(
      repository.save(aWorkspaceGoal(workspaceId, 'OwnerShip')),
    ).rejects.toThrow(WorkspaceGoalNameTakenError);
  });
});

describe('listing Workspace Goals', () => {
  it('answers every one alphabetically ignoring case when hidden ones are asked for', async () => {
    const workspaceId = aWorkspaceId();
    const hidden = aWorkspaceGoal(workspaceId, 'ownershic');
    hidden.hide();
    await repository.save(aWorkspaceGoal(workspaceId, 'Ownership', 'Ours.'));
    await repository.save(hidden);
    await repository.save(aWorkspaceGoal(workspaceId, 'customer-first'));
    await repository.save(aWorkspaceGoal(aWorkspaceId(), 'elsewhere'));

    const page = await query.listInWorkspace(
      workspaceId,
      { includeHidden: true },
      ONE_PAGE,
    );

    expect(page.total).toBe(3);
    expect(
      page.items.map((item) => [item.name, item.description, item.status]),
    ).toEqual([
      ['customer-first', null, 'ACTIVE'],
      ['ownershic', null, 'HIDDEN'],
      ['Ownership', 'Ours.', 'ACTIVE'],
    ]);
  });

  it('answers only the active ones otherwise', async () => {
    const workspaceId = aWorkspaceId();
    const hidden = aWorkspaceGoal(workspaceId, 'ownershic');
    hidden.hide();
    await repository.save(hidden);
    await repository.save(aWorkspaceGoal(workspaceId, 'ownership'));

    const page = await query.listInWorkspace(
      workspaceId,
      { includeHidden: false },
      ONE_PAGE,
    );

    expect(page.items.map((item) => item.name)).toEqual(['ownership']);
    expect(page.total).toBe(1);
  });
});
