import {
  type AiAnswer,
  AiCompleter,
  type AiCompletion,
} from '@app/shared/application/ai-completer.port';
import { Logger } from '@nestjs/common';

/** A model answers in seconds; Discord's ten would cut a normal answer short (ADR 0077). */
const REQUEST_TIMEOUT_MS = 30_000;

/** Two retries past the first try, for a caller that did not budget its own. */
const DEFAULT_MAX_ATTEMPTS = 3;

/** Four times Resend's: a `429` here is usually a token bucket, and 250 ms cannot clear one. */
const RETRY_BASE_DELAY_MS = 1_000;

/**
 * `529` is "overloaded" at some providers. Every other `4xx` is a request this code built wrong,
 * and asking again is only load.
 */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504, 529]);

/**
 * Required by the wire format and never read back. It names the schema, not the feature, because
 * one adapter serves every caller.
 */
const ANSWER_SCHEMA_NAME = 'answer';

/**
 * The first configured endpoint refuses some default client User-Agents with `403`, which is not
 * retried — so an unidentified caller would fail permanently for a reason that looks like a bad
 * credential (design 0024 §12.4).
 */
const USER_AGENT = 'thrive-api';

/** Injected so a test can run the retry path without the delay it is built around. */
export type Wait = (milliseconds: number) => Promise<void>;

const waitWithTimer: Wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Asks a model over the request shape OpenAI published and most providers now speak — so the
 * provider is three configuration values rather than a code change, and a self-hosted endpoint
 * is reachable without a rewrite (ADR 0077).
 *
 * Named for the protocol, not for whoever answers today: a vendor name here would become a lie
 * the first time the key changes, and it would invite vendor words upward into the modules.
 * Mirrors `infrastructure/email/resend-email-sender.adapter.ts` — raw `fetch`, a timeout, capped
 * attempts, jittered backoff, and total-function parsing.
 */
export class OpenAiCompatibleAiCompleter extends AiCompleter {
  private readonly logger = new Logger(OpenAiCompatibleAiCompleter.name);

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
    /** Only ever a log field, so a log stays readable across a provider swap. */
    private readonly providerLabel: string,
    private readonly wait: Wait = waitWithTimer,
  ) {
    super();
  }

  async complete(completion: AiCompletion): Promise<AiAnswer> {
    const maxAttempts = completion.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

    for (let attempt = 1; ; attempt += 1) {
      const result = await this.attempt(completion);

      if (result.answer) {
        return result.answer;
      }
      if (!result.retryable || attempt === maxAttempts) {
        // The one record of why. Never the prompt, never the answer, never the key: the prompt
        // carries a Member's Feedback, which is personal data (`AGENTS.md` §6, `BE_20`).
        this.logger.warn({
          event: 'ai.completion_failed',
          provider: this.providerLabel,
          model: this.model,
          status: result.status,
          reason: result.reason,
          attempts: attempt,
        });
        throw new Error(
          `The model did not answer (${result.reason ?? 'no reason'}${
            result.status === undefined ? '' : `, status ${result.status}`
          })`,
        );
      }
      await this.wait(result.retryAfterMs ?? backoffFor(attempt));
    }
  }

  private async attempt(completion: AiCompletion): Promise<Attempt> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: completion.maxAnswerTokens,
          // Measured: with reasoning left on, a request for 20 output tokens came back as a
          // 200 carrying nothing, because reasoning tokens are emitted first and count against
          // the ceiling (design 0024 §12.1). `"low"` is worse than either — it spent the whole
          // budget and truncated the answer.
          reasoning_effort: 'none',
          messages: [
            { role: 'system', content: completion.system },
            { role: 'user', content: completion.prompt },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: ANSWER_SCHEMA_NAME,
              strict: true,
              schema: completion.answerSchema,
            },
          },
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      // Timed out or never arrived; either may succeed on the next attempt.
      return { retryable: true, reason: 'no_response' };
    }

    if (!response.ok) {
      return {
        retryable: RETRYABLE_STATUSES.has(response.status),
        status: response.status,
        reason: 'refused',
        retryAfterMs: retryAfterOf(response),
      };
    }
    return answerOf(await readJson(response));
  }
}

interface Attempt {
  readonly answer?: AiAnswer;
  readonly retryable?: boolean;
  readonly status?: number;
  readonly reason?: string;
  readonly retryAfterMs?: number;
}

/**
 * Reads the finish reason **before** the content, because the two failures that arrive as a 200
 * are the dangerous ones: a refusal, which asking again only earns again, and a hit ceiling,
 * whose content is a truncated object that would otherwise parse as a real answer.
 */
function answerOf(body: unknown): Attempt {
  const choice = firstChoiceOf(body);
  if (choice === null) {
    return { retryable: false, reason: 'unreadable_answer' };
  }
  if (choice.finishReason !== 'stop') {
    return { retryable: false, reason: `finish_${choice.finishReason}` };
  }
  const content = parsedJson(choice.content);
  if (content === undefined) {
    return { retryable: false, reason: 'answer_not_json' };
  }
  return { answer: { content } };
}

interface Choice {
  readonly finishReason: string;
  readonly content: string;
}

function firstChoiceOf(body: unknown): Choice | null {
  if (typeof body !== 'object' || body === null || !('choices' in body)) {
    return null;
  }
  const { choices } = body as { choices: unknown };
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }
  const [first] = choices as unknown[];
  if (typeof first !== 'object' || first === null) {
    return null;
  }
  const { finish_reason: finishReason, message } = first as Record<
    string,
    unknown
  >;
  if (typeof message !== 'object' || message === null) {
    return null;
  }
  const { content } = message as Record<string, unknown>;
  return typeof finishReason === 'string' && typeof content === 'string'
    ? { finishReason, content }
    : null;
}

function parsedJson(content: string): unknown {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    // Strict mode is the part of this shape providers implement least evenly, so a body that is
    // not the JSON it promised is a refusal rather than a surprise.
    return undefined;
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Honoured over the computed backoff, as `DiscordBotClient.retryAfterOf` does. */
function retryAfterOf(response: Response): number | undefined {
  const header = response.headers.get('retry-after');
  const seconds = header === null ? Number.NaN : Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : undefined;
}

/** Jittered so several refused calls do not retry in lockstep. */
function backoffFor(attempt: number): number {
  const exponential = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  return exponential + Math.random() * exponential;
}
