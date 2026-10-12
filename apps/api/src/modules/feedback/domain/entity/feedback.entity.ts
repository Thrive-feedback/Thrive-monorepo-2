import type { FeedbackBody } from '../value-object/feedback-body.vo';

export interface FeedbackSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly feedbackRequestId: string;
  readonly feedbackAskId: string;
  readonly giverAccountId: string;
  readonly receiverAccountId: string;
  readonly body: string;
}

/**
 * One Giver's answer to one Ask — a piece of Feedback, from the Giver to the Receiver, always
 * showing the Giver's name (`ADR-0022`).
 *
 * It is created by the Feedback Request that holds the Ask and never on its own, so the
 * Receiver is the Requester by construction rather than by a check: nothing a client sends can
 * address Feedback to somebody who did not ask for it. It is stored in its own table all the
 * same, because #26 and #27 read Feedback with no request in sight — and when #29 brings
 * Feedback given without being asked, this becomes an aggregate root of its own.
 */
export class Feedback {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly feedbackRequestId: string,
    private readonly feedbackAskId: string,
    private readonly giverAccountId: string,
    private readonly receiverAccountId: string,
    private readonly body: FeedbackBody,
  ) {}

  /** Only the Feedback Request calls this, which is why it takes everything already decided. */
  static answering(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly feedbackRequestId: string;
    readonly feedbackAskId: string;
    readonly giverAccountId: string;
    readonly receiverAccountId: string;
    readonly body: FeedbackBody;
  }): Feedback {
    return new Feedback(
      details.id,
      details.workspaceId,
      details.feedbackRequestId,
      details.feedbackAskId,
      details.giverAccountId,
      details.receiverAccountId,
      details.body,
    );
  }

  snapshot(): FeedbackSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      feedbackRequestId: this.feedbackRequestId,
      feedbackAskId: this.feedbackAskId,
      giverAccountId: this.giverAccountId,
      receiverAccountId: this.receiverAccountId,
      body: this.body.toString(),
    };
  }
}
