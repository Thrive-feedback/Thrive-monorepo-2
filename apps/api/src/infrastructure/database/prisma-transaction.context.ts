import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from './generated/client';
import { PrismaService } from './prisma.service';

/**
 * Which client a repository or query should use: the open transaction's inside a unit of
 * work, so it joins that transaction, and the plain client anywhere else.
 *
 * Its own class rather than a getter on {@link PrismaService}: Prisma's client is a proxy
 * that calls a subclass's getter with the bare target as `this`, which has no models.
 */
@Injectable()
export class PrismaTransactionContext {
  private readonly openTransaction =
    new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prismaService: PrismaService) {}

  get client(): Prisma.TransactionClient {
    return this.openTransaction.getStore() ?? this.prismaService;
  }

  get isInTransaction(): boolean {
    return this.openTransaction.getStore() !== undefined;
  }

  /** Makes `transaction` what {@link client} answers for everything `work` awaits. */
  within<T>(
    transaction: Prisma.TransactionClient,
    work: () => Promise<T>,
  ): Promise<T> {
    return this.openTransaction.run(transaction, work);
  }
}
