import type { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import {
  type AuthorizedSpace,
  ChatInstaller,
} from '../../application/port/chat-installer.port';
import type { OfferedChannel } from '../../application/types/connection.types';

const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

/**
 * `VIEW_CHANNEL` (1 << 10) plus `SEND_MESSAGES` (1 << 11) and nothing else — see the chosen
 * channel, and post in it (#199 AC 2).
 */
const PERMISSIONS = String((1 << 10) | (1 << 11));

/**
 * The page Discord sends the Admin back to. A web route, not an API one: Discord cannot reach
 * the API, which has no public domain, and the session cookie travels on a top-level redirect
 * because it is `sameSite: 'lax'` (design 0020 D4).
 */
const CALLBACK_PATH = '/settings/workspace/integrations/discord/callback';

/**
 * Discord's half of installing Thrive: the authorise page, the code exchange, and the server's
 * text channels. The only implementation of {@link ChatInstaller} today; everything Discord
 * does differently from another tool is in this file and in the client it calls.
 */
export class DiscordChatInstaller extends ChatInstaller {
  constructor(
    private readonly discordBotClient: DiscordBotClient,
    private readonly clientId: string,
    /** The web app's origin, which is where Discord returns the Admin. */
    private readonly webOrigin: string,
  ) {
    super();
  }

  authorizeUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('response_type', 'code');
    // `bot` asks to add the application to a server; `permissions` is what it may then do.
    url.searchParams.set('scope', 'bot');
    url.searchParams.set('permissions', PERMISSIONS);
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<AuthorizedSpace> {
    const guild = await this.discordBotClient.exchangeInstall(
      code,
      this.redirectUri(),
    );
    return {
      externalWorkspaceId: guild.id,
      externalWorkspaceName: guild.name,
    };
  }

  async listChannels(
    externalWorkspaceId: string,
  ): Promise<readonly OfferedChannel[]> {
    return this.discordBotClient.listTextChannels(externalWorkspaceId);
  }

  async leave(externalWorkspaceId: string): Promise<void> {
    await this.discordBotClient.leaveGuild(externalWorkspaceId);
  }

  /**
   * Discord checks this against the application's registered redirect, and checks it again on
   * the exchange, so both calls build it from the same place.
   */
  private redirectUri(): string {
    return `${this.webOrigin}${CALLBACK_PATH}`;
  }
}
