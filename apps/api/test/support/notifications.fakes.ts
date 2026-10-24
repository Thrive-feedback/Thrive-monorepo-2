import {
  AccountLinker,
  type LinkedIdentity,
} from '@app/modules/notifications/application/port/account-linker.port';
import {
  LinkHandoff,
  type LinkStart,
} from '@app/modules/notifications/application/port/link-handoff.port';
import { LinkedAccountQuery } from '@app/modules/notifications/application/query-port/linked-account.query-port';
import type { LinkedAccountView } from '@app/modules/notifications/application/types/linked-account.types';
import {
  LinkedAccountRepository,
  type LinkedAccountToStore,
} from '@app/modules/notifications/domain/repository/linked-account-repository.port';

/**
 * One chat tool's linking half, as a test sets it up. It records the codes it was given,
 * because several rules here are about the tool *not* being reached — a refused `state` must
 * end the round trip before anything is exchanged.
 */
export class FakeAccountLinker extends AccountLinker {
  readonly exchangedCodes: string[] = [];
  private identity: LinkedIdentity = {
    externalUserId: 'discord-user-ann',
    externalUsername: 'ann',
  };
  private refusing = false;

  constructor(private readonly name = 'DISCORD') {
    super();
  }

  withIdentity(identity: LinkedIdentity): this {
    this.identity = identity;
    return this;
  }

  refusingTheExchange(): this {
    this.refusing = true;
    return this;
  }

  /** The application boots once for the whole run, so each scenario starts from here. */
  reset(): this {
    this.exchangedCodes.length = 0;
    this.identity = {
      externalUserId: 'discord-user-ann',
      externalUsername: 'ann',
    };
    this.refusing = false;
    return this;
  }

  authorizeUrl(state: string): string {
    return `https://${this.name.toLowerCase()}.example/authorize?state=${state}`;
  }

  async exchangeCode(code: string): Promise<LinkedIdentity> {
    this.exchangedCodes.push(code);
    if (this.refusing) {
      throw new Error(`${this.name} refused the exchange`);
    }
    return this.identity;
  }
}

/** Signs by writing the claims down, so a test can forge one and see it refused. */
export class FakeLinkHandoff extends LinkHandoff {
  private stale = false;

  treatingEverythingAsStale(): this {
    this.stale = true;
    return this;
  }

  signLinkStart(start: LinkStart): string {
    return `link:${JSON.stringify(start)}`;
  }

  readLinkStart(token: string): LinkStart | null {
    if (this.stale || !token.startsWith('link:')) {
      return null;
    }
    try {
      return JSON.parse(token.slice('link:'.length)) as LinkStart;
    } catch {
      // The real signer answers `null` for anything it did not produce, tampered-with payloads
      // included. A fake that threw instead would let a use case pass here and fail in Postgres.
      return null;
    }
  }
}

/** Keeps links in memory, with both unique indexes enforced the way Postgres enforces them. */
export class FakeLinkedAccountRepository extends LinkedAccountRepository {
  readonly saved: LinkedAccountToStore[] = [];

  async save(link: LinkedAccountToStore): Promise<boolean> {
    const { providerAccount } = link;
    const takenByAnother = this.saved.some(
      (stored) =>
        stored.accountId !== link.accountId &&
        stored.providerAccount.provider === providerAccount.provider &&
        stored.providerAccount.externalTeamId ===
          providerAccount.externalTeamId &&
        stored.providerAccount.externalUserId ===
          providerAccount.externalUserId,
    );
    if (takenByAnother) {
      return false;
    }
    const index = this.saved.findIndex(
      (stored) =>
        stored.accountId === link.accountId &&
        stored.providerAccount.provider === providerAccount.provider,
    );
    if (index === -1) {
      this.saved.push(link);
    } else {
      this.saved[index] = link;
    }
    return true;
  }

  async remove(link: {
    readonly accountId: string;
    readonly provider: string;
  }): Promise<boolean> {
    const index = this.saved.findIndex(
      (stored) =>
        stored.accountId === link.accountId &&
        stored.providerAccount.provider === link.provider,
    );
    if (index === -1) {
      return false;
    }
    this.saved.splice(index, 1);
    return true;
  }
}

/** Answers the views it was handed, for the Account that asks. */
export class FakeLinkedAccountQuery extends LinkedAccountQuery {
  private readonly views = new Map<string, readonly LinkedAccountView[]>();

  withLinksFor(accountId: string, ...views: LinkedAccountView[]): this {
    this.views.set(accountId, views);
    return this;
  }

  async forAccount(accountId: string): Promise<readonly LinkedAccountView[]> {
    return this.views.get(accountId) ?? [];
  }
}
