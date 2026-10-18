import {
  type ChatChannelPost,
  ChatPoster,
} from '@app/shared/application/chat-poster.port';

/** What one chat tool's client has to do for a channel to be posted in. */
export interface ChannelPoster {
  postToChannel(channelId: string, text: string): Promise<void>;
}

/**
 * Sends a post to the client of the tool it names. One entry today — Discord — and a second
 * provider is a second entry rather than a change here (design 0020 D12).
 *
 * An unknown provider is a programming error, not a refusal a caller can act on: every value
 * that reaches here has already been checked against the providers Integrations supports.
 */
export class RegistryChatPoster extends ChatPoster {
  constructor(
    private readonly posters: Readonly<Record<string, ChannelPoster>>,
  ) {
    super();
  }

  async postToChannel(post: ChatChannelPost): Promise<void> {
    const poster = this.posters[post.provider];
    if (!poster) {
      throw new Error(`No chat client is registered for ${post.provider}`);
    }
    await poster.postToChannel(post.channelId, post.text);
  }
}
