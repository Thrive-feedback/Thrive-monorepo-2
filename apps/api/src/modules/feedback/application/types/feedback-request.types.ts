import type { FeedbackOrigin } from '../../domain/entity/feedback.entity';
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

/** A Member a request is shared with, by name. */
export interface SelectedPersonView {
  readonly accountId: string;
  /** `null` while that Member has not introduced themselves. */
  readonly name: string | null;
}

/** Who besides the Giver and the Requester reads a request's answers. */
export interface VisibilityView {
  readonly value: VisibilityValue;
  /** Empty unless `value` is Selected people. */
  readonly selectedPeople: readonly SelectedPersonView[];
}

/** One Feedback Request as a screen reads it. */
export interface FeedbackRequestView {
  readonly id: string;
  readonly topic: string;
  /** `null` when the caller is a Giver, who is not told who else reads it (`ADR-0022`). */
  readonly visibility: VisibilityView | null;
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
 * One piece of Feedback as its Receiver reads it: who wrote it, what it was about, whether they
 * were asked, and what they wrote. There is no `visibility` here — Visibility governs who
 * *besides* the Giver and the Receiver may read, and the Receiver is never the person it
 * excludes.
 */
export interface ReceivedFeedbackView {
  readonly id: string;
  /** Whether it answered an Ask or was given without being asked. */
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  readonly giverAccountId: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  readonly body: string;
  readonly createdAt: Date;
}

/**
 * One piece of Feedback, the same for every reader its Visibility lets in: the Receiver, the Giver, or a
 * Member its Visibility reaches — who needs to be told who it is about.
 */
export interface FeedbackView {
  readonly id: string;
  /** Whether it answered an Ask or was given without being asked. */
  readonly origin: FeedbackOrigin;
  /** The request it answers, or `null` for Feedback given without being asked. */
  readonly feedbackRequestId: string | null;
  readonly topic: string;
  readonly giverAccountId: string;
  /** `null` while the Giver has not introduced themselves. */
  readonly giverName: string | null;
  readonly receiverAccountId: string;
  /** `null` while the Receiver has not introduced themselves. */
  readonly receiverName: string | null;
  readonly body: string;
  readonly createdAt: Date;
}

/** The Feedback written to one Member, newest first. */
export interface ReceivedFeedbackListView {
  readonly items: readonly ReceivedFeedbackView[];
  readonly total: number;
}

/**
 * The Feedback one Member was selected to read, newest first. Every piece names both people,
 * because the reader is neither of them.
 */
export interface SharedFeedbackListView {
  readonly items: readonly FeedbackView[];
  readonly total: number;
}

/**
 * The Feedback of a Workspace that every Member may read, newest first. Every piece names both
 * people: the reader is usually neither of them.
 */
export interface WorkspaceFeedView {
  readonly items: readonly FeedbackView[];
  readonly total: number;
}
