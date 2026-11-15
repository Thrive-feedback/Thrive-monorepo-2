import { PROFILE_SHOWS, type ProfileShow } from '@/lib/routes.constant';

/**
 * The lists a Profile offers its reader. Nobody can be selected to read Feedback written to
 * themselves, so on the reader's own Profile there is nothing to show as shared with them.
 */
export function profileShowsFor(isYou: boolean): readonly ProfileShow[] {
  return isYou
    ? PROFILE_SHOWS.filter((show) => show !== 'shared')
    : PROFILE_SHOWS;
}

/** The list the address asks for, or the one a Profile opens on when it does not offer that one. */
export function profileShowOf(
  asked: ProfileShow,
  shows: readonly ProfileShow[],
): ProfileShow {
  return shows.includes(asked) ? asked : PROFILE_SHOWS[0];
}
