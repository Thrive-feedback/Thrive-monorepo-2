import { Injectable } from '@nestjs/common';
import { type CurrentAccount, IdentityPort } from '../port/identity.port';
import { ProfileQuery } from '../query-port/profile.query-port';
import type { ProfileView } from '../types/profile.types';

export interface GetCurrentSessionInput {
  readonly credential: string;
}

export interface CurrentSessionView {
  /** `null` for no session, a forged one or an expired one. */
  readonly account:
    | (CurrentAccount & {
        /** `null` until the person has introduced themselves. */
        readonly profile: ProfileView | null;
      })
    | null;
  readonly needsRefresh: boolean;
}

/**
 * A query: who, if anyone, the request is signed in as, whether they have introduced
 * themselves, and whether the session is due a refresh. Being signed out is an answer. It
 * never writes; refreshing is its own command.
 */
@Injectable()
export class GetCurrentSessionUseCase {
  constructor(
    private readonly identityPort: IdentityPort,
    private readonly profileQuery: ProfileQuery,
  ) {}

  async execute(input: GetCurrentSessionInput): Promise<CurrentSessionView> {
    const session = await this.identityPort.currentSession(input.credential);
    if (!session.account) {
      return { account: null, needsRefresh: session.needsRefresh };
    }
    return {
      account: {
        ...session.account,
        profile: await this.profileQuery.profileOfAccount(session.account.id),
      },
      needsRefresh: session.needsRefresh,
    };
  }
}
