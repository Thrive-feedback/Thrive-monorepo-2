import { afterAll, beforeEach, describe, expect, it } from 'bun:test';
import { loadConfiguration } from '@app/config/configuration';
import { Clock } from '@app/shared/application/clock.port';
import { IdGenerator } from '@app/shared/application/id-generator.port';
import {
  OutboxHandler,
  OutboxHandlerRegistry,
  type OutboxMessageRead,
} from '@app/shared/application/outbox-handler.port';
import { v7 as uuidv7 } from 'uuid';
import { PrismaService } from '../database/prisma.service';
import { PrismaTransactionContext } from '../database/prisma-transaction.context';
import { PrismaUnitOfWork } from '../database/prisma-unit-of-work.adapter';
import { OutboxRelay } from './outbox-relay.service';
import { PrismaOutbox } from './prisma-outbox.adapter';

const prismaService = new PrismaService(loadConfiguration().database);
const prismaTransactionContext = new PrismaTransactionContext(prismaService);
const unitOfWork = new PrismaUnitOfWork(
  prismaService,
  prismaTransactionContext,
);
const idGenerator = new (class extends IdGenerator {
  next() {
    return uuidv7();
  }
})();
const systemClock = new (class extends Clock {
  now() {
    return new Date();
  }
})();
const outbox = new PrismaOutbox(prismaTransactionContext, idGenerator);

/** Every key this file writes is prefixed, so cleanup never reaches another test's rows. */
const PREFIX = `test.${uuidv7()}`;

function registryOf(entries: Record<string, OutboxHandler>) {
  return new (class extends OutboxHandlerRegistry {
    handlerFor(type: string) {
      return entries[type];
    }
  })();
}

function handler(
  behaviour: (message: OutboxMessageRead) => Promise<void>,
  maxAttempts = 3,
): OutboxHandler {
  return new (class extends OutboxHandler {
    readonly maxAttempts = maxAttempts;
    handle = behaviour;
  })();
}

async function rowFor(idempotencyKey: string) {
  return prismaService.outboxMessage.findUnique({ where: { idempotencyKey } });
}

beforeEach(async () => {
  await prismaService.outboxMessage.deleteMany({
    where: { idempotencyKey: { startsWith: PREFIX } },
  });
});

afterAll(async () => {
  await prismaService.outboxMessage.deleteMany({
    where: { idempotencyKey: { startsWith: PREFIX } },
  });
  await prismaService.$disconnect();
});

describe('the outbox, against Postgres', () => {
  it('refuses an enqueue outside a unit of work, because the row would not share the commit', () => {
    expect(
      outbox.enqueue([
        { type: `${PREFIX}.a`, payload: {}, idempotencyKey: `${PREFIX}:1` },
      ]),
    ).rejects.toThrow(/outside a unit of work/);
  });

  it('writes the row inside the caller transaction, so a rollback takes it with it', async () => {
    const key = `${PREFIX}:rolled-back`;
    await expect(
      unitOfWork.run(async () => {
        await outbox.enqueue([
          { type: `${PREFIX}.a`, payload: {}, idempotencyKey: key },
        ]);
        throw new Error('the use case failed after enqueueing');
      }),
    ).rejects.toThrow('the use case failed after enqueueing');

    expect(await rowFor(key)).toBeNull();
  });

  it('records one row for a key enqueued twice, so a retried use case does not double', async () => {
    const key = `${PREFIX}:once`;
    const message = { type: `${PREFIX}.a`, payload: {}, idempotencyKey: key };

    await unitOfWork.run(() => outbox.enqueue([message]));
    await unitOfWork.run(() => outbox.enqueue([message]));

    const rows = await prismaService.outboxMessage.findMany({
      where: { idempotencyKey: key },
    });
    expect(rows).toHaveLength(1);
  });

  it('two relays over one table claim disjoint rows — SKIP LOCKED, proved not assumed', async () => {
    const keys = ['a', 'b', 'c', 'd'].map(
      (suffix) => `${PREFIX}:skip-${suffix}`,
    );
    await unitOfWork.run(() =>
      outbox.enqueue(
        keys.map((idempotencyKey) => ({
          type: `${PREFIX}.claimed`,
          payload: {},
          idempotencyKey,
        })),
      ),
    );

    const seenByFirst: string[] = [];
    const seenBySecond: string[] = [];
    const relayFor = (seen: string[]) =>
      new OutboxRelay(
        prismaService,
        registryOf({
          [`${PREFIX}.claimed`]: handler(async (message) => {
            seen.push(message.id);
          }),
        }),
        systemClock,
      );

    // Both tick at once. Whatever the split, no id may appear in both.
    await Promise.all([
      relayFor(seenByFirst).drainOnce(),
      relayFor(seenBySecond).drainOnce(),
    ]);

    const overlap = seenByFirst.filter((id) => seenBySecond.includes(id));
    expect(overlap).toEqual([]);
    expect([...seenByFirst, ...seenBySecond].sort()).toHaveLength(4);
  });

  it('marks a delivered row delivered, and does not claim it again', async () => {
    const key = `${PREFIX}:delivered`;
    await unitOfWork.run(() =>
      outbox.enqueue([
        { type: `${PREFIX}.claimed`, payload: { n: 1 }, idempotencyKey: key },
      ]),
    );
    let handledTimes = 0;
    const relay = new OutboxRelay(
      prismaService,
      registryOf({
        [`${PREFIX}.claimed`]: handler(async () => {
          handledTimes += 1;
        }),
      }),
      systemClock,
    );

    await relay.drainOnce();
    await relay.drainOnce();

    expect(handledTimes).toBe(1);
    expect((await rowFor(key))?.deliveredAt).not.toBeNull();
  });

  it('pushes a failed row into the future rather than spinning on it', async () => {
    const key = `${PREFIX}:deferred`;
    await unitOfWork.run(() =>
      outbox.enqueue([
        { type: `${PREFIX}.claimed`, payload: {}, idempotencyKey: key },
      ]),
    );
    const relay = new OutboxRelay(
      prismaService,
      registryOf({
        [`${PREFIX}.claimed`]: handler(async () => {
          throw new Error('not yet');
        }),
      }),
      systemClock,
    );

    const first = await relay.drainOnce();
    const second = await relay.drainOnce();

    expect(first).toMatchObject({ claimed: 1, retried: 1 });
    // The lease taken while claiming is what makes the second tick find nothing due.
    expect(second.claimed).toBe(0);
    const row = await rowFor(key);
    expect(row?.attempts).toBe(1);
    expect(row?.lastError).toBe('not yet');
  });
});
