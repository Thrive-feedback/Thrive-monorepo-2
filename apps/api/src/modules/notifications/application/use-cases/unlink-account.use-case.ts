import { Injectable } from '@nestjs/common';
import { LinkedAccountRepository } from '../../domain/repository/linked-account-repository.port';
import { ChatProvider } from '../../domain/value-object/chat-provider.vo';
import { NotLinkedError } from '../notifications.errors';

export interface UnlinkAccountInput {
  readonly accountId: string;
  readonly provider: string;
}

/**
 * Forgets the Member's link to one chat tool, which is how they stop being messaged there
 * (brain `ADR-0035` §6).
 *
 * The row is deleted rather than marked unused: unlinking is the Member withdrawing consent,
 * and keeping which chat account was theirs after they asked Thrive to forget it would be
 * keeping personal data with no purpose (#211 AC 4).
 */
@Injectable()
export class UnlinkAccountUseCase {
  constructor(
    private readonly linkedAccountRepository: LinkedAccountRepository,
  ) {}

  async execute(input: UnlinkAccountInput): Promise<void> {
    const provider = ChatProvider.of(input.provider).toString();
    const removed = await this.linkedAccountRepository.remove({
      accountId: input.accountId,
      provider,
    });
    if (!removed) {
      throw new NotLinkedError();
    }
  }
}
