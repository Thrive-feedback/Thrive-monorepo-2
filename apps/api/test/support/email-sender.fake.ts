import {
  type EmailMessage,
  EmailSender,
} from '@app/shared/application/email-sender.port';

/**
 * Keeps every email it accepts, so a test asserts what was sent. Addresses in `failingFor`
 * are refused, as a transport refuses a send that did not go out.
 */
export class FakeEmailSender extends EmailSender {
  readonly sent: EmailMessage[] = [];
  readonly failingFor = new Set<string>();

  async send(message: EmailMessage): Promise<void> {
    if (this.failingFor.has(message.to)) {
      throw new Error(`Sending to ${message.to} failed.`);
    }
    this.sent.push(message);
  }
}
