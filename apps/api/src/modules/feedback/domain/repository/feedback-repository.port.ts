import type { Feedback } from '../entity/feedback.entity';

/**
 * Feedback given without being asked, which is its own aggregate root. Feedback answering an
 * Ask is written by `FeedbackRequestRepository.saveAnswer` instead, in the same transaction as
 * the Ask it answers.
 */
export abstract class FeedbackRepository {
  /** Stores a new piece of Offered Feedback with the people it is shared with. */
  abstract save(feedback: Feedback): Promise<void>;
}
