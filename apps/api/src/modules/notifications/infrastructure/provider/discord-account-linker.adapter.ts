import type { DiscordBotClient } from '@app/infrastructure/chat/discord/discord-bot.client';
import {
  AccountLinker,
  type LinkedIdentity,
} from '../../application/port/account-linker.port';

const AUTHORIZE_URL = 'https://discord.com/oauth2/authorize';

/**
 * `identify` and nothing else: which account this is, and the name to show back. Thrive never
 * asks to read the servers somebody belongs to, their email, or anything it would have no
 * consumer for (design 0021 D9).
 */
const SCOPE = 'identify';

/**
 * The page Discord sends the Member back to. A web route, not an API one: Discord cannot reach
 * the API, which has no public domain, and the session cookie travels on a top-level redirect
 * because it is `sameSite: 'lax'` (design 0021 D10).
 *
 * **Discord refuses any redirect it was not given**, so this exact address has to be registered
 * on Thrive's Discord application for every origin it runs on — the deployed one and
 * `http://localhost:3001`. It is not the one #199 registered, which returns a Workspace install.
 */
const CALLBACK_PATH = '/settings/account/links/discord/callback';

/**
 * Discord's half of linking one person's account: the authorise page and the code exchange.
 * The only implementation of {@link AccountLinker} today; everything Discord does differently
 * from another tool is in this file and in the client it calls.
 */
export class DiscordAccountLinker extends AccountLinker {
  constructor(
    private readonly discordBotClient: DiscordBotClient,
    private readonly clientId: string,
    /** The web app's origin, which is where Discord returns the Member. */
    private readonly webOrigin: string,
  ) {
    super();
  }

  authorizeUrl(state: string): string {
    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPE);
    url.searchParams.set('redirect_uri', this.redirectUri());
    url.searchParams.set('state', state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<LinkedIdentity> {
    const user = await this.discordBotClient.exchangeIdentity(
      code,
      this.redirectUri(),
    );
    return {
      // Discord user ids are global — there is no team to qualify them, so the stored value is
      // `''` and the value object puts it there (design 0021 D8).
      externalUserId: user.id,
      externalUsername: user.username,
    };
  }

  /**
   * Discord checks this against the application's registered redirects, and checks it again on
   * the exchange, so both calls build it from the same place.
   */
  private redirectUri(): string {
    return `${this.webOrigin}${CALLBACK_PATH}`;
  }
}
