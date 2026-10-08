import { afterAll, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { v7 as uuidv7 } from 'uuid';
import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction.context';
import { PrismaUnitOfWork } from './prisma-unit-of-work.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const unitOfWork = new PrismaUnitOfWork(
  prismaService,
  prismaTransactionContext,
);

const createdWorkspaceIds: string[] = [];

/** Writes through `client`, as a repository does, so the write joins any open unit. */
async function writeAWorkspace(): Promise<string> {
  const id = uuidv7();
  createdWorkspaceIds.push(id);
  await prismaTransactionContext.client.workspace.create({
    data: { id, name: 'Unit of work' },
  });
  return id;
}

async function exists(id: string): Promise<boolean> {
  return (await prismaService.workspace.findUnique({ where: { id } })) !== null;
}

/** Resolves once Postgres shows someone waiting on an advisory lock. */
async function untilSomeoneWaitsOnALock(): Promise<void> {
  for (;;) {
    const rows = await prismaService.$queryRaw<{ waiting: number }[]>`
      SELECT count(*)::int AS waiting FROM pg_locks
      WHERE locktype = 'advisory' AND NOT granted`;
    if ((rows[0]?.waiting ?? 0) > 0) {
      return;
    }
    await Bun.sleep(10);
  }
}

afterAll(async () => {
  await prismaService.workspace.deleteMany({
    where: { id: { in: createdWorkspaceIds } },
  });
  await prismaService.$disconnect();
});

describe('a unit of work in Postgres', () => {
  it('keeps what was written when the work finishes', async () => {
    const id = await unitOfWork.run(writeAWorkspace);

    expect(await exists(id)).toBe(true);
  });

  it('undoes everything written when the work fails', async () => {
    let written = '';

    await expect(
      unitOfWork.run(async () => {
        written = await writeAWorkspace();
        throw new Error('the work failed');
      }),
    ).rejects.toThrow('the work failed');
    expect(await exists(written)).toBe(false);
  });

  it('runs two units on the same key one after the other', async () => {
    const key = `test:${uuidv7()}`;
    const order: string[] = [];
    let releaseFirst = () => {};
    const firstMayFinish = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let firstStarted = () => {};
    const firstHasStarted = new Promise<void>((resolve) => {
      firstStarted = resolve;
    });

    const first = unitOfWork.run(
      async () => {
        order.push('first started');
        firstStarted();
        await firstMayFinish;
        order.push('first finished');
      },
      { serializeOn: key },
    );
    await firstHasStarted;
    const second = unitOfWork.run(
      async () => {
        order.push('second started');
      },
      { serializeOn: key },
    );
    await untilSomeoneWaitsOnALock();
    releaseFirst();
    await Promise.all([first, second]);

    expect(order).toEqual([
      'first started',
      'first finished',
      'second started',
    ]);
  });

  it('refuses to open inside another', async () => {
    await expect(
      unitOfWork.run(() => unitOfWork.run(async () => 'nested')),
    ).rejects.toThrow('inside another');
  });
});
