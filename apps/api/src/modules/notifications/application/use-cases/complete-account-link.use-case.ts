import { IdGenerator } from '@app/shared/application/id-generator.port';
import { Injectable } from '@nestjs/common';
import { LinkedAccountRepository } from '../../domain/repository/linked-account-repository.port';
import {
  ChatProvider,
  type ChatProviderValue,
} from '../../domain/value-object/chat-provider.vo';
import { ProviderAccount } from '../../domain/value-object/provider-account.vo';
import {
  AccountAlreadyLinkedError,
  LinkRefusedError,
  LinkStateInvalidError,
} from '../notifications.errors';
import { LinkHandoff } from '../port/link-handoff.port';
import { AccountLinkerRegistry } from '../service/account-linker-registry.service';

export interface CompleteAccountLinkInput {
  readonly accountId: string;
  readonly provider: string;
  /** The authorisation code the chat tool sent the browser back with. */
  readonly code: string;
  /** The `state` this link started with, as `BeginAccountLink` signed it. */
  readonly state: string;
}

export interface CompleteAccountLinkResult {
  readonly provider: ChatProviderValue;
  readonly externalUsername: string;
}

/**
 * Finishes the round trip: checks the link started here, asks the chat tool who authorised, and
 * stores that identity against the caller's Account.
 *
 * The `state` check is the whole security of this workflow. Without it a crafted link makes a
 * Member link **the attacker's** chat account to their own Thrive Account, and from then on
 * every direct message meant for them arrives somewhere else. So it is compared against the
 * caller and the tool in the path, and any disagreement ends the link.
 *
 * The user access token the exchange needs never reaches this use case, let alone the database:
 * the adapter spends it and discards it (design 0021 D9).
 */
@Injectable()
export class CompleteAccountLinkUseCase {
  constructor(
    private readonly accountLinkerRegistry: AccountLinkerRegistry,
    private readonly linkHandoff: LinkHandoff,
    private readonly linkedAccountRepository: LinkedAccountRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: CompleteAccountLinkInput,
  ): Promise<CompleteAccountLinkResult> {
    const provider = ChatProvider.of(input.provider).toString();
    const start = this.linkHandoff.readLinkStart(input.state);
    if (
      !start ||
      start.accountId !== input.accountId ||
      start.provider !== provider
    ) {
      throw new LinkStateInvalidError();
    }

    // The chat tool's own answer is the only authenticated proof of which account this is, so a
    // refusal here ends the link rather than falling back on anything the browser carried.
    const identity = await this.accountLinkerRegistry
      .for(provider)
      .exchangeCode(input.code)
      .catch(() => Promise.reject(new LinkRefusedError()));

    const providerAccount = ProviderAccount.of({ provider, ...identity });
    const stored = await this.linkedAccountRepository.save({
      id: this.idGenerator.next(),
      accountId: input.accountId,
      providerAccount,
    });
    if (!stored) {
      throw new AccountAlreadyLinkedError();
    }

    return {
      provider,
      externalUsername: providerAccount.externalUsername,
    };
  }
}
