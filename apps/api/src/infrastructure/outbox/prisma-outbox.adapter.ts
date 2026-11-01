import { IdGenerator } from '@app/shared/application/id-generator.port';
import {
  Outbox,
  type OutboxMessageToSend,
} from '@app/shared/application/outbox.port';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../database/generated/client';
import { PrismaTransactionContext } from '../database/prisma-transaction.context';

/**
 * Writes through `client`, so an enqueue inside a unit of work joins its transaction — which is
 * the entire point of the table (ADR 0076).
 *
 * `skipDuplicates` rather than a read-then-write: two requests racing on one idempotency key both
 * pass a check, and the unique index is what actually decides. A duplicate is silently not
 * written, because a second enqueue of the same thing is not an error, it is a retry.
 */
@Injectable()
export class PrismaOutbox extends Outbox {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
    private readonly idGenerator: IdGenerator,
  ) {
    super();
  }

  async enqueue(messages: readonly OutboxMessageToSend[]): Promise<void> {
    if (!this.prismaTransactionContext.isInTransaction) {
      throw new Error(
        'The outbox was written outside a unit of work. Enqueue inside the transaction whose commit the message depends on.',
      );
    }
    if (messages.length === 0) return;

    await this.prismaTransactionContext.client.outboxMessage.createMany({
      data: messages.map((message) => ({
        id: this.idGenerator.next(),
        type: message.type,
        payload: message.payload as Prisma.InputJsonValue,
        idempotencyKey: message.idempotencyKey,
      })),
      skipDuplicates: true,
    });
  }
}
