import type { KudosCardSnapshot } from '../../domain/value-object/kudos-card.vo';
import type { PersonStatus, TagsView } from './feedback-request.types';

/**
 * What a cursor-paged collection asks for (ADR 0059): the rows after the one a previous page
 * ended on, or the first page, and how many. The cursor's encoding is the wire's; here it is the
 * id it names.
 */
export interface CursorPageRequest {
  /** The id of the last row already sent, or `null` for the first page. */
  readonly afterId: string | null;
  readonly limit: number;
}

/**
 * A place in a list ordered newest first with `id` breaking ties. It means the same in any table
 * ordered that way, which is what lets Home read two under one cursor (ADR 0077).
 */
export interface FeedPosition {
  readonly createdAt: Date;
  readonly id: string;
}

/** Newest first, `id` breaking ties: the order a list of two tables is merged in. */
export function newestFirst(a: FeedPosition, b: FeedPosition) {
  return (
    b.createdAt.getTime() - a.createdAt.getTime() ||
    (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
  );
}

/** One page of Home: the rows after a place, or the first page, and how many. */
export interface FeedPageRequest {
  /** Where the last page ended, or `null` for the first page. */
  readonly after: FeedPosition | null;
  readonly limit: number;
}

/** One person a Kudos names, as a reader is shown them. */
export interface KudosPersonView {
  readonly accountId: string;
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  /** Their Google photo, or `null` when they have none. */
  readonly photoUrl: string | null;
  readonly status: PersonStatus;
}

/** One Kudos as every Member of its Workspace reads it. */
export interface KudosView {
  readonly id: string;
  readonly giver: KudosPersonView;
  readonly recipients: readonly KudosPersonView[];
  readonly message: string;
  readonly tags: TagsView;
  /** How it looks, or `null` when there is no card to draw. */
  readonly card: KudosCardSnapshot | null;
  readonly createdAt: Date;
}

/** One page of a Workspace's Kudos, newest first. */
export interface WorkspaceKudosView {
  readonly items: readonly KudosView[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}

/** How many Kudos one month of a Workspace holds. */
export interface KudosMonthView {
  /** `YYYY-MM`, on the clock `KudosMonth` reads. */
  readonly month: string;
  readonly count: number;
}

/** A Workspace's Kudos counted: in all, and in each month holding one, newest first. */
export interface KudosMonthsView {
  readonly total: number;
  readonly months: readonly KudosMonthView[];
}
