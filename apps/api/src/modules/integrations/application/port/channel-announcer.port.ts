/** What every announcement carries: which Workspace it belongs to, and who wrote the thing. */
interface WorkspaceEvent {
  readonly workspaceId: string;
  /** The Member who wrote it. Named in the post. */
  readonly giverAccountId: string;
}

export interface FeedbackPublished extends WorkspaceEvent {
  /** Everyone it was written to. One post names them all (ADR 0061). */
  readonly receiverAccountIds: readonly string[];
  /** The Feedback the link opens. **None of its words travel with this** — brain `ADR-0040`. */
  readonly feedbackId: string;
}

export interface KudosGiven extends WorkspaceEvent {
  /** Everyone the Kudos is for: the Members its message @mentions, less the Giver. */
  readonly recipientAccountIds: readonly string[];
  /**
   * What the Giver wrote, and it **is** posted — unlike a Feedback message. A Kudos has no
   * Visibility, so its words are already readable by every Member, and a Kudos without them is a
   * notification that praise happened somewhere else (brain `ADR-0045`).
   */
  readonly message: string;
  readonly kudosId: string;
}

/**
 * Telling a Workspace's connected chat channel that something happened in the open.
 *
 * **Published.** Feedback calls it after its own transaction commits and never learns whether a
 * Workspace has connected anything at all. Which tool, which channel, and whether there is one, are
 * this module's business — brain `ADR-0035` §9: Integrations owns the connection to the chat tool
 * and what the channel is told, where Notifications owns what one person is told and when.
 *
 * **Who decides what.** Feedback decides what is public: `feedbackPublished` means *this Feedback
 * was shown to the whole Workspace*, and it is called for nothing else. This module decides what a
 * room is then told, which is deliberately less than a direct message may say.
 *
 * **Nothing a person does may fail because a channel is unreachable.** Every method resolves rather
 * than rejecting; a refused post is logged once and forgotten (`ADR-0035` §8). There is no delivery
 * state and no retry — `BE_17` is `todo`, and the thing being announced has already committed.
 */
export abstract class ChannelAnnouncerPort {
  /**
   * Feedback somebody chose to show every Member. Never called for *Only me* or *Selected
   * people*, and never for a Feedback Request.
   */
  abstract feedbackPublished(event: FeedbackPublished): Promise<void>;

  abstract kudosGiven(event: KudosGiven): Promise<void>;
}
