import type { InstantRange } from '../../domain/value-object/calendar-clock.vo';
import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
import type { TagsView } from '../types/feedback-request.types';
import type {
  CursorPageRequest,
  FeedPageRequest,
  FeedPosition,
} from '../types/kudos.types';

/** One Kudos, as stored. Names are Identity's and are added above this port. */
export interface KudosRow {
  readonly id: string;
  readonly giverAccountId: string;
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly tags: TagsView;
  /** How it looks, or `null` when there is no card to draw. */
  readonly card: KudosCardSnapshot | null;
  readonly createdAt: Date;
}

export interface KudosPageRow {
  readonly items: readonly KudosRow[];
  /** Whether rows remain after this page. */
  readonly hasMore: boolean;
}

/** How many Kudos one month holds. */
export interface KudosMonthRow {
  /** `YYYY-MM`, on the clock `KudosMonth` reads. */
  readonly month: string;
  readonly count: number;
}

/** How many Kudos each of a Profile's Kudos reads holds. */
export interface ProfileKudosCountsRow {
  /** Naming the Member. */
  readonly naming: number;
  /** Between the reader and the Member. */
  readonly between: number;
}

export abstract class KudosQuery {
  /**
   * The Kudos of one Workspace, newest first, after the one named — every Member reads them all,
   * so nobody is in this read. The Workspace is a required argument, so a read scoped to nothing
   * cannot be written. `within` narrows it to one month, and `null` reads them all.
   */
  abstract publicIn(
    workspaceId: string,
    page: CursorPageRequest,
    within: InstantRange | null,
  ): Promise<KudosPageRow>;

  /**
   * The Kudos of one Workspace past a place on Home, newest first. `recipientAccountId` narrows it to
   * the Kudos that name that person, for Received and a Profile; `null` reads them all. `since`, for
   * a Profile, keeps only those given at or after it.
   */
  abstract onHome(
    workspaceId: string,
    page: FeedPageRequest,
    recipientAccountId: string | null,
    since?: Date | null,
  ): Promise<KudosPageRow>;

  /**
   * The Kudos between a reader and one Member, past a place in that Member's Profile, newest first:
   * given by one of the two naming the other, or given by somebody else naming both (ADR 0097).
   * `since` keeps only those given at or after it.
   */
  abstract kudosBetween(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    page: FeedPageRequest,
    since: Date | null,
  ): Promise<KudosPageRow>;

  /**
   * How many Kudos a Profile's two Kudos reads hold from `since` on, each counted with its list's own
   * filter so the two cannot disagree (ADR 0095). With no reader, which is the Member's own
   * Profile, `between` is `0`.
   */
  abstract profileCounts(
    workspaceId: string,
    readerAccountId: string | null,
    memberAccountId: string,
    since: Date | null,
  ): Promise<ProfileKudosCountsRow>;

  /**
   * When each Kudos on Home was given, between two instants: the rows `onHome` reads for everyone,
   * read with the same filter, so a count of them is a count of the list (ADR 0095).
   */
  abstract onHomeGivenIn(
    workspaceId: string,
    within: InstantRange,
  ): Promise<readonly Date[]>;

  /** The Kudos one Member wrote past a place in the list, newest first, naming anybody or nobody. */
  abstract givenBy(
    workspaceId: string,
    giverAccountId: string,
    page: FeedPageRequest,
  ): Promise<KudosPageRow>;

  /** Where one Kudos of this Workspace sits on Home, or `null` if it is not there. */
  abstract positionOf(
    workspaceId: string,
    kudosId: string,
  ): Promise<FeedPosition | null>;

  /** The months of one Workspace that hold a Kudos, newest first, each with how many. */
  abstract monthsIn(workspaceId: string): Promise<readonly KudosMonthRow[]>;

  /**
   * Whether one Kudos is on a Member's Profile for one reader: naming the Member, or between the two.
   * The same filters as those lists, with the id added.
   */
  abstract isKudosOnProfileFor(
    workspaceId: string,
    readerAccountId: string,
    memberAccountId: string,
    kudosId: string,
  ): Promise<boolean>;
}
