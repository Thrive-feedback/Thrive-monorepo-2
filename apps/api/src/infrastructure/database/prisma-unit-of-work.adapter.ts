import {
  UnitOfWork,
  type UnitOfWorkOptions,
} from '@app/shared/application/unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaTransactionContext } from './prisma-transaction.context';

/**
 * The outward end of {@link UnitOfWork}: one Postgres transaction, shared with every
 * repository through {@link PrismaTransactionContext.client}.
 *
 * `serializeOn` takes a transaction-level advisory lock on the key's hash. Postgres releases
 * it at commit or rollback, so nothing has to remember to unlock. Two different keys can
 * share a hash; they then wait on each other, which costs time but never correctness.
 */
@Injectable()
export class PrismaUnitOfWork extends UnitOfWork {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  run<T>(work: () => Promise<T>, options: UnitOfWorkOptions = {}): Promise<T> {
    if (this.prismaTransactionContext.isInTransaction) {
      throw new Error(
        'A unit of work was opened inside another. Open it once, in the use case.',
      );
    }
    return this.prismaService.$transaction(async (transaction) => {
      if (options.serializeOn !== undefined) {
        await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${options.serializeOn}))`;
      }
      return this.prismaTransactionContext.within(transaction, work);
    });
  }
}
