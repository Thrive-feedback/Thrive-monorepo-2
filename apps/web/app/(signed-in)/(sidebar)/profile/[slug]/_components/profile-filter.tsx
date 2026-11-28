'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';
import {
  EVERYONE_SEES,
  FOR_YOU,
} from '@/app/(signed-in)/(sidebar)/profile/[slug]/_lib/profile-shows.util';
import { Text } from '@/components/atoms/text';
import { Toggle } from '@/components/atoms/toggle';
import { InfoTip } from '@/components/molecules/info-tip';
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
  /** Said behind an "i" by the title, out of the way of the chips: what the group holds. */
  about?: string;
  slug: string;
  shows: readonly ProfileShow[];
  show: ProfileShow;
};

/** One titled row of chips. Pressing one opens its list, whichever group the open one is in. */
function ShowGroup({ title, note, about, slug, shows, show }: ShowGroupProps) {
  const router = useRouter();
  const noteId = useId();

  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={note ? noteId : undefined}
    >
      <legend className={about ? 'sr-only' : 'contents'}>
        <Text as="span" variant="subtitle-4">
          {title}
        </Text>
      </legend>
      {/* With an "i", the title is drawn again beside it and the legend only names the group, so its
          name stays the title alone rather than taking in the button's. */}
      {about && (
        <div className="flex items-center gap-1">
          <Text as="span" variant="subtitle-4" aria-hidden="true">
            {title}
          </Text>
          {/* Of no height of its own, so the row is as tall as a title alone and the chips under
              it line up with those of a group with no "i". */}
          <span className="flex h-0 items-center">
            <InfoTip about={title} words={about} />
          </span>
        </div>
      )}
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
 * choosing one navigates. What everyone sees comes first; what differs for each reader is set apart
 * beside it, past a rule and under its own title, so a private piece never reads as public. One's own Profile has only the
 * first group, as the mirror of what others see.
 */
export function ProfileFilter({
  slug,
  show,
  isYou = false,
}: ProfileFilterProps) {
  return (
    // Side by side, with the rule, from `lg`, where the Profile's column has room for both; stacked, no rule, below.
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
      <ShowGroup
        title="Everyone sees"
        note={isYou ? 'This is what everyone sees on your Profile.' : undefined}
        slug={slug}
        shows={EVERYONE_SEES}
        show={show}
      />
      {!isYou && (
        <>
          <span
            aria-hidden="true"
            className="hidden w-px self-stretch bg-border-muted lg:block"
          />
          <ShowGroup
            title="For you"
            about="This part is different for everyone who opens it."
            slug={slug}
            shows={FOR_YOU}
            show={show}
          />
        </>
      )}
    </div>
  );
}
