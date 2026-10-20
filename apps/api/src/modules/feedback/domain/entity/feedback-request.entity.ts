import {
  CannotAskYourselfError,
  CannotSelectYourselfError,
  GiverAlreadyAskedError,
  NoGiversToAskError,
} from '../feedback-request.errors';
import {
  type BoundMention,
  BoundTags,
  type BoundWorkspaceGoal,
} from '../value-object/bound-tags.vo';
import type { FeedbackBody } from '../value-object/feedback-body.vo';
import { Topic } from '../value-object/topic.vo';
import { Visibility } from '../value-object/visibility.vo';
import { Feedback } from './feedback.entity';
import { FeedbackAsk, type FeedbackAskSnapshot } from './feedback-ask.entity';

export interface FeedbackRequestSnapshot {
  readonly id: string;
  readonly workspaceId: string;
  readonly requesterAccountId: string;
  readonly topic: string;
  readonly visibility: string;
  /** The Members the Requester selected; empty unless the Visibility is Selected people. */
  readonly selectedAccountIds: readonly string[];
  /** What the Topic is bound to. Its answers carry their own, never these. */
  readonly workspaceGoals: readonly BoundWorkspaceGoal[];
  readonly mentions: readonly BoundMention[];
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
    private readonly tags: BoundTags,
    private asks: readonly FeedbackAsk[],
  ) {}

  /**
   * The Requester sends the request: a Topic, who besides them may read the answers, and one
   * Ask per Member asked. Every rule holds before it exists — at least one Giver, never the
   * Requester, never the same Giver twice, and the Requester not among the people they select —
   * so there is no half-built request to save.
   */
  static send(details: {
    readonly id: string;
    readonly workspaceId: string;
    readonly requesterAccountId: string;
    readonly topic: Topic;
    readonly visibility: Visibility;
    /** What the Topic names. */
    readonly tags: BoundTags;
    readonly givers: readonly GiverToAsk[];
  }): FeedbackRequest {
    if (details.givers.length === 0) {
      throw new NoGiversToAskError();
    }
    if (
      details.visibility
        .selectedAccountIds()
        .includes(details.requesterAccountId)
    ) {
      throw new CannotSelectYourselfError();
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
      details.tags,
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
   * written, and the rules will change — more Givers per request, for one — so a load enforcing
   * today's rules would refuse to read yesterday's rows. The checks stay where the aggregate is
   * created, and the store holds the one invariant it can: a unique index on
   * `(feedbackRequestId, giverAccountId)`. Only the Topic and the Visibility are rebuilt through
   * their own factories, because a value that fails those is not a value at all.
   */
  static restore(snapshot: FeedbackRequestSnapshot): FeedbackRequest {
    return new FeedbackRequest(
      snapshot.id,
      snapshot.workspaceId,
      snapshot.requesterAccountId,
      Topic.of(snapshot.topic),
      Visibility.of({
        value: snapshot.visibility,
        selectedAccountIds: snapshot.selectedAccountIds,
      }),
      BoundTags.of(snapshot),
      snapshot.asks.map((ask) => FeedbackAsk.restore(ask)),
    );
  }

  /**
   * The Giver answers their Ask: the Ask becomes Answered and the Feedback it collected comes
   * back, addressed to the Requester. Both happen here because "this Ask is answered once" is
   * a rule about the request, not about one Ask — which is why the request is the consistency
   * boundary and the Feedback is written in the same transaction.
   *
   * `null` when the request holds no such Ask for that Giver. It is not this aggregate's place
   * to decide what a caller is told about an Ask that is not theirs; the use case answers that
   * the same way every scoped read does.
   */
  answerAsk(details: {
    readonly askId: string;
    readonly giverAccountId: string;
    readonly feedbackId: string;
    readonly body: FeedbackBody;
    /** What the answer names. */
    readonly tags: BoundTags;
  }): Feedback | null {
    const asked = this.asks.find(
      (ask) => ask.hasId(details.askId) && ask.isFor(details.giverAccountId),
    );
    if (!asked) {
      return null;
    }
    const answered = asked.answer();
    this.asks = this.asks.map((ask) => (ask === asked ? answered : ask));
    return Feedback.answering({
      id: details.feedbackId,
      workspaceId: this.workspaceId,
      feedbackRequestId: this.id,
      feedbackAskId: details.askId,
      giverAccountId: details.giverAccountId,
      // The Requester asked, so the Requester is who the answer is for. Never a client's word.
      receiverAccountId: this.requesterAccountId,
      topic: this.topic,
      visibility: this.visibility,
      body: details.body,
      tags: details.tags,
    });
  }

  snapshot(): FeedbackRequestSnapshot {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      requesterAccountId: this.requesterAccountId,
      topic: this.topic.toString(),
      visibility: this.visibility.toString(),
      selectedAccountIds: this.visibility.selectedAccountIds(),
      workspaceGoals: this.tags.workspaceGoals(),
      mentions: this.tags.mentions(),
      asks: this.asks.map((ask) => ask.snapshot()),
    };
  }
}
