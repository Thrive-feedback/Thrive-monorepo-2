import {
  type EmailMessage,
  EmailSender,
} from '@app/shared/application/email-sender.port';
import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

/** Gmail answers within seconds; a send that hangs longer than this is reported as failed. */
const SMTP_TIMEOUT_MS = 15_000;

/**
 * Sends through Gmail's SMTP server as the team's Gmail account, signed in with an App
 * Password (ADR 0036). The From address must be that account, or Gmail rewrites it; only the
 * display name carries the person sending.
 */
export class GmailSmtpEmailSender
  extends EmailSender
  implements OnModuleDestroy
{
  private readonly logger = new Logger(GmailSmtpEmailSender.name);
  private readonly transporter: Transporter;

  constructor(
    private readonly user: string,
    appPassword: string,
  ) {
    super();
    this.transporter = createTransport({
      service: 'gmail',
      // One connection reused across a batch of Invitations, rather than a handshake per email.
      pool: true,
      auth: { user, pass: appPassword },
      connectionTimeout: SMTP_TIMEOUT_MS,
      greetingTimeout: SMTP_TIMEOUT_MS,
      socketTimeout: SMTP_TIMEOUT_MS,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: { name: `${message.fromName} via Thrive`, address: this.user },
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      // The caller turns this into an answer per address, so this is the one record of why.
      // Only the SMTP codes: Gmail's messages quote the recipient's address.
      this.logger.warn({
        event: 'email.send_failed',
        transport: 'gmail',
        ...smtpCodes(error),
      });
      throw error;
    }
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}

/** Nodemailer's error codes, without its message, which quotes the recipient. */
function smtpCodes(error: unknown): { code?: unknown; responseCode?: unknown } {
  if (typeof error !== 'object' || error === null) {
    return {};
  }
  return {
    code: 'code' in error ? error.code : undefined,
    responseCode: 'responseCode' in error ? error.responseCode : undefined,
  };
}
