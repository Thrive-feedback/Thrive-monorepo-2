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
        // Only the status: Resend's body quotes the recipient, and the idempotency key is the
        // Invitation id, which is the capability to accept it.
        this.logger.warn({
          event: 'email.send_failed',
          transport: 'resend',
          status: result.status,
          attempts: attempt,
        });
        throw new Error(
          `Resend did not accept the message (status ${result.status ?? 'none'})`,
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
    };
  }
}

interface Attempt {
  readonly sent: boolean;
  readonly retryable?: boolean;
  readonly status?: number;
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
