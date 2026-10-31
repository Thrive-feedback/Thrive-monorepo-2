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

/** One person a Kudos names, as a reader is shown them. */
export interface KudosPersonView {
  readonly accountId: string;
  /** `null` while they have not introduced themselves. */
  readonly name: string | null;
  readonly status: PersonStatus;
}

/** One Kudos as every Member of its Workspace reads it. */
export interface KudosView {
  readonly id: string;
  readonly giver: KudosPersonView;
  readonly recipients: readonly KudosPersonView[];
  readonly message: string;
  readonly tags: TagsView;
  /** How it looks, or `null` when it was not written on a card. */
  readonly card: KudosCardSnapshot | null;
  readonly createdAt: Date;
}

/** One page of a Workspace's Kudos, newest first. */
export interface WorkspaceKudosView {
  readonly items: readonly KudosView[];
  /** The id the next page starts after, or `null` on the last page. */
  readonly nextAfterId: string | null;
}
