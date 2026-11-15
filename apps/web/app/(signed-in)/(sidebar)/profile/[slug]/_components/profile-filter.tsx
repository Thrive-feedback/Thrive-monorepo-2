'use client';

import { useRouter } from 'next/navigation';
import { Toggle } from '@/components/atoms/toggle';
import { type ProfileShow, ROUTES } from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<ProfileShow, string>> = {
  feedback: 'Feedback',
  shared: 'Shared with you',
  kudos: 'Kudos',
};

/**
 * Each chip, pressed, in the colour of the cards it shows: Feedback, shared or not, in the brand's,
 * Kudos in the warm one.
 */
const SHOW_TONES: Readonly<Record<ProfileShow, 'primary' | 'secondary'>> = {
  feedback: 'primary',
  shared: 'primary',
  kudos: 'secondary',
};

export type ProfileFilterProps = {
  /** Whose Profile it is. */
  slug: string;
  /** The lists offered, in order. */
  shows: readonly ProfileShow[];
  /** Which list is open. */
  show: ProfileShow;
};

/**
 * Which of a Profile's lists is open, as a row of chips with one pressed, the way Received is
 * narrowed, kept in the address so a reload or a shared link opens the same one. Each list is read
 * on the server, so choosing one navigates.
 */
export function ProfileFilter({ slug, shows, show }: ProfileFilterProps) {
  const router = useRouter();

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Show</legend>
      {shows.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          tone={SHOW_TONES[value]}
          className="rounded-chip px-3"
          pressed={show === value}
          onPressedChange={(pressed) => {
            if (pressed) {
              router.push(ROUTES.profileShowing(slug, value));
            }
          }}
        >
          {SHOW_NAMES[value]}
        </Toggle>
      ))}
    </fieldset>
  );
}
