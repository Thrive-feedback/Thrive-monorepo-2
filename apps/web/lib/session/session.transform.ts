import type { components } from '@repo/api';
import type { CurrentAccount, CurrentMembership } from './current-account.type';

type CurrentSessionWire =
  components['schemas']['GetCurrentSessionResponseDto_Output'];

type MyMembershipsWire =
  components['schemas']['ListMyMembershipsResponseDto_Output'];

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

/**
 * The Workspace the person works in. One per person for now (ADR-0020), so it is the first
 * and only one; `null` while they belong to none.
 */
export function toCurrentMembership(
  wire: MyMembershipsWire,
): CurrentMembership | null {
  const first = wire.items[0];
  if (!first) {
    return null;
  }
  return {
    workspace: { id: first.workspace.id, name: first.workspace.name },
    role: first.role,
  };
}
