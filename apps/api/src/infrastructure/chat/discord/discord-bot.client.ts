import { Logger } from '@nestjs/common';

/** Discord answers in well under a second; a slower answer is a problem, not patience. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Two retries past the first try. */
const MAX_ATTEMPTS = 3;

const RETRY_BASE_DELAY_MS = 250;

/**
 * Retried because the call may still succeed. Every other `4xx` is not: `401`, `403` and `404`
 * mean the bot is gone or unwelcome, and asking again is only load.
 */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

const API_BASE_URL = 'https://discord.com/api/v10';

/** Discord's own channel type for an ordinary text channel. */
const GUILD_TEXT = 0;

/** A Discord id — a snowflake, 17 to 20 digits. Checked before one reaches Discord. */
const SNOWFLAKE = /^\d{17,20}$/;

/** Injected so a test can run the retry path without the delay it is built around. */
export type Wait = (milliseconds: number) => Promise<void>;

const waitWithTimer: Wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/** The server an Admin authorised Thrive into, as Discord itself reported it. */
export interface DiscordGuild {
  readonly id: string;
  readonly name: string;
}

export interface DiscordChannel {
  readonly id: string;
  readonly name: string;
}

/** The person a Member proved they are in Discord, as Discord itself reported it. */
export interface DiscordUser {
  readonly id: string;
  readonly username: string;
}

/**
 * The one authenticated Discord client in Thrive, and the only place that knows Discord exists.
 * Mirrors `infrastructure/email/resend-email-sender.adapter.ts`: a timeout, a capped number of
 * attempts, jittered backoff, and nothing about the credential in a log line (design 0020 §4.6).
 *
 * Thrive's bot credential is application-wide, so this client serves every Workspace. What a
 * Workspace stores is identifiers, which is why no secret is passed in per call.
 */
export class DiscordBotClient {
  private readonly logger = new Logger(DiscordBotClient.name);

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly botToken: string,
    private readonly wait: Wait = waitWithTimer,
  ) {}

  /**
   * Exchanges the authorisation code for Discord's own account of what was authorised, and
   * answers the server from that account — never from the `guild_id` the browser carried back,
   * which anyone can craft (design 0020 D6).
   */
  async exchangeInstall(
    code: string,
    redirectUri: string,
  ): Promise<DiscordGuild> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    const answer = await this.request('oauth2/token', {
      method: 'POST',
      // The application names itself in the body here, so the bot token has no business on
      // this one route — Discord refuses a token request that carries another credential.
      auth: 'application',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const guild = guildOf(answer);
    if (!guild) {
      // Authorising without choosing a server is Discord's to prevent, not ours to guess at.
      throw new Error('Discord authorised no server for this installation');
    }
    return guild;
  }

  /**
   * Exchanges a Member's authorisation code for Discord's own account of **who** they are, and
   * nothing else — the `identify` scope (design 0021 D9).
   *
   * The user access token lives inside this method: it is spent on the one call that needs it
   * and never returned, logged or stored. Thrive messages with its own bot credential, so a
   * stored user token would be a credential with no consumer and a liability with no upside.
   */
  async exchangeIdentity(
    code: string,
    redirectUri: string,
  ): Promise<DiscordUser> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });
    const token = await this.request('oauth2/token', {
      method: 'POST',
      // The application names itself in the body here, so the bot token has no business on
      // this one route — Discord refuses a token request that carries another credential.
      auth: 'application',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const accessToken = accessTokenOf(token);
    if (!accessToken) {
      throw new Error('Discord issued no access token for this link');
    }
    // Asked as the person, not as the bot: the bot's own `users/@me` is the application.
    const user = userOf(
      await this.request('users/@me', {
        method: 'GET',
        auth: 'bearer',
        bearerToken: accessToken,
      }),
    );
    if (!user) {
      throw new Error('Discord did not say which account authorised this link');
    }
    return user;
  }

  /**
   * The server's ordinary text channels. Voice channels and categories are left out; which of
   * the rest the bot may actually post in is not computed here — that is Discord's permission
   * algebra, and the test message is the proof instead (design 0020 D9).
   */
  async listTextChannels(guildId: string): Promise<readonly DiscordChannel[]> {
    const answer = await this.request(
      `guilds/${asSnowflake(guildId)}/channels`,
      { method: 'GET' },
    );
    return channelsOf(answer);
  }

  /**
   * Leaves the server. Discord answers `204` whether or not the bot was still in it, so a
   * Workspace that removed the bot by hand disconnects just as cleanly as one that did not.
   */
  async leaveGuild(guildId: string): Promise<void> {
    await this.request(`users/@me/guilds/${asSnowflake(guildId)}`, {
      method: 'DELETE',
    });
  }

  /**
   * Opens the one-to-one conversation with a person and answers Discord's id for it. Discord
   * returns the same id every time, so a caller may store it and skip this call afterwards.
   *
   * Discord refuses with `403` when the bot shares no server with that person, or when they
   * closed their direct messages. That is an ordinary answer rather than a fault, and asking
   * again cannot change it, which is why `403` is outside the retried statuses.
   *
   * Nothing further is needed to write into the conversation: what comes back is an ordinary
   * channel id, and `postToChannel` posts into it.
   */
  async openDirectChannel(userId: string): Promise<string> {
    const answer = await this.request('users/@me/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: asSnowflake(userId) }),
    });
    const channelId = channelIdOf(answer);
    if (!channelId) {
      throw new Error('Discord opened no conversation with that account');
    }
    return channelId;
  }

  async postToChannel(channelId: string, text: string): Promise<void> {
    await this.request(`channels/${asSnowflake(channelId)}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });
  }

  private async request(path: string, init: DiscordRequest): Promise<unknown> {
    for (let attempt = 1; ; attempt += 1) {
      const result = await this.attempt(path, init);

      if (result.ok) {
        return result.body;
      }
      if (!result.retryable || attempt === MAX_ATTEMPTS) {
        // The one record of why. The path and the status only: a header would carry the
        // credential, and Discord's message quotes what was sent.
        this.logger.warn({
          event: 'chat.request_failed',
          provider: 'DISCORD',
          path,
          status: result.status,
          attempts: attempt,
        });
        throw new Error(
          `Discord did not accept the request to ${path} (status ${
            result.status ?? 'none'
          })`,
        );
      }
      await this.wait(result.retryAfterMs ?? backoffFor(attempt));
    }
  }

  private async attempt(path: string, init: DiscordRequest): Promise<Attempt> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/${path}`, {
        method: init.method,
        headers: {
          ...authorizationFor(init, this.botToken),
          ...init.headers,
        },
        body: init.body,
        // Not an SSRF guard — there is no person-supplied URL here — just a refusal to follow
        // Discord somewhere this client did not mean to go.
        redirect: 'manual',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      // Timed out or never arrived; either may succeed on the next attempt.
      return { ok: false, retryable: true };
    }

    if (response.ok) {
      return { ok: true, body: await readJson(response) };
    }
    return {
      ok: false,
      retryable: RETRYABLE_STATUSES.has(response.status),
      status: response.status,
      retryAfterMs: retryAfterOf(response),
    };
  }
}

