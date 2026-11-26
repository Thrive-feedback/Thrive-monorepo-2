import {
  OneOnOneAlreadyOverError,
  OneOnOneNotAwaitingAnswerError,
  OneOnOneNotRunningError,
  OneOnOneStatusInvalidError,
} from '../one-on-one.errors';

export const ONE_ON_ONE_STATUSES = [
  'INVITED',
  'ACTIVE',
  'DECLINED',
  'ENDED',
] as const;

export type OneOnOneStatusValue = (typeof ONE_ON_ONE_STATUSES)[number];

function isOneOnOneStatus(raw: string): raw is OneOnOneStatusValue {
  return (ONE_ON_ONE_STATUSES as readonly string[]).includes(raw);
}

/**
 * Where a 1:1 stands. It starts as an invitation (`INVITED`); the person invited accepts it (`ACTIVE`)
 * or turns it down (`DECLINED`); a running one, or one still waiting, can be ended (`ENDED`). Nothing
 * comes back from the last two.
 */
export class OneOnOneStatus {
  static readonly Invited = new OneOnOneStatus('INVITED');
  static readonly Active = new OneOnOneStatus('ACTIVE');
  static readonly Declined = new OneOnOneStatus('DECLINED');
  static readonly Ended = new OneOnOneStatus('ENDED');

  private constructor(private readonly value: OneOnOneStatusValue) {}

  static of(raw: string): OneOnOneStatus {
    if (!isOneOnOneStatus(raw)) {
      throw new OneOnOneStatusInvalidError();
    }
    return {
      INVITED: OneOnOneStatus.Invited,
      ACTIVE: OneOnOneStatus.Active,
      DECLINED: OneOnOneStatus.Declined,
      ENDED: OneOnOneStatus.Ended,
    }[raw];
  }

  isAwaitingAnswer(): boolean {
    return this.value === 'INVITED';
  }

  isOver(): boolean {
    return this.value === 'DECLINED' || this.value === 'ENDED';
  }

  accept(): OneOnOneStatus {
    if (!this.isAwaitingAnswer()) {
      throw new OneOnOneNotAwaitingAnswerError();
    }
    return OneOnOneStatus.Active;
  }

  decline(): OneOnOneStatus {
    if (!this.isAwaitingAnswer()) {
      throw new OneOnOneNotAwaitingAnswerError();
    }
    return OneOnOneStatus.Declined;
  }

  end(): OneOnOneStatus {
    if (this.isOver()) {
      throw new OneOnOneAlreadyOverError();
    }
    return OneOnOneStatus.Ended;
  }

  /** A schedule is kept for a 1:1 that runs, or one offered and not yet answered. */
  assertSchedulable(): void {
    if (this.value !== 'ACTIVE' && this.value !== 'INVITED') {
      throw new OneOnOneNotRunningError();
    }
  }

  isRunning(): boolean {
    return this.value === 'ACTIVE';
  }

  toString(): OneOnOneStatusValue {
    return this.value;
  }
}
