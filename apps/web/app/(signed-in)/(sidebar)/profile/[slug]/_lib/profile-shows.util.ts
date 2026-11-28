import { PROFILE_SHOWS, type ProfileShow } from '@/lib/routes.constant';

/** The lists that read the same for everyone who opens the Profile. */
export const EVERYONE_SEES: readonly ProfileShow[] = ['feedback', 'kudos'];

/**
 * The lists that differ for everyone who opens it: what is between the reader and the Member, what
 * was shared with the reader, and the Asks open between the two. They mean nothing on one's own.
 */
export const FOR_YOU: readonly ProfileShow[] = ['between', 'shared', 'asks'];

/** The lists a Profile offers its reader. One's own is a mirror of what everyone else sees. */
export function profileShowsFor(isYou: boolean): readonly ProfileShow[] {
  return isYou ? EVERYONE_SEES : [...EVERYONE_SEES, ...FOR_YOU];
}

/** The list the address asks for, or the one a Profile opens on when it does not offer that one. */
export function profileShowOf(
  asked: ProfileShow,
  shows: readonly ProfileShow[],
): ProfileShow {
  return shows.includes(asked) ? asked : PROFILE_SHOWS[0];
}
