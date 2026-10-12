import {
  AskAlreadyAnsweredError,
  AskStatusInvalidError,
} from '../feedback-request.errors';

export const ASK_STATUSES = ['PENDING', 'ANSWERED', 'EXPIRED'] as const;

export type AskStatusValue = (typeof ASK_STATUSES)[number];

function isAskStatus(raw: string): raw is AskStatusValue {
  return (ASK_STATUSES as readonly string[]).includes(raw);
}

/**
 * Where one Ask stands. An Ask starts Pending and becomes Answered when its Giver writes the
 * answer; expiry brings the transition that reaches Expired (#39), so nothing reaches it yet.
 */
export class AskStatus {
  static readonly Pending = new AskStatus('PENDING');
  static readonly Answered = new AskStatus('ANSWERED');

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

  /** The answered Ask. Only a Pending one can be answered — the first answer is final. */
  answered(): AskStatus {
    if (!this.isPending()) {
      throw new AskAlreadyAnsweredError();
    }
    return AskStatus.Answered;
  }

  equals(other: AskStatus): boolean {
    return this.value === other.value;
  }

  toString(): AskStatusValue {
    return this.value;
  }
}
