import type { components } from '@repo/api';
import type { CurrentAccount } from './current-account.type';

type CurrentSessionWire =
  components['schemas']['GetCurrentSessionResponseDto_Output'];

/** `null` means nobody is signed in: the API answers that rather than failing. */
export function toCurrentAccount(
  wire: CurrentSessionWire,
): CurrentAccount | null {
  if (!wire.account) {
    return null;
  }
  const { email, name, profile } = wire.account;
  return {
    email,
    name,
    profile: profile
      ? {
          fullName: profile.fullName,
          displayName: profile.displayName,
          slug: profile.slug,
        }
      : null,
  };
}

/** The session has been in use long enough that it should be pushed forward. */
export function toNeedsRefresh(wire: CurrentSessionWire): boolean {
  return wire.account !== null && wire.needsRefresh;
}
