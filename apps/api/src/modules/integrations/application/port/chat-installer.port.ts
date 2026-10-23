import type { OfferedChannel } from '../types/connection.types';

/** The space a chat tool says was authorised: a Discord server, a Slack team. */
export interface AuthorizedSpace {
  readonly externalWorkspaceId: string;
  readonly externalWorkspaceName: string;
}

/**
 * Installing Thrive into one chat tool: the page an Admin is sent to, the exchange that says
 * what they authorised, and the channels Thrive may then offer them.
 *
 * One interface, one implementation per provider, chosen by the provider value (design 0020
 * D12). These calls are Integrations' own rather than the application's, because nothing else
 * will ever want them — posting into a channel is the part that belongs to everybody, and that
 * is `ChatPoster` in `shared/application/`.
 */
export abstract class ChatInstaller {
  /**
   * Where the Admin's browser goes to authorise Thrive, carrying `state` so the return can be
   * recognised. It asks for the narrowest rights that work: see the channel, and post in it.
   */
  abstract authorizeUrl(state: string): string;

  /**
   * Trades the authorisation code for the tool's own account of what was authorised. The only
   * authenticated proof of which space it was — never what the browser carried back
   * (design 0020 D6). Rejects when the tool refuses the exchange.
   */
  abstract exchangeCode(code: string): Promise<AuthorizedSpace>;

  /**
   * The text channels of that space, the ones a message can be posted in. Whether the bot may
   * actually post in each is not computed: that is the tool's own permission algebra, and the
   * test message is the proof instead (design 0020 D9).
   */
  abstract listChannels(
    externalWorkspaceId: string,
  ): Promise<readonly OfferedChannel[]>;

  /**
   * Leaves the space, so Thrive is not sitting in a server it no longer serves (#200). Rejects
   * when the tool refuses; the caller decides what that means, and forgetting the Connection is
   * not conditional on the tool agreeing.
   */
  abstract leave(externalWorkspaceId: string): Promise<void>;
}
