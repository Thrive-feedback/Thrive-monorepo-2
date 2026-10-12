import {
  type EmailMessage,
  EmailSender,
} from '@app/shared/application/email-sender.port';
import { Logger } from '@nestjs/common';

/** Resend answers in well under a second. */
const SEND_TIMEOUT_MS = 15_000;

/** Two retries past the first try. */
const MAX_SEND_ATTEMPTS = 3;

const RETRY_BASE_DELAY_MS = 250;

/** A validation error is absent on purpose: sending a malformed message again only fails again. */
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/** Injected so a test can run the retry path without the delay it is built around. */
export type Wait = (milliseconds: number) => Promise<void>;

const waitWithTimer: Wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Sends through Resend's HTTPS API, from an address on the domain Thrive has verified there
 * (ADR 0038). HTTPS rather than SMTP because the host filters outbound SMTP ports; the From
 * address belongs to the transport, and only the display name carries the person sending.
 */
export class ResendEmailSender extends EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
    private readonly wait: Wait = waitWithTimer,
  ) {
    super();
  }

  async send(message: EmailMessage): Promise<void> {
    for (let attempt = 1; ; attempt += 1) {
      const result = await this.attempt(message);

      if (result.sent) {
        return;
      }
      if (!result.retryable || attempt === MAX_SEND_ATTEMPTS) {
        // The caller turns this into an answer per address, so this is the one record of why.
        // Resend's `name` is an enum; its `message` quotes the recipient and stays out, as does
        // the idempotency key, which is the Invitation id and so the capability to accept it.
        this.logger.warn({
          event: 'email.send_failed',
          transport: 'resend',
          status: result.status,
          reason: result.reason,
          attempts: attempt,
        });
        throw new Error(
          `Resend did not accept the message (status ${result.status ?? 'none'}${
            result.reason ? `, ${result.reason}` : ''
          })`,
        );
      }
      await this.wait(backoffFor(attempt));
    }
  }

  private async attempt(message: EmailMessage): Promise<Attempt> {
    let response: Response;
    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: `${quotedDisplayName(message.fromName)} <${this.fromAddress}>`,
          to: message.to,
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
        }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
    } catch {
      // The request may or may not have arrived, which is what the idempotency key is for.
      return { sent: false, retryable: true };
    }

    if (response.ok) {
      return { sent: true };
    }
    return {
      sent: false,
      retryable: RETRYABLE_STATUSES.has(response.status),
      status: response.status,
      reason: await refusalName(response),
    };
  }
}

interface Attempt {
  readonly sent: boolean;
  readonly retryable?: boolean;
  readonly status?: number;
  readonly reason?: string;
}

/**
 * Resend names each refusal — `validation_error`, `invalid_idempotency_key` — beside a message
 * that quotes the recipient. Only the name is read, because a status alone cannot tell a
 * malformed address from a key the wrong length.
 */
async function refusalName(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (typeof body === 'object' && body !== null && 'name' in body) {
      const { name } = body as { name: unknown };
      return typeof name === 'string' ? name : undefined;
    }
  } catch {
    // A refusal that is not JSON tells us nothing more than its status already did.
  }
  return undefined;
}

/** Jittered so a batch of Invitations does not retry in lockstep. */
function backoffFor(attempt: number): number {
  const exponential = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
  return exponential + Math.random() * exponential;
}

/**
 * Resend takes the From header as one string, so the escaping is this code's to do. The name
 * reaches here from a Profile someone typed: a quote would end the display name early, and a
 * newline would start a header of their choosing.
 */
function quotedDisplayName(name: string): string {
  const escaped = name
    .replace(/[\r\n]+/g, ' ')
    .replace(/([\\"])/g, '\\$1')
    .trim();
  return `"${escaped} via Thrive"`;
}
