/**
 * Posting a message into a channel of an external chat tool.
 *
 * It belongs to no business capability, exactly as {@link EmailSender} does: Integrations posts
 * what a Workspace's channel is told, and Notifications will message one person beside it, so a
 * client owned by either module would mean the other reaching in or building a second one
 * (design 0020 D2).
 *
 * An abstract class rather than an interface because it has to survive compilation as a runtime
 * injection token.
 */
export interface ChatChannelPost {
  /**
   * Which chat tool, as the value a Connection stores. A plain string here on purpose: the
   * vocabulary of providers belongs to Integrations, and this contract sits above every module.
   */
  readonly provider: string;
  /** The provider's own id for the channel. Opaque: providers do not agree on a shape. */
  readonly channelId: string;
  /** What the channel is told, as plain text. */
  readonly text: string;
}

export abstract class ChatPoster {
  /**
   * Rejects when the tool refused the message or could not be reached — most often because the
   * bot is no longer in the channel. The caller decides what that means for its own workflow;
   * nothing here knows whether a failed post should fail the request that caused it.
   */
  abstract postToChannel(post: ChatChannelPost): Promise<void>;
}
