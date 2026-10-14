import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';

/** What a collection route asks for. Declared here, not borrowed from another module. */
export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

export interface AnswerView {
  readonly body: string;
  readonly answeredAt: Date;
}

/** One Ask as a screen reads it: who was asked, by name, and where it stands. */
export interface AskView {
  readonly askId: string;
  readonly giverAccountId: string;
  /** `null` while that Member has not introduced themselves. */
  readonly giverName: string | null;
  readonly status: AskStatusValue;
  /**
   * What was written, or `null` — because the Ask is still waiting, because this caller may
   * not read it, or because the view does not carry answers at all, as the list of sent
   * requests does not. The Receiver reads every answer their request collected; a Giver reads
   * their own and nobody else's.
   */
  readonly answer: AnswerView | null;
}

/** One Feedback Request as a screen reads it. */
export interface FeedbackRequestView {
  readonly id: string;
  readonly topic: string;
  readonly visibility: VisibilityValue;
  readonly asks: readonly AskView[];
  readonly createdAt: Date;
}

/** The Requester's own requests, newest first. */
export interface FeedbackRequestListView {
  readonly items: readonly FeedbackRequestView[];
  readonly total: number;
}

/** One Ask as the Member asked reads it: who wants Feedback, about what. */
export interface MyAskView {
  readonly askId: string;
  readonly feedbackRequestId: string;
  readonly topic: string;
  readonly requesterAccountId: string;
  /** `null` while the Requester has not introduced themselves. */
  readonly requesterName: string | null;
  readonly status: AskStatusValue;
  readonly createdAt: Date;
}

/** The Asks waiting on one Member, newest first. */
export interface MyAskListView {
  readonly items: readonly MyAskView[];
  readonly total: number;
}

/**
 * One piece of Feedback as its Receiver reads it: who wrote it, what it was about, and what
 * they wrote. There is no `visibility` here — Visibility governs who *besides* the Giver and
 * the Receiver may read, and the Receiver is never the person it excludes.
 */
export interface ReceivedFeedbackView {
  readonly id: string;
  readonly feedbackRequestId: string;
  readonly topic: string;
  readonly giverAccountId: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  readonly body: string;
  readonly createdAt: Date;
}

/** The Feedback written to one Member, newest first. */
export interface ReceivedFeedbackListView {
  readonly items: readonly ReceivedFeedbackView[];
  readonly total: number;
}
