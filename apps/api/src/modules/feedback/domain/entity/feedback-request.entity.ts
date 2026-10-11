import {
  CannotAskYourselfError,
  GiverAlreadyAskedError,
  NoGiversToAskError,
} from '../feedback-request.errors';
import { Topic } from '../value-object/topic.vo';
import { Visibility } from '../value-object/visibility.vo';
import { FeedbackAsk, type FeedbackAskSnapshot } from './feedback-ask.entity';

export interface FeedbackRequestSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly requesterAccountId: string;
  readonly topic: string;
  readonly visibility: string;
  readonly asks: readonly FeedbackAskSnapshot[];
}

/** One Member to ask, with the id their Ask will carry. */
export interface GiverToAsk {
  readonly askId: string;
  readonly giverAccountId: string;
}

/**
 * A Member asking other Members for Feedback on a Topic. It is the consistency boundary: its
 * Asks are created and changed through it and never on their own, because "who has already
 * been asked" is a rule about the request rather than about one Ask.
 *
 * The Workspace and the people are held as ids with no reference into Workspace's tables:
 * Feedback owns neither, and a module never joins or migrates across another's tables.
 */
export class FeedbackRequest {
  private constructor(
    private readonly id: string,
    private readonly workspaceId: string,
    private readonly requesterAccountId: string,
    private readonly topic: Topic,
    private readonly visibility: Visibility,
    private readonly asks: readonly FeedbackAsk[],
  ) {}

  /**
   * The Requester sends the request: a Topic and one Ask per Member asked. Every rule holds
   * before it exists — at least one Giver, never the Requester, never the same Giver twice —
   * so there is no half-built request to save.
   */
  static send(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly requesterAccountId: string;
    readonly topic: Topic;
    readonly visibility: Visibility;
    readonly givers: readonly GiverToAsk[];
  }): FeedbackRequest {
    if (details.givers.length === 0) {
      throw new NoGiversToAskError();
    }
    const asked = new Set<string>();
    for (const giver of details.givers) {
      if (giver.giverAccountId === details.requesterAccountId) {
        throw new CannotAskYourselfError();
      }
      if (asked.has(giver.giverAccountId)) {
        throw new GiverAlreadyAskedError();
      }
      asked.add(giver.giverAccountId);
    }
    return new FeedbackRequest(
      details.id,
      details.workspaceId,
      details.requesterAccountId,
      details.topic,
      details.visibility,
      details.givers.map((giver) =>
        FeedbackAsk.open({
          id: giver.askId,
          giverAccountId: giver.giverAccountId,
        }),
      ),
    );
  }

  /**
   * Rebuilds a stored request with its Asks.
   *
   * Deliberately does not re-check what `send` checked. A stored row was valid when it was
   * written, and the rules will change — more Givers per request, a chosen Visibility — so a
   * load enforcing today's rules would refuse to read yesterday's rows. The checks stay where
   * the aggregate is created, and the store holds the one invariant it can: a unique index on
   * `(feedbackRequestId, giverAccountId)`.
   */
  static restore(snapshot: FeedbackRequestSnapshot): FeedbackRequest {
    return new FeedbackRequest(
      snapshot.id,
      snapshot.workspaceId,
      snapshot.requesterAccountId,
      Topic.of(snapshot.topic),
      Visibility.of(snapshot.visibility),
      snapshot.asks.map((ask) => FeedbackAsk.restore(ask)),
    );
  }

  snapshot(): FeedbackRequestSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      requesterAccountId: this.requesterAccountId,
      topic: this.topic.toString(),
      visibility: this.visibility.toString(),
      asks: this.asks.map((ask) => ask.snapshot()),
    };
  }
}
