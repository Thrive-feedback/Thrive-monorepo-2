/** Deliberately loose: one `@`, no spaces, a dot in the domain. Delivery is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Personal Google accounts can never sign in (ADR-0020), so an Invitation to one is wasted. */
const PERSONAL_DOMAINS = new Set(['gmail.com', 'googlemail.com']);

/** What is wrong with an address. The form words it in the reader's language. */
export type InviteEmailProblem = 'malformed' | 'personal';

export type InviteEmailCheck =
  | { ok: true; emails: string[] }
  | { ok: false; problems: (InviteEmailProblem | undefined)[] };

/**
 * Checks one address per row. Empty rows are ignored and duplicates merged, ignoring case and
 * surrounding spaces; the first spelling wins. Any flagged row refuses the whole send, so
 * `problems` lines up index for index with `rows`.
 */
export function checkInviteEmails(rows: readonly string[]): InviteEmailCheck {
  const problems = rows.map(checkInviteEmail);

  if (problems.some((problem) => problem !== undefined)) {
    return { ok: false, problems };
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
export function checkInviteEmail(row: string): InviteEmailProblem | undefined {
  const email = row.trim();
  if (email === '') {
    return undefined;
  }
  if (!EMAIL_PATTERN.test(email)) {
    return 'malformed';
  }
  const domain = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  if (PERSONAL_DOMAINS.has(domain)) {
    return 'personal';
  }
  return undefined;
}
