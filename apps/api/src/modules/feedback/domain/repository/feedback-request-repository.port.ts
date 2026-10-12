import type { Feedback } from '../entity/feedback.entity';
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

  /**
   * The request holding one Ask of one Giver, or `null` when that Workspace has no such Ask
   * waiting for them. The Giver is part of the read for the same reason the Workspace is: a
   * load that forgets whose Ask it is cannot be written.
   */
  abstract findByAskOfGiver(
    workspaceId: string,
    askId: string,
    giverAccountId: string,
  ): Promise<FeedbackRequest | null>;

  /**
   * Stores the answer and the Ask it answered, in one transaction: an Ask marked Answered with
   * no Feedback beside it would be a question nobody can read the answer to.
   *
   * Raises `AskAlreadyAnsweredError` when another request answered the same Ask first —
   * whether that shows up as a row that is no longer Pending or as the unique index refusing
   * the second answer.
   */
  abstract saveAnswer(
    request: FeedbackRequest,
    feedback: Feedback,
  ): Promise<void>;
}
