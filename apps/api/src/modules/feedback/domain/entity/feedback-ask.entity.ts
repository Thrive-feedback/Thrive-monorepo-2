import { AskStatus } from '../value-object/ask-status.vo';

export interface FeedbackAskSnapshot {
  readonly id: string;
  readonly giverAccountId: string;
  readonly status: string;
}

/**
 * One Member being asked, inside a Feedback Request. It lives and changes only through the
 * request that holds it, which is why it has no repository of its own.
 */
export class FeedbackAsk {
  private constructor(
    private readonly id: string,
    private readonly giverAccountId: string,
    private readonly status: AskStatus,
  ) {}

  /** A new Ask, waiting on its Giver. */
  static open(details: {
    readonly id: string;
    readonly giverAccountId: string;
  }): FeedbackAsk {
    return new FeedbackAsk(
      details.id,
      details.giverAccountId,
      AskStatus.Pending,
    );
  }

  /** Rebuilds a stored Ask. */
  static restore(snapshot: FeedbackAskSnapshot): FeedbackAsk {
    return new FeedbackAsk(
      snapshot.id,
      snapshot.giverAccountId,
      AskStatus.of(snapshot.status),
    );
  }

  hasId(askId: string): boolean {
    return this.id === askId;
  }

  isFor(accountId: string): boolean {
    return this.giverAccountId === accountId;
  }

  /** The same Ask, answered. Refuses a second answer, because the first one is final. */
  answer(): FeedbackAsk {
    return new FeedbackAsk(
      this.id,
      this.giverAccountId,
      this.status.answered(),
    );
  }

  snapshot(): FeedbackAskSnapshot {
    return {
      id: this.id,
      giverAccountId: this.giverAccountId,
      status: this.status.toString(),
    };
  }
}
