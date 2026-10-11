import type { AskStatusValue } from '../../domain/value-object/ask-status.vo';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';

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
