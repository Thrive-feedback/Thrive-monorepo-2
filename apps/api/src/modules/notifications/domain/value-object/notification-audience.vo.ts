/**
 * Who can read the thing a Notification points at, as it was when it was written: only the people
 * it is for, the people the writer picked as well, or the whole Workspace. The bell draws it beside
 * the line, so somebody knows before opening it who else can read it.
 *
 * It is fixed once written — a Feedback Request and a piece of Feedback keep the Visibility they
 * were sent with — so recording it with the row cannot go stale. A row has none when the person
 * told may not know it (an Ask's Giver, unless the answer goes on the Workspace feed) and when it
 * was written before this was recorded; the bell draws nothing for either.
 */
export const NOTIFICATION_AUDIENCES = [
  'ONLY_ME',
  'SELECTED_PEOPLE',
  'EVERYONE',
] as const;

export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

/**
 * A stored audience, or `null` for a row that has none. A value this release does not know reads
 * as none, as a type it does not know reads as no line: the bell draws nothing rather than guess.
 */
export function storedAudience(
  raw: string | null,
): NotificationAudience | null {
  return raw !== null && isNotificationAudience(raw) ? raw : null;
}

function isNotificationAudience(raw: string): raw is NotificationAudience {
  return (NOTIFICATION_AUDIENCES as readonly string[]).includes(raw);
}
