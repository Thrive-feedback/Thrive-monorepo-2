import type { MemberRole } from '@/lib/session/current-account.type';

/** Deliberately loose: one `@`, no spaces, a dot in the domain. Delivery is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INVITE_EMAIL_MESSAGES = {
  malformed: 'Enter a valid email address.',
} as const;

/** One person to invite, and the Role they join with. */
export type Invitee = { readonly email: string; readonly role: MemberRole };

export type InviteEmailCheck =
  | { ok: true; invitations: Invitee[] }
  | { ok: false; errors: (string | undefined)[] };

/**
 * Checks one address per row. Empty rows are ignored and duplicates merged, ignoring case and
 * surrounding spaces; the first row wins, its spelling and its Role. Any flagged row refuses the
 * whole send, so `errors` lines up index for index with `rows`.
 */
export function checkInviteEmails(
  rows: readonly { readonly value: string; readonly role: MemberRole }[],
): InviteEmailCheck {
  const errors = rows.map((row) => checkInviteEmail(row.value));

  if (errors.some((error) => error !== undefined)) {
    return { ok: false, errors };
  }

  const invitations = new Map<string, Invitee>();
  for (const row of rows) {
    const email = row.value.trim();
    if (email !== '' && !invitations.has(email.toLowerCase())) {
      invitations.set(email.toLowerCase(), { email, role: row.role });
    }
  }

  return { ok: true, invitations: [...invitations.values()] };
}

/** One row on its own, as checked when the person leaves it. An empty row is not a problem. */
export function checkInviteEmail(row: string): string | undefined {
  const email = row.trim();
  if (email === '') {
    return undefined;
  }
  if (!EMAIL_PATTERN.test(email)) {
    return INVITE_EMAIL_MESSAGES.malformed;
  }
  return undefined;
}
