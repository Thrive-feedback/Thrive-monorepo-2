/** Deliberately loose: one `@`, no spaces, a dot in the domain. Delivery is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const INVITE_EMAIL_MESSAGES = {
  malformed: 'Enter a valid email address.',
} as const;

export type InviteEmailCheck =
  | { ok: true; emails: string[] }
  | { ok: false; errors: (string | undefined)[] };

/**
 * Checks one address per row. Empty rows are ignored and duplicates merged, ignoring case and
 * surrounding spaces; the first spelling wins. Any flagged row refuses the whole send, so
 * `errors` lines up index for index with `rows`.
 */
export function checkInviteEmails(rows: readonly string[]): InviteEmailCheck {
  const errors = rows.map(checkInviteEmail);

  if (errors.some((error) => error !== undefined)) {
    return { ok: false, errors };
  }

  const emails = new Map<string, string>();
  for (const row of rows) {
    const email = row.trim();
    if (email !== '' && !emails.has(email.toLowerCase())) {
      emails.set(email.toLowerCase(), email);
    }
  }

  return { ok: true, emails: [...emails.values()] };
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
