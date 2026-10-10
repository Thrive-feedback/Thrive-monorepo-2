/** One email to one person. The sender decides the From address; the caller only names it. */
export interface EmailMessage {
  readonly to: string;
  /** Shown as the sender's name, beside an address the transport owns. */
  readonly fromName: string;
  /** Where a reply goes, since the From address is not one a person reads. */
  readonly replyTo: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/**
 * Sends email. Belongs to no capability: a module composes its own message and hands it over,
 * so the transport behind it can change without touching a use case. Rejects when the message
 * was not accepted for delivery.
 */
export abstract class EmailSender {
  abstract send(message: EmailMessage): Promise<void>;
}
