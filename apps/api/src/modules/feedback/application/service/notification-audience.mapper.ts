import type { NotificationAudience } from '@app/modules/notifications';
import type { VisibilityValue } from '../../domain/value-object/visibility.vo';

/**
 * A Visibility in the words Notifications publishes for it. Notifications cannot read Feedback —
 * this module already depends on it — so the bell is told who can read a line's subject when the
 * subject is written, and keeps it. A Visibility added to Feedback fails to compile here until it
 * is given an audience.
 */
const AUDIENCE_OF: Readonly<Record<VisibilityValue, NotificationAudience>> = {
  ONLY_ME: 'ONLY_ME',
  SELECTED_PEOPLE: 'SELECTED_PEOPLE',
  EVERYONE: 'EVERYONE',
};

/** Who can read it, told to somebody who may know: the Requester, a Receiver, a Selected person. */
export function toNotificationAudience(
  visibility: VisibilityValue,
): NotificationAudience {
  return AUDIENCE_OF[visibility];
}

/** Who can read a Kudos: every Member, as a Kudos has no Visibility (brain `ADR-0045`). */
export const KUDOS_AUDIENCE: NotificationAudience = 'EVERYONE';

/**
 * Who can read the answer, told to the Giver asked for it — which is only ever that it goes on the
 * Workspace feed. A Giver is told that much before writing and nothing more: for Only me and
 * Selected people they are not told who reads it (brain `ADR-0022` decision 2, `ADR-0046` decision
 * 4), so their bell line carries no audience at all, as the Ask they open says none.
 */
export function toGiverAudience(
  visibility: VisibilityValue,
): NotificationAudience | undefined {
  return visibility === 'EVERYONE' ? 'EVERYONE' : undefined;
}
