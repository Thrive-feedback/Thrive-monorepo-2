'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';
import {
  EVERYONE_SEES,
  FOR_YOU,
} from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-shows.util';
import { Text } from '@/components/atoms/text';
import { Toggle } from '@/components/atoms/toggle';
import { type ProfileShow, ROUTES } from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<ProfileShow, string>> = {
  feedback: 'Feedback',
  kudos: 'Kudos',
  between: 'Between you two',
  shared: 'Shared with you',
  asks: 'Open asks',
};

/**
 * Each chip, pressed, in the colour of the cards it shows: Feedback in the brand's, Kudos in the
 * warm one, and the open Asks in the colour every Ask card has.
 */
const SHOW_TONES: Readonly<
  Record<ProfileShow, 'primary' | 'secondary' | 'tertiary'>
> = {
  feedback: 'primary',
  kudos: 'secondary',
  between: 'primary',
  shared: 'primary',
  asks: 'tertiary',
};

type ShowGroupProps = {
  /** What the group is called, which names it for a screen reader too. */
  title: string;
  /** One line under the title, saying who the group is for. */
  note?: string;
  slug: string;
  shows: readonly ProfileShow[];
  show: ProfileShow;
};

/** One titled row of chips. Pressing one opens its list, whichever group the open one is in. */
function ShowGroup({ title, note, slug, shows, show }: ShowGroupProps) {
  const router = useRouter();
  const noteId = useId();

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={note ? noteId : undefined}
    >
      <legend className="contents">
        <Text as="span" variant="subtitle-4">
          {title}
        </Text>
      </legend>
      {note && (
        <Text id={noteId} variant="body-3" tone="muted" className="-mt-1.5">
          {note}
        </Text>
      )}
      <div className="flex flex-wrap gap-2">
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
      </div>
    </fieldset>
  );
}

export type ProfileFilterProps = {
  /** Whose Profile it is. */
  slug: string;
  /** Which list is open. */
  show: ProfileShow;
  /** The Profile is the reader's own, which shows only what everyone sees. */
  isYou?: boolean;
};

/**
 * Which of a Profile's lists is open, as chips in two titled groups with one chip pressed, kept in
 * the address so a reload or a shared link opens the same one. Each list is read on the server, so
 * choosing one navigates. What everyone sees comes first. What differs for each reader is set apart
 * under its own title, so a private piece never reads as public. One's own Profile has only the
 * first group, as the mirror of what others see.
 */
export function ProfileFilter({
  slug,
  show,
  isYou = false,
}: ProfileFilterProps) {
  return (
    <div className="flex flex-col gap-4">
      <ShowGroup
        title="Everyone sees"
        note={isYou ? 'This is what everyone sees on your Profile.' : undefined}
        slug={slug}
        shows={EVERYONE_SEES}
        show={show}
      />
      {!isYou && (
        <ShowGroup
          title="For you"
          note="This part is different for everyone who opens it."
          slug={slug}
          shows={FOR_YOU}
          show={show}
        />
      )}
    </div>
  );
}
