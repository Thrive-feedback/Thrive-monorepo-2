import { afterEach, describe, expect, it } from 'bun:test';
import type { AiCompletion } from '@app/shared/application/ai-completer.port';
import { OpenAiCompatibleAiCompleter } from './openai-compatible-ai-completer.adapter';

const BASE_URL = 'https://models.thrive.example/v1';
const MODEL = 'a-model';

function aCompletion(overrides: Partial<AiCompletion> = {}): AiCompletion {
  return {
    system: 'Answer from the messages and invent nothing.',
    prompt: '<msg id="1">Ann explains things clearly</msg>',
    answerSchema: {
      type: 'object',
      properties: { points: { type: 'array', items: { type: 'string' } } },
      required: ['points'],
      additionalProperties: false,
    },
    maxAnswerTokens: 1_600,
    ...overrides,
  };
}

/** What a provider sends back when it answered: one choice that stopped on its own. */
function anAnswer(content: unknown, finishReason = 'stop'): string {
  return JSON.stringify({
    choices: [
      {
        finish_reason: finishReason,
        message: { content: JSON.stringify(content) },
      },
    ],
  });
}

const realFetch = globalThis.fetch;

type StubbedAnswer = number | 'unreachable' | { body: string };

function stubProvider(
  ...answers: StubbedAnswer[]
): { url: string; init: RequestInit }[] {
  const calls: { url: string; init: RequestInit }[] = [];
  let call = 0;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const answer = answers[Math.min(call, answers.length - 1)] ?? 500;
    call += 1;
    if (answer === 'unreachable') {
      throw new Error('socket closed');
    }
    if (typeof answer === 'number') {
      return new Response('{"error":{"type":"rate_limit"}}', {
        status: answer,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(answer.body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;
  return calls;
}

/** The retry delay is removed so a test does not wait it out. */
function completerUnderTest(): OpenAiCompatibleAiCompleter {
  return new OpenAiCompatibleAiCompleter(
    BASE_URL,
    'ai-provider-key',
    MODEL,
    'A_PROVIDER',
    async () => undefined,
  );
}

function bodyOf(
  calls: { init: RequestInit }[],
  index: number,
): Record<string, unknown> {
  const call = calls[index];
  if (call === undefined) {
    throw new Error(`The provider was not asked a ${index + 1}th time.`);
  }
  return JSON.parse(String(call.init.body));
}

function headerOf(call: { init: RequestInit }, name: string): string {
  return Object.fromEntries(Object.entries(call.init.headers ?? {}))[name];
}

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('asking a model over an OpenAI-compatible endpoint', () => {
  it('answers with the parsed content when the model answered', async () => {
    const calls = stubProvider({ body: anAnswer({ points: ['clear'] }) });

    const answer = await completerUnderTest().complete(aCompletion());

    expect(answer.content).toEqual({ points: ['clear'] });
    expect(calls[0]?.url).toBe(`${BASE_URL}/chat/completions`);
  });

  it('asks the configured model to think no further, and constrains it to the schema', async () => {
    const calls = stubProvider({ body: anAnswer({ points: [] }) });

    await completerUnderTest().complete(aCompletion());

    expect(bodyOf(calls, 0)).toMatchObject({
      model: MODEL,
      max_tokens: 1_600,
      reasoning_effort: 'none',
      response_format: {
        type: 'json_schema',
        json_schema: { strict: true, schema: aCompletion().answerSchema },
      },
    });
  });

  it('names Thrive as the caller, because an unidentified one is refused outright', async () => {
    const calls = stubProvider({ body: anAnswer({ points: [] }) });

    await completerUnderTest().complete(aCompletion());

    expect(headerOf(calls[0] ?? { init: {} }, 'User-Agent')).toBe('thrive-api');
  });

  it('asks again when the provider was briefly unavailable', async () => {
    const calls = stubProvider(503, { body: anAnswer({ points: [] }) });

    await completerUnderTest().complete(aCompletion());

    expect(calls).toHaveLength(2);
  });

  it('asks again when the connection dropped before an answer arrived', async () => {
    const calls = stubProvider('unreachable', {
      body: anAnswer({ points: [] }),
    });

    await completerUnderTest().complete(aCompletion());

    expect(calls).toHaveLength(2);
  });

  it('gives up after three attempts, which is the default budget', async () => {
    const calls = stubProvider(429);

    await expect(
      completerUnderTest().complete(aCompletion()),
    ).rejects.toThrow();

    expect(calls).toHaveLength(3);
  });

  it('asks once when the caller budgeted one, so work drained by the outbox cannot overrun it', async () => {
    const calls = stubProvider(503);

    await expect(
      completerUnderTest().complete(aCompletion({ maxAttempts: 1 })),
    ).rejects.toThrow();

    expect(calls).toHaveLength(1);
  });

  it('does not ask again when the request itself was refused', async () => {
    const calls = stubProvider(400);

    await expect(
      completerUnderTest().complete(aCompletion()),
    ).rejects.toThrow();

    expect(calls).toHaveLength(1);
  });

  it('rejects an answer that hit the token ceiling, rather than returning a truncated one', async () => {
    stubProvider({ body: anAnswer({ points: ['cut off'] }, 'length') });

    await expect(completerUnderTest().complete(aCompletion())).rejects.toThrow(
      /finish_length/,
    );
  });

  it('rejects a refusal without asking again, since the same question is refused again', async () => {
    const calls = stubProvider({ body: anAnswer({}, 'content_filter') });

    await expect(
      completerUnderTest().complete(aCompletion()),
    ).rejects.toThrow();

    expect(calls).toHaveLength(1);
  });

  it('rejects a 200 whose content is not the JSON the schema promised', async () => {
    stubProvider({
      body: JSON.stringify({
        choices: [{ finish_reason: 'stop', message: { content: 'sorry!' } }],
      }),
    });

    await expect(completerUnderTest().complete(aCompletion())).rejects.toThrow(
      /answer_not_json/,
    );
  });

  it('rejects a 200 carrying no choice at all, which is what an ignored reasoning flag looks like', async () => {
    stubProvider({ body: JSON.stringify({ choices: [] }) });

    await expect(completerUnderTest().complete(aCompletion())).rejects.toThrow(
      /unreadable_answer/,
    );
  });

  it('keeps the prompt and the key out of the error it reports', async () => {
    stubProvider(500);

    await expect(
      completerUnderTest().complete(
        aCompletion({ prompt: 'Ann said something private' }),
      ),
    ).rejects.toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining('private'),
      }),
    );
  });
});
