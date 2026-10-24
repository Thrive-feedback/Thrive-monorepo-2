import type { ChatProviderValue } from '../value-object/chat-provider.vo';
import type { ProviderAccount } from '../value-object/provider-account.vo';

/** A Linked Account as it is written: the Account, and who they are in the chat tool. */
export interface LinkedAccountToStore {
  readonly id: string;
  readonly accountId: string;
  readonly providerAccount: ProviderAccount;
}

export abstract class LinkedAccountRepository {
  /**
   * Stores the link, replacing this Account's existing one for the same tool in place.
   *
   * Answers `false` when the chat-tool identity already belongs to a **different** Account, and
   * `true` when it was stored. Decided by the unique index rather than by a read beforehand,
   * because a check followed by a write is a race two people can both win.
   */
  abstract save(link: LinkedAccountToStore): Promise<boolean>;

  /** `false` when there was no link to remove, which the caller words rather than throwing. */
  abstract remove(link: {
    readonly accountId: string;
    readonly provider: ChatProviderValue;
  }): Promise<boolean>;
}
