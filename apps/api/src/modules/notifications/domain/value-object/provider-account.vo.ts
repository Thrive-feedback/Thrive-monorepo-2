import type { ChatProviderValue } from './chat-provider.vo';

/**
 * Who somebody is inside one chat tool, as the triple Thrive stores: the tool, the tool's own
 * space where it has one, and its id for the person (design 0021 D8).
 *
 * `externalTeamId` holds the **empty string**, never null, for a provider whose user ids stand
 * alone — Discord's do. Postgres treats NULLs as distinct in a unique index, so a nullable
 * column would let the same identity be stored twice and two Members would quietly share one
 * notification stream. Ugly and correct beats elegant and silently broken.
 */
export class ProviderAccount {
  private constructor(
    readonly provider: ChatProviderValue,
    readonly externalTeamId: string,
    readonly externalUserId: string,
    readonly externalUsername: string,
  ) {}

  static of(account: {
    readonly provider: ChatProviderValue;
    /** Absent for a provider without the concept, which is stored as `''`. */
    readonly externalTeamId?: string;
    readonly externalUserId: string;
    readonly externalUsername: string;
  }): ProviderAccount {
    return new ProviderAccount(
      account.provider,
      account.externalTeamId ?? '',
      account.externalUserId,
      account.externalUsername,
    );
  }
}
