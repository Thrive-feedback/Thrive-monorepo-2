import type { LinkedAccountView } from '../types/linked-account.types';

/**
 * Reading Linked Accounts for a screen, outside the repository because it answers a view rather
 * than an entity (`BE_05`). Always one Account's own: there is no method that names somebody
 * else, so no caller can ask for one.
 */
export abstract class LinkedAccountQuery {
  abstract forAccount(accountId: string): Promise<readonly LinkedAccountView[]>;
}
