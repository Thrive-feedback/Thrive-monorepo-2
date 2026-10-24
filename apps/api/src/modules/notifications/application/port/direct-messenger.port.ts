/** Where a one-to-one conversation with somebody lives, in one chat tool. */
export interface DirectConversation {
  /** The tool's own id for the conversation, learned once and reused (design 0021 D4). */
  readonly channelId: string;
}

/**
 * Messaging one person in one chat tool: opening the conversation, and writing in it.
 *
 * Separate from {@link AccountLinker} on purpose, and for the reason the application already
 * keeps `ChatInstaller` and `ChatPoster` apart: linking proves who somebody is and happens once,
 * messaging happens continually and has a different caller. One interface, one implementation
 * per provider, chosen by the stored provider value (design 0021 D3).
 */
export abstract class DirectMessenger {
  /**
   * Opens — or re-opens — the one-to-one conversation with somebody.
   *
   * **Rejects for ordinary reasons, not only broken ones:** a chat tool refuses to let an app
   * start a conversation with somebody it shares no space with, and a person may close their
   * messages. Both are a normal "cannot reach this person", which the caller logs once and
   * skips (`ADR-0035` §8).
   */
  abstract openConversation(
    externalUserId: string,
  ): Promise<DirectConversation>;

  /** Writes in a conversation already opened. Rejects if the tool refused the message. */
  abstract postDirect(channelId: string, text: string): Promise<void>;
}
