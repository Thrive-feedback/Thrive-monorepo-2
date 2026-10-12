import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';

/** What a collection route asks for. Declared here, not borrowed from another module. */
export interface PageRequest {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
}

/** One Ask as a screen reads it: who was asked, by name, and where it stands. */
export interface AskView {
  readonly askId: string;
  readonly giverAccountId: string;
  /** `null` while that Member has not introduced themselves. */
  readonly giverName: string | null;
  readonly status: AskStatusValue;
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
