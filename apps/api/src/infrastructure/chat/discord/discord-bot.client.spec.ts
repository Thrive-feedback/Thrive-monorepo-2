import { afterEach, describe, expect, it } from 'bun:test';
import { DiscordBotClient } from './discord-bot.client';

const CLIENT_ID = '100000000000000001';
const CLIENT_SECRET = 'a-discord-client-secret';
const BOT_TOKEN = 'a-discord-bot-token';
const GUILD_ID = '200000000000000002';
const CHANNEL_ID = '300000000000000003';
const MEMBER_USER_ID = '500000000000000005';
const DIRECT_CHANNEL_ID = '600000000000000006';
const REDIRECT_URI = 'https://thriveteam.app/settings/workspace/x/callback';

const realFetch = globalThis.fetch;

interface Call {
  readonly url: string;
  readonly init: RequestInit;
}

type Answer =
  | {
      readonly status: number;
      readonly body?: unknown;
      readonly retryAfter?: string;
    }
  | 'unreachable';

function stubDiscord(...answers: Answer[]): Call[] {
  const calls: Call[] = [];
  let call = 0;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const answer = answers[Math.min(call, answers.length - 1)];
    call += 1;
    if (answer === 'unreachable' || answer === undefined) {
      throw new Error('socket closed');
    }
    return new Response(JSON.stringify(answer.body ?? {}), {
      status: answer.status,
      headers: {
        'Content-Type': 'application/json',
        ...(answer.retryAfter ? { 'Retry-After': answer.retryAfter } : {}),
      },
    });
  }) as typeof fetch;
  return calls;
}

/** The waits are recorded instead of taken, so a test does not sit out the backoff. */
function clientUnderTest(): {
  client: DiscordBotClient;
  waits: number[];
} {
  const waits: number[] = [];
  const client = new DiscordBotClient(
    CLIENT_ID,
    CLIENT_SECRET,
    BOT_TOKEN,
    async (milliseconds) => {
      waits.push(milliseconds);
    },
  );
  return { client, waits };
}

function callAt(calls: Call[], index: number): Call {
  const call = calls[index];
  if (call === undefined) {
    throw new Error(`Discord was not asked a ${index + 1}th time.`);
  }
  return call;
}

