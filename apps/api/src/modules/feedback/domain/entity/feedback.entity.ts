import {
  CannotGiveYourselfFeedbackError,
  CannotSelectTheReceiverError,
  CannotSelectYourselfError,
} from '../feedback-request.errors';
import type {
  BoundMention,
  BoundTags,
  BoundWorkspaceGoal,
} from '../value-object/bound-tags.vo';
import type { FeedbackMessage } from '../value-object/feedback-message.vo';
import type {
  Visibility,
  VisibilityValue,
} from '../value-object/visibility.vo';

/** Why a piece of Feedback was written: to answer an Ask, or without being asked. */
export const FEEDBACK_ORIGINS = ['REQUESTED', 'OFFERED'] as const;

export type FeedbackOrigin = (typeof FEEDBACK_ORIGINS)[number];

export interface FeedbackSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly origin: FeedbackOrigin;
  /** Set exactly when the origin is `REQUESTED`. */
  readonly feedbackRequestId: string | null;
  /** Set exactly when the origin is `REQUESTED`. */
  readonly feedbackAskId: string | null;
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly visibility: VisibilityValue;
  /** The Members selected to read it; empty unless the Visibility is Selected people. */
  readonly selectedAccountIds: readonly string[];
  readonly message: string;
  /** What its Giver's Feedback message is bound to. */
  readonly workspaceGoals: readonly BoundWorkspaceGoal[];
  readonly mentions: readonly BoundMention[];
}

/** The request and Ask that Requested Feedback answers. Offered Feedback has neither. */
interface AnsweredAsk {
  readonly feedbackRequestId: string;
  readonly feedbackAskId: string;
}

/**
 * A message from a Giver to a Receiver, always showing the Giver's name (`ADR-0022`). It comes
 * about one of two ways, and the way decides who it is for:
 *
 * - **Requested** — created by the Feedback Request that holds the Ask, through `answering`, so
 *   the Receiver is the Requester by construction: nothing a client sends can address it to
 *   somebody who did not ask. The request is that write's consistency boundary.
 * - **Offered** — given without being asked, through `offer`. Here the Feedback is its own
 *   aggregate root: the Giver names the Receiver, and the rules about who else may read it are
 *   checked here before it exists.
 *
 * The Visibility — with the people it selects — is held on every piece, the request's copied
 * onto its answers: it never changes after sending, so the copy cannot drift, and one piece can
 * be opened without reading the request behind it. The Request message stays on the request: a
 * piece of Feedback carries only its own Feedback message (`ADR-0039`).
 */
export class Feedback {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly answered: AnsweredAsk | null,
    private readonly giverAccountId: string,
    private readonly receiverAccountId: string,
    private readonly visibility: Visibility,
    private readonly message: FeedbackMessage,
    private readonly tags: BoundTags,
  ) {}

  /** Only the Feedback Request calls this, which is why it takes everything already decided. */
  static answering(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly feedbackRequestId: string;
    readonly feedbackAskId: string;
    readonly giverAccountId: string;
    readonly receiverAccountId: string;
    readonly visibility: Visibility;
    readonly message: FeedbackMessage;
    /** What the Giver's answer names. Never the request's: an answer has its own. */
    readonly tags: BoundTags;
  }): Feedback {
    return new Feedback(
      details.id,
      details.workspaceId,
      {
        feedbackRequestId: details.feedbackRequestId,
        feedbackAskId: details.feedbackAskId,
      },
      details.giverAccountId,
      details.receiverAccountId,
      details.visibility,
      details.message,
      details.tags,
    );
  }

  /**
   * The Giver gives the Receiver Feedback without being asked. Every rule holds before it
   * exists: never to yourself, and nobody selected to read it is the Giver or the Receiver, who
   * always read it. What the Visibility itself requires — somebody selected for Selected people,
   * nobody for any other choice — the Visibility checked when it was made.
   */
  static offer(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly giverAccountId: string;
    readonly receiverAccountId: string;
    readonly visibility: Visibility;
    readonly message: FeedbackMessage;
    /** What the Feedback message names. */
    readonly tags: BoundTags;
  }): Feedback {
    if (details.giverAccountId === details.receiverAccountId) {
      throw new CannotGiveYourselfFeedbackError();
    }
    const selected = details.visibility.selectedAccountIds();
    if (selected.includes(details.giverAccountId)) {
      throw new CannotSelectYourselfError();
    }
    if (selected.includes(details.receiverAccountId)) {
      throw new CannotSelectTheReceiverError();
    }
    return new Feedback(
      details.id,
      details.workspaceId,
      null,
      details.giverAccountId,
      details.receiverAccountId,
      details.visibility,
      details.message,
      details.tags,
    );
  }

  snapshot(): FeedbackSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      origin: this.answered ? 'REQUESTED' : 'OFFERED',
      feedbackRequestId: this.answered?.feedbackRequestId ?? null,
      feedbackAskId: this.answered?.feedbackAskId ?? null,
      giverAccountId: this.giverAccountId,
      receiverAccountId: this.receiverAccountId,
      visibility: this.visibility.toString(),
      selectedAccountIds: this.visibility.selectedAccountIds(),
      message: this.message.toString(),
      workspaceGoals: this.tags.workspaceGoals(),
      mentions: this.tags.mentions(),
    };
  }
}