interface DiscordRequest {
  readonly method: string;
  /**
   * `application` for the token route, which authenticates by its own body; `bearer` for the
   * one call made **as the person** who just authorised, rather than as Thrive's bot.
   */
  readonly auth?: 'bot' | 'application' | 'bearer';
  /** Required by `bearer` and meaningless otherwise. Never logged: it is that person's token. */
  readonly bearerToken?: string;
  readonly headers?: Record<string, string>;
  readonly body?: BodyInit;
}

function authorizationFor(
  init: DiscordRequest,
  botToken: string,
): Record<string, string> {
  if (init.auth === 'application') {
    return {};
  }
  if (init.auth === 'bearer') {
    return { Authorization: `Bearer ${init.bearerToken ?? ''}` };
  }
  return { Authorization: `Bot ${botToken}` };
}

function accessTokenOf(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null) {
    return null;
  }
  const { access_token: accessToken } = answer as Record<string, unknown>;
  return typeof accessToken === 'string' && accessToken.length > 0
    ? accessToken
    : null;
}

function userOf(answer: unknown): DiscordUser | null {
  if (typeof answer !== 'object' || answer === null) {
    return null;
  }
  const { id, username } = answer as Record<string, unknown>;
  return typeof id === 'string' && typeof username === 'string'
    ? { id, username }
    : null;
}

interface Attempt {
  readonly ok: boolean;
  readonly body?: unknown;
  readonly retryable?: boolean;
  readonly status?: number;
  readonly retryAfterMs?: number;
}

/**
 * Discord rate-limits per route and says for how long. Waiting what it asks is the difference
 * between backing off and being refused again.
 */
function retryAfterOf(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  const seconds = header === null ? Number.NaN : Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    // A 204 carries no body, and nothing reads the answer to a post.
    return undefined;
  }
}

function guildOf(answer: unknown): DiscordGuild | null {
  if (typeof answer !== 'object' || answer === null || !('guild' in answer)) {
    return null;
  }
  const { guild } = answer as { guild: unknown };
  if (typeof guild !== 'object' || guild === null) {
    return null;
  }
  const { id, name } = guild as Record<string, unknown>;
  return typeof id === 'string' && typeof name === 'string'
    ? { id, name }
    : null;
}

function channelIdOf(answer: unknown): string | null {
  if (typeof answer !== 'object' || answer === null) {
    return null;
  }
  const { id } = answer as Record<string, unknown>;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function channelsOf(answer: unknown): readonly DiscordChannel[] {
  if (!Array.isArray(answer)) {
    return [];
  }
  return answer.flatMap((entry: unknown) => {
    if (typeof entry !== 'object' || entry === null) {
      return [];
    }
    const { id, name, type } = entry as Record<string, unknown>;
    return typeof id === 'string' &&
      typeof name === 'string' &&
      type === GUILD_TEXT
      ? [{ id, name }]
      : [];
  });
}

/** Jittered so several calls refused at once do not retry in lockstep. */
function backoffFor(attempt: number): number {
  const exponential = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  return exponential + Math.random() * exponential;
}

/**
 * An id reaches here from a Connection, from a Linked Account, or from something a person chose
 * on screen, and goes straight into a URL path or a request body. Anything but a snowflake is
 * refused before the call is made.
 */
function asSnowflake(id: string): string {
  if (!SNOWFLAKE.test(id)) {
    throw new Error('Not a Discord id');
  }
  return id;
}
