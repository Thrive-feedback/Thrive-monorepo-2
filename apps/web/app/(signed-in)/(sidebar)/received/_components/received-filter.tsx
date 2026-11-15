'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePersonalItemsView } from '@/app/(signed-in)/(sidebar)/_lib/use-personal-items-view';
import { CountBadge } from '@/components/atoms/badge';
import { Toggle } from '@/components/atoms/toggle';
import {
  useNavigationCountActions,
  useNavigationCounts,
} from '@/components/organisms/notifications-provider';
import {
  RECEIVED_SHOWS,
  type ReceivedShow,
  ROUTES,
} from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<ReceivedShow, string>> = {
  all: 'All',
  requests: 'My requests',
  offered: 'Given to me',
  kudos: 'Kudos',
};

/**
 * Each chip, pressed, in the colour of the cards it narrows to, so the colour a reader learns from
 * the cards also finds them: requests in the cool colour, Feedback given unasked in the brand's,
 * Kudos in the warm one. Everything at once holds every colour, so it stays neutral.
 */
const SHOW_TONES: Readonly<
  Record<ReceivedShow, 'neutral' | 'primary' | 'tertiary' | 'secondary'>
> = {
  all: 'neutral',
  requests: 'tertiary',
  offered: 'primary',
  kudos: 'secondary',
};

export type ReceivedFilterProps = {
  show: ReceivedShow;
};

/**
 * What Received shows, as a row of chips with one pressed, kept in the address so a reload or a
 * shared link keeps it. Each choice reads its own list from the server, so choosing one navigates,
 * keeping how the list is laid out. Each chip but All carries how much of its kind is new since the
 * person last opened it, and the one open is marked opened, so its count goes and the bell lines
 * that lead to it are read. All marks none: it
 * shows a little of everything, not each kind in full.
 *
 * Marked from the browser, once the chip is on screen, rather than while the server draws the
 * page: a link prefetched ahead of a press draws it too, and would clear a count nobody saw.
 */
export function ReceivedFilter({ show }: ReceivedFilterProps) {
  const router = useRouter();
  const view = usePersonalItemsView();
  const counts = useNavigationCounts();
  const { markPlaceOpened } = useNavigationCountActions();

  useEffect(() => {
    if (show !== 'all') {
      markPlaceOpened(show);
    }
  }, [show, markPlaceOpened]);

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Show</legend>
      {RECEIVED_SHOWS.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          tone={SHOW_TONES[value]}
          className="rounded-chip px-3"
          pressed={show === value}
          onPressedChange={(pressed) => {
            if (pressed) {
              router.push(ROUTES.receivedViewing(view, value));
            }
          }}
        >
          {SHOW_NAMES[value]}
          {/* All would only repeat the sidebar's number, so it carries none. */}
          {value !== 'all' && <CountBadge count={counts[value]} />}
        </Toggle>
      ))}
    </fieldset>
  );
}
