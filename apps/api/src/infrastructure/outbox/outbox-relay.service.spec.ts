import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Clock } from '@app/shared/application/clock.port';
import {
  OutboxHandler,
  OutboxHandlerRegistry,
  type OutboxMessageRead,
  UnprocessableOutboxMessage,
} from '@app/shared/application/outbox-handler.port';
import { OutboxRelay } from './outbox-relay.service';

const NOW = new Date('2026-11-01T09:00:00.000Z');

interface Row {
  id: string;
  type: string;
  version: number;
  payload: unknown;
  attempts: number;
}

/**
 * The relay talks to Postgres through raw SQL, so the double stands in for the client rather
 * than for a repository: it answers the claim with rows and records what was written back.
 */
function prismaDouble(claimed: Row[]) {
  const updates: { id: string; data: Record<string, unknown> }[] = [];
  let sweeps = 0;
  return {
    updates,
    sweepCount: () => sweeps,
    $queryRaw: mock(async () => claimed),
    $executeRaw: mock(async () => {
      sweeps += 1;
      return 0;
    }),
    outboxMessage: {
      update: mock(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => {
          updates.push({ id: where.id, data });
          return undefined;
        },
      ),
    },
  };
}

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

const frozenClock = new (class extends Clock {
  now() {
    return NOW;
  }
})();

function relayFor(
  prisma: ReturnType<typeof prismaDouble>,
  registry: OutboxHandlerRegistry,
) {
  // The double is shaped to the slice of PrismaService the relay touches, nothing wider.
  return new OutboxRelay(
    prisma as unknown as ConstructorParameters<typeof OutboxRelay>[0],
    registry,
    frozenClock,
  );
}

describe('OutboxRelay', () => {
  let handled: OutboxMessageRead[];

  beforeEach(() => {
    handled = [];
  });

  it('hands a due message to the handler its type names, and marks it delivered', async () => {
    const prisma = prismaDouble([
      {
        id: 'm1',
        type: 'a.thing',
        version: 1,
        payload: { id: 'x' },
        attempts: 1,
      },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async (message) => {
          handled.push(message);
        }),
      }),
    );

    const report = await relay.drainOnce();

    expect(handled).toHaveLength(1);
    expect(handled[0]?.payload).toEqual({ id: 'x' });
    expect(report).toMatchObject({
      claimed: 1,
      delivered: 1,
      dead: 0,
      retried: 0,
    });
    expect(prisma.updates[0]?.data.deliveredAt).toEqual(NOW);
  });

  it('leaves a rejected message for later without writing a delivery or a death', async () => {
    const prisma = prismaDouble([
      { id: 'm1', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async () => {
          throw new Error('the far side refused');
        }),
      }),
    );

    const report = await relay.drainOnce();

    expect(report).toMatchObject({ retried: 1, delivered: 0, dead: 0 });
    // Claiming already pushed availableAt forward; only the reason is recorded.
    expect(prisma.updates[0]?.data).toEqual({
      lastError: 'the far side refused',
    });
  });

  it('kills a message whose attempts are spent', async () => {
    const prisma = prismaDouble([
      { id: 'm1', type: 'a.thing', version: 1, payload: {}, attempts: 3 },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async () => {
          throw new Error('still refusing');
        }, 3),
      }),
    );

    const report = await relay.drainOnce();

    expect(report).toMatchObject({ dead: 1, retried: 0 });
    expect(prisma.updates[0]?.data.deadAt).toEqual(NOW);
  });

  it('kills a message the handler calls unprocessable, however many attempts remain', async () => {
    const prisma = prismaDouble([
      { id: 'm1', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async () => {
          throw new UnprocessableOutboxMessage('the subject is gone');
        }, 5),
      }),
    );

    const report = await relay.drainOnce();

    expect(report).toMatchObject({ dead: 1 });
    expect(prisma.updates[0]?.data.deadAt).toEqual(NOW);
  });

  it('kills a message no handler claims, rather than claiming it every tick for ever', async () => {
    const prisma = prismaDouble([
      { id: 'm1', type: 'gone.away', version: 1, payload: {}, attempts: 1 },
    ]);
    const relay = relayFor(prisma, registryOf({}));

    const report = await relay.drainOnce();

    expect(report).toMatchObject({ dead: 1 });
    expect(prisma.updates[0]?.data.deadAt).toEqual(NOW);
    expect(prisma.updates[0]?.data.lastError).toContain('gone.away');
  });

  it('works a batch one message at a time, so one slow handler cannot multiply outbound load', async () => {
    const order: string[] = [];
    const prisma = prismaDouble([
      { id: 'm1', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
      { id: 'm2', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async (message) => {
          order.push(`start:${message.id}`);
          await Promise.resolve();
          order.push(`end:${message.id}`);
        }),
      }),
    );

    await relay.drainOnce();

    expect(order).toEqual(['start:m1', 'end:m1', 'start:m2', 'end:m2']);
  });

  it('sweeps delivered rows on every tick, including one that claimed nothing', async () => {
    const prisma = prismaDouble([]);
    const relay = relayFor(prisma, registryOf({}));

    const report = await relay.drainOnce();

    expect(report.claimed).toBe(0);
    expect(prisma.sweepCount()).toBe(1);
  });

  it('stops working a claimed batch once shutdown has begun', async () => {
    const prisma = prismaDouble([
      { id: 'm1', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
      { id: 'm2', type: 'a.thing', version: 1, payload: {}, attempts: 1 },
    ]);
    const relay = relayFor(
      prisma,
      registryOf({
        'a.thing': handler(async (message) => {
          handled.push(message);
          await relay.onApplicationShutdown();
        }),
      }),
    );

    await relay.drainOnce();

    expect(handled.map((message) => message.id)).toEqual(['m1']);
  });
});
