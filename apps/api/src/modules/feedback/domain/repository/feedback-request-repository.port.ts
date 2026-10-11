import type { FeedbackRequest } from '../entity/feedback-request.entity';

export abstract class FeedbackRequestRepository {
  /**
   * Stores a new Feedback Request with its Asks. The Workspace is a required argument on every
   * read for the same reason it is held on the row: a query that forgets it cannot be written.
   */
  abstract save(request: FeedbackRequest): Promise<void>;

  /** The request, or `null` when this Workspace has none with that id. */
  abstract findInWorkspace(
    workspaceId: string,
    requestId: string,
  ): Promise<FeedbackRequest | null>;
}
