/** Deliberately loose: one `@`, no spaces, a dot in the domain. Delivery is the real check. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The API invites at most this many people per send. */
export const MAX_INVITES_PER_SEND = 10;

export type EmailList = {
  /** Each address once, in the order first written; the first spelling wins. */
  readonly emails: readonly string[];
  /** What was written that is not an address, as written. */
  readonly malformed: readonly string[];
};

/**
 * Reads addresses typed one per line or separated by commas or semicolons. Blank entries are
 * dropped and repeats merged, ignoring case and surrounding spaces.
 */
export function parseEmailList(text: string): EmailList {
  const emails = new Map<string, string>();
  const malformed: string[] = [];
  for (const entry of text.split(/[\n,;]+/)) {
    const email = entry.trim();
    if (email === '') {
      continue;
    }
    if (!EMAIL_PATTERN.test(email)) {
      malformed.push(email);
    } else if (!emails.has(email.toLowerCase())) {
      emails.set(email.toLowerCase(), email);
    }
  }
  return { emails: [...emails.values()], malformed };
}

/** Why a list cannot be sent as it is, or `undefined` when it can. */
export function checkEmailList({
  emails,
  malformed,
}: EmailList): string | undefined {
  if (malformed.length > 0) {
    return `Not an email address: ${malformed.join(', ')}`;
  }
  if (emails.length === 0) {
    return 'Add at least one email address.';
  }
  if (emails.length > MAX_INVITES_PER_SEND) {
    return `You can invite up to ${MAX_INVITES_PER_SEND} people at a time.`;
  }
  return undefined;
}
