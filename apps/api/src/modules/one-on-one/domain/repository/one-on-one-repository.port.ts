import type { OneOnOne } from '../entity/one-on-one.entity';

export abstract class OneOnOneRepository {
  /** `null` when there is none with this id in this Workspace — another's is never found. */
  abstract findById(
    workspaceId: string,
    oneOnOneId: string,
  ): Promise<OneOnOne | null>;

  /**
   * Whether these two people already have a 1:1 that is open at `at` (`OneOnOne.isOpenAt`): running
   * or waiting on an answer, whichever of them sent the invitation, so a second is not started
   * beside it. A one-time meeting already over holds nobody.
   */
  abstract existsOpenBetween(
    workspaceId: string,
    firstAccountId: string,
    secondAccountId: string,
    at: Date,
  ): Promise<boolean>;

  /** Stores a new one, or what changed in one. */
  abstract save(oneOnOne: OneOnOne): Promise<void>;
}
