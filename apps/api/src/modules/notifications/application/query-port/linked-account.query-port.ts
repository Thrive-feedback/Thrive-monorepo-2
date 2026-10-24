import type { ChatProviderValue } from '../../domain/value-object/chat-provider.vo';
import type { LinkedAccountView } from '../types/linked-account.types';

/**
 * One way Thrive can reach one person, for sending rather than for a screen. The chat tool's
 * own ids are here because messaging needs them; nothing that answers a screen carries them.
 */
export interface ReachableAccount {
  readonly accountId: string;
  readonly provider: ChatProviderValue;
  readonly externalUserId: string;
  /** The conversation, once one has been opened. `null` until the first message (D4). */
  readonly directChannelId: string | null;
}

/**
 * Reading Linked Accounts for a screen, outside the repository because it answers a view rather
 * than an entity (`BE_05`). Always one Account's own: there is no method that names somebody
 * else, so no caller can ask for one.
 */
export abstract class LinkedAccountQuery {
  abstract forAccount(accountId: string): Promise<readonly LinkedAccountView[]>;

  /**
   * Every way Thrive can reach each of these people, in **one** read however many are named —
   * a request asking five people is one query, not five (`BE_06` R9). Somebody who has linked
   * nothing is simply absent from the answer, which is how "skipped quietly" starts.
   */
  abstract reachableFor(
    accountIds: readonly string[],
  ): Promise<readonly ReachableAccount[]>;
}
