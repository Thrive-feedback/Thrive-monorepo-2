import type { components } from '@repo/api';
import type { Session } from './session.type';

type CurrentSessionWire =
  components['schemas']['GetCurrentSessionResponseDto_Output'];

/** `null` means nobody is signed in: the API answers that rather than failing. */
export function toSession(wire: CurrentSessionWire): Session | null {
  return wire.account
    ? { email: wire.account.email, name: wire.account.name }
    : null;
}

/** The session has been in use long enough that it should be pushed forward. */
export function toNeedsRefresh(wire: CurrentSessionWire): boolean {
  return wire.account !== null && wire.needsRefresh;
}
