import type { MemberRole } from '@/lib/session/current-account.type';

/** Deliberately loose: one `@`, no spaces, a dot in the domain. Delivery is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The API invites at most this many people per send. */
export const MAX_INVITES_PER_SEND = 10;

export const INVITE_EMAIL_MESSAGES = {
  malformed: 'Enter a valid email address.',
} as const;

/** What a row says when its address could not be sent to. */
export const COULD_NOT_SEND_TO_ROW = "Couldn't send. Try again.";

/** One person to invite, and the Role they join with. */
export type Invitee = { readonly email: string; readonly role: MemberRole };

/** The Role an address was sent with, for putting a failed one back as it was. */
export function roleSentTo(
  invitations: readonly Invitee[],
  email: string,
): MemberRole {
  return (
    invitations.find((i) => i.email.toLowerCase() === email.toLowerCase())
      ?.role ?? 'MEMBER'
  );
}

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
