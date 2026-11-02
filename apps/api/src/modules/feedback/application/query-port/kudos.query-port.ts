import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
import type { KudosMonthRange } from '../../domain/value-object/kudos-month.vo';
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

export abstract class KudosQuery {
  /**
   * The Kudos of one Workspace, newest first, after the one named — every Member reads them all,
   * so nobody is in this read. The Workspace is a required argument, so a read scoped to nothing
   * cannot be written. `within` narrows it to one month, and `null` reads them all.
   */
  abstract publicIn(
    workspaceId: string,
    page: CursorPageRequest,
    within: KudosMonthRange | null,
  ): Promise<KudosPageRow>;

  /**
   * The Kudos of one Workspace past a place on Home, newest first. `recipientAccountId` narrows it to
   * the Kudos that name that person, for Shared with me; `null` reads them all.
   */
  abstract onHome(
    workspaceId: string,
    page: FeedPageRequest,
    recipientAccountId: string | null,
  ): Promise<KudosPageRow>;

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
}
