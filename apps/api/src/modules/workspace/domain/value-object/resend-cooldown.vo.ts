import { InvitationResentTooSoonError } from '../workspace.errors';

/** How long an Invitation's email rests before it may be sent again. */
const COOLDOWN_MS = 5 * 60 * 1000;

/**
 * The pause after each send of an Invitation's email, so a double click or an impatient inviter
 * cannot spend the day's sending allowance on one address.
 */
export class ResendCooldown {
  private constructor(private readonly lastSentAt: Date) {}

  /** The cooldown running from the last time the Invitation's email went out. */
  static since(lastSentAt: Date): ResendCooldown {
    return new ResendCooldown(lastSentAt);
  }

  /** Refuses a resend at `now` while the cooldown is still running. */
  ensureOverAt(now: Date): void {
    const remainingMs = this.lastSentAt.getTime() + COOLDOWN_MS - now.getTime();
    if (remainingMs > 0) {
      throw new InvitationResentTooSoonError(Math.ceil(remainingMs / 1000));
    }
  }
}
