import { PrismaTransactionContext } from '@app/infrastructure/database/prisma-transaction.context';
import { Injectable } from '@nestjs/common';
import {
  LinkedAccountRepository,
  type LinkedAccountToStore,
} from '../../domain/repository/linked-account-repository.port';
import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';

/** Postgres' code for a row that would break a unique index. */
const UNIQUE_VIOLATION = 'P2002';

/** Writes through `client`, so a save inside a unit of work joins its transaction. */
@Injectable()
export class PrismaLinkedAccountRepository extends LinkedAccountRepository {
  constructor(
    private readonly prismaTransactionContext: PrismaTransactionContext,
  ) {
    super();
  }

  async save(link: LinkedAccountToStore): Promise<boolean> {
    const { providerAccount } = link;
    const stored = {
      externalTeamId: providerAccount.externalTeamId,
      externalUserId: providerAccount.externalUserId,
      externalUsername: providerAccount.externalUsername,
    };
    try {
      // One statement: linking again replaces this Account's link to that tool in place, so the
      // unique index decides the outcome rather than a read followed by a write.
      await this.prismaTransactionContext.client.linkedAccount.upsert({
        where: {
          accountId_provider: {
            accountId: link.accountId,
            provider: providerAccount.provider,
          },
        },
        create: {
          id: link.id,
          accountId: link.accountId,
          provider: providerAccount.provider,
          ...stored,
        },
        // The minted id is left out on purpose: a replacement keeps the row it replaces.
        update: stored,
      });
      return true;
    } catch (error) {
      // The *other* unique index: this chat account already belongs to a different Thrive
      // Account. Answered rather than thrown, because the caller words the refusal. Any other
      // failure is the store's and is not this method's to interpret.
      if (isUniqueViolation(error)) {
        return false;
      }
      throw error;
    }
  }

  async remove(link: {
    readonly accountId: string;
    readonly provider: ChatProviderValue;
  }): Promise<boolean> {
    // `deleteMany` rather than `delete`: it answers how many rows went instead of throwing when
    // there were none, and "there was nothing to unlink" is a refusal the caller words.
    const { count } =
      await this.prismaTransactionContext.client.linkedAccount.deleteMany({
        where: { accountId: link.accountId, provider: link.provider },
      });
    return count > 0;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === UNIQUE_VIOLATION
  );
}
