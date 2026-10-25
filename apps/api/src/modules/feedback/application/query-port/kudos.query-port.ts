import type { TagsView } from '../types/feedback-request.types';
import type { CursorPageRequest } from '../types/kudos.types';

/** One Kudos, as stored. Names are Identity's and are added above this port. */
export interface KudosRow {
  readonly id: string;
  readonly giverAccountId: string;
  readonly recipientAccountIds: readonly string[];
  readonly message: string;
  readonly tags: TagsView;
  readonly createdAt: Date;
}

export interface KudosPageRow {
  readonly items: readonly KudosRow[];
  /** Whether rows remain after this page. */
  readonly hasMore: boolean;
}

export abstract class KudosQuery {
  /**
   * The Kudos of one Workspace, newest first, after the one named — every Member reads them all,
   * so nobody is in this read. The Workspace is a required argument, so a read scoped to nothing
   * cannot be written.
   */
  abstract publicIn(
    workspaceId: string,
    page: CursorPageRequest,
  ): Promise<KudosPageRow>;
}
