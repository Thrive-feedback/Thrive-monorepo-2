import type { PendingInvitation } from '@/lib/session/pending-invitation.type';

const DAY_MS = 24 * 60 * 60 * 1000;

const GRAPHEMES = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** One Invitation as a choice on the page, worked out on the server so no clock disagrees. */
export type InvitationChoice = {
  readonly invitationId: string;
  readonly workspaceName: string;
  /** Stands in for the Workspace's logo, which no Workspace has yet. */
  readonly initial: string;
  /** `3 members · Invited 2 days ago` */
  readonly detail: string;
};

/**
 * The first character as a reader sees it, so a name that starts with a Thai vowel mark, a flag
 * or a joined emoji is not cut in half.
 */
function firstCharacter(name: string): string {
  const [first] = GRAPHEMES.segment(name.trim());
  return first?.segment ?? '';
}

/** In whole days rather than as a date, so no reader's timezone can make it wrong. */
function invitedAgo(invitedAt: Date, now: Date): string {
  const days = Math.max(
    0,
    Math.floor((now.getTime() - invitedAt.getTime()) / DAY_MS),
  );
  if (days === 0) {
    return 'Invited today';
  }
  return days === 1 ? 'Invited 1 day ago' : `Invited ${days} days ago`;
}

export function toInvitationChoice(
  invitation: PendingInvitation,
  now: Date,
): InvitationChoice {
  const { name, memberCount } = invitation.workspace;
  const members = memberCount === 1 ? '1 member' : `${memberCount} members`;
  return {
    invitationId: invitation.invitationId,
    workspaceName: name,
    initial: firstCharacter(name).toUpperCase(),
    detail: `${members} · ${invitedAgo(invitation.invitedAt, now)}`,
  };
}