function headerOf(call: Call, name: string): string | undefined {
  return Object.fromEntries(Object.entries(call.init.headers ?? {}))[name];
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('reading what an Admin authorised', () => {
  it('answers the server Discord itself named in the exchange', async () => {
    stubDiscord({
      status: 200,
      body: { guild: { id: GUILD_ID, name: 'Acme HQ' } },
    });
    const { client } = clientUnderTest();

    expect(await client.exchangeInstall('a-code', REDIRECT_URI)).toEqual({
      id: GUILD_ID,
      name: 'Acme HQ',
    });
  });

  it('refuses an exchange that authorised no server, rather than guessing one', async () => {
    stubDiscord({ status: 200, body: { access_token: 'ignored' } });
    const { client } = clientUnderTest();

    await expect(
      client.exchangeInstall('a-code', REDIRECT_URI),
    ).rejects.toThrow();
  });

  it('names the application in the body and carries no bot credential on that one route', async () => {
    const calls = stubDiscord({
      status: 200,
      body: { guild: { id: GUILD_ID, name: 'Acme HQ' } },
    });
    const { client } = clientUnderTest();

    await client.exchangeInstall('a-code', REDIRECT_URI);

    const call = callAt(calls, 0);
    expect(headerOf(call, 'Authorization')).toBeUndefined();
    expect(String(call.init.body)).toContain(`client_id=${CLIENT_ID}`);
    expect(String(call.init.body)).toContain(
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
    );
  });
});

describe('offering the channels of a server', () => {
  it('offers text channels only — not voice channels, not categories', async () => {
    stubDiscord({
      status: 200,
      body: [
        { id: '400000000000000001', name: 'general', type: 0 },
        { id: '400000000000000002', name: 'Voice chat', type: 2 },
        { id: '400000000000000003', name: 'A category', type: 4 },
        { id: '400000000000000004', name: 'standups', type: 0 },
      ],
    });
    const { client } = clientUnderTest();

    expect(await client.listTextChannels(GUILD_ID)).toEqual([
      { id: '400000000000000001', name: 'general' },
      { id: '400000000000000004', name: 'standups' },
    ]);
  });

  it('refuses an id that is not a Discord id, before it reaches a URL', async () => {
    const calls = stubDiscord({ status: 200, body: [] });
    const { client } = clientUnderTest();

    await expect(
      client.listTextChannels('../../channels/evil'),
    ).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('authorises the read as the bot', async () => {
    const calls = stubDiscord({ status: 200, body: [] });
    const { client } = clientUnderTest();

    await client.listTextChannels(GUILD_ID);

    expect(headerOf(callAt(calls, 0), 'Authorization')).toBe(
      `Bot ${BOT_TOKEN}`,
    );
  });
});

describe('when Discord does not answer the first time', () => {
  it('tries three times in all, and gives up rather than hammering', async () => {
    const calls = stubDiscord({ status: 503 });
    const { client } = clientUnderTest();

    await expect(client.postToChannel(CHANNEL_ID, 'Hello')).rejects.toThrow();
    expect(calls).toHaveLength(3);
  });

  it('succeeds on a later attempt without the caller knowing', async () => {
    const calls = stubDiscord({ status: 503 }, { status: 200 });
    const { client } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Hello');

    expect(calls).toHaveLength(2);
  });

  it('asks once when Discord says the bot is unwelcome, because asking again is only load', async () => {
    const calls = stubDiscord({ status: 403 });
    const { client } = clientUnderTest();

    await expect(client.postToChannel(CHANNEL_ID, 'Hello')).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });

  it('waits as long as Discord asked when it is rate-limiting', async () => {
    stubDiscord({ status: 429, retryAfter: '2' }, { status: 200 });
    const { client, waits } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Hello');

    expect(waits).toEqual([2000]);
  });

  it('backs off on its own when Discord says nothing about how long', async () => {
    stubDiscord({ status: 500 }, { status: 200 });
    const { client, waits } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Hello');

    expect(waits).toHaveLength(1);
    expect(waits[0]).toBeGreaterThan(0);
  });

  it('retries a request that never arrived', async () => {
    const calls = stubDiscord('unreachable', { status: 200 });
    const { client } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Hello');

    expect(calls).toHaveLength(2);
  });

  it('never says what it was refused about, so no credential reaches a message', async () => {
    stubDiscord({ status: 401 });
    const { client } = clientUnderTest();

    const refusal = await client
      .postToChannel(CHANNEL_ID, 'Hello')
      .catch((error: Error) => error);

    expect(String(refusal)).not.toContain(BOT_TOKEN);
    expect(String(refusal)).not.toContain(CLIENT_SECRET);
  });
});

describe('leaving a server', () => {
  it('asks Discord to remove the bot from that server', async () => {
    const calls = stubDiscord({ status: 204 });
    const { client } = clientUnderTest();

    await client.leaveGuild(GUILD_ID);

    const call = callAt(calls, 0);
    expect(call.url).toContain(`/users/@me/guilds/${GUILD_ID}`);
    expect(call.init.method).toBe('DELETE');
  });

  it('refuses a server id that is not a Discord id, before it reaches a URL', async () => {
    const calls = stubDiscord({ status: 204 });
    const { client } = clientUnderTest();

    await expect(client.leaveGuild('../../users/@me')).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('is content when Discord says the bot was not there anyway', async () => {
    stubDiscord({ status: 204 });
    const { client } = clientUnderTest();

    expect(await client.leaveGuild(GUILD_ID)).toBeUndefined();
  });
});

describe('opening a one-to-one conversation', () => {
  it('answers the channel id Discord opened for that person', async () => {
    stubDiscord({ status: 200, body: { id: DIRECT_CHANNEL_ID } });
    const { client } = clientUnderTest();

    expect(await client.openDirectChannel(MEMBER_USER_ID)).toBe(
      DIRECT_CHANNEL_ID,
    );
  });

  it('names the person as the recipient, as the bot', async () => {
    const calls = stubDiscord({ status: 200, body: { id: DIRECT_CHANNEL_ID } });
    const { client } = clientUnderTest();

    await client.openDirectChannel(MEMBER_USER_ID);

    const call = callAt(calls, 0);
    expect(call.url).toContain('/users/@me/channels');
    expect(call.init.method).toBe('POST');
    expect(JSON.parse(String(call.init.body))).toEqual({
      recipient_id: MEMBER_USER_ID,
    });
    expect(headerOf(call, 'Authorization')).toBe(`Bot ${BOT_TOKEN}`);
  });

  it('refuses an account id that is not a Discord id, before it reaches Discord', async () => {
    const calls = stubDiscord({ status: 200, body: { id: DIRECT_CHANNEL_ID } });
    const { client } = clientUnderTest();

    await expect(client.openDirectChannel('not-a-snowflake')).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });

  it('refuses an answer that names no conversation, rather than reading past it', async () => {
    stubDiscord({ status: 200, body: { recipients: [] } });
    const { client } = clientUnderTest();

    const refusal = await client
      .openDirectChannel(MEMBER_USER_ID)
      .catch((error: unknown) => error);

    expect(refusal).toBeInstanceOf(Error);
    expect(refusal).not.toBeInstanceOf(TypeError);
  });

  it('refuses an answer whose conversation id is not a string', async () => {
    stubDiscord({ status: 200, body: { id: Number(DIRECT_CHANNEL_ID) } });
    const { client } = clientUnderTest();

    const refusal = await client
      .openDirectChannel(MEMBER_USER_ID)
      .catch((error: unknown) => error);

    expect(refusal).toBeInstanceOf(Error);
    expect(refusal).not.toBeInstanceOf(TypeError);
  });

  it('asks once when the bot shares no server with that person, because asking again cannot change it', async () => {
    const calls = stubDiscord({ status: 403 });
    const { client } = clientUnderTest();

    await expect(client.openDirectChannel(MEMBER_USER_ID)).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });

  it('waits as long as Discord asked when it is rate-limiting, then opens the conversation', async () => {
    stubDiscord(
      { status: 429, retryAfter: '2' },
      { status: 200, body: { id: DIRECT_CHANNEL_ID } },
    );
    const { client, waits } = clientUnderTest();

    expect(await client.openDirectChannel(MEMBER_USER_ID)).toBe(
      DIRECT_CHANNEL_ID,
    );
    expect(waits).toEqual([2000]);
  });

  it('says nothing about the credential when Discord refuses', async () => {
    stubDiscord({ status: 403 });
    const { client } = clientUnderTest();

    const refusal = await client
      .openDirectChannel(MEMBER_USER_ID)
      .catch((error: Error) => error);

    expect(String(refusal)).not.toContain(BOT_TOKEN);
    expect(String(refusal)).not.toContain(CLIENT_SECRET);
  });

  it('is written into by the same post as any other channel', async () => {
    const calls = stubDiscord({ status: 200 });
    const { client } = clientUnderTest();

    await client.postToChannel(
      DIRECT_CHANNEL_ID,
      'Someone asked you for Feedback',
    );

    const call = callAt(calls, 0);
    expect(call.url).toContain(`/channels/${DIRECT_CHANNEL_ID}/messages`);
    expect(JSON.parse(String(call.init.body))).toEqual({
      content: 'Someone asked you for Feedback',
      allowed_mentions: { parse: [] },
    });
  });
});

describe('posting into a channel', () => {
  it('sends the message as its content, and nothing else', async () => {
    const calls = stubDiscord({ status: 200 });
    const { client } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Thrive is connected');

    const call = callAt(calls, 0);
    expect(call.url).toContain(`/channels/${CHANNEL_ID}/messages`);
    expect(JSON.parse(String(call.init.body))).toEqual({
      content: 'Thrive is connected',
      allowed_mentions: { parse: [] },
    });
  });

  it('lets nothing in the message notify anybody', async () => {
    const calls = stubDiscord({ status: 200 });
    const { client } = clientUnderTest();

    // A Kudos carries what a Member wrote and both post shapes carry Display names, which are
    // free text. Without this, somebody could notify a whole server — guests included — by
    // typing it into a Kudos or into their own name.
    await client.postToChannel(CHANNEL_ID, '@everyone look at this');

    const body = JSON.parse(String(callAt(calls, 0).init.body));
    expect(body.content).toBe('@everyone look at this');
    expect(body.allowed_mentions).toEqual({ parse: [] });
  });

  it('does not follow Discord anywhere it did not mean to go', async () => {
    const calls = stubDiscord({ status: 200 });
    const { client } = clientUnderTest();

    await client.postToChannel(CHANNEL_ID, 'Hello');

    expect(callAt(calls, 0).init.redirect).toBe('manual');
  });
});
