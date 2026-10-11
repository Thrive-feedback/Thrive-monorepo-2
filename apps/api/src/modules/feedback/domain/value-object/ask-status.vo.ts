import { AskStatusInvalidError } from '../feedback-request.errors';

export const ASK_STATUSES = ['PENDING', 'ANSWERED', 'EXPIRED'] as const;

export type AskStatusValue = (typeof ASK_STATUSES)[number];

function isAskStatus(raw: string): raw is AskStatusValue {
  return (ASK_STATUSES as readonly string[]).includes(raw);
}

/**
 * Where one Ask stands. An Ask starts Pending; answering and expiry will each bring the
 * transition that reaches their value, so nothing can reach Answered or Expired yet.
 */
export class AskStatus {
  static readonly Pending = new AskStatus('PENDING');

  private constructor(private readonly value: AskStatusValue) {}

  static of(raw: string): AskStatus {
    if (!isAskStatus(raw)) {
      throw new AskStatusInvalidError();
    }
    return new AskStatus(raw);
  }

  isPending(): boolean {
    return this.value === 'PENDING';
  }

  equals(other: AskStatus): boolean {
    return this.value === other.value;
  }

  toString(): AskStatusValue {
    return this.value;
  }
}
