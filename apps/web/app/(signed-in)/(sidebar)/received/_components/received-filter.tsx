'use client';

import { useRouter } from 'next/navigation';
import { usePersonalItemsView } from '@/app/(signed-in)/(sidebar)/_lib/use-personal-items-view';
import { Toggle } from '@/components/atoms/toggle';
import { cn } from '@/lib/cn.util';
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
const SHOW_INKS: Readonly<Record<ReceivedShow, string>> = {
  all: 'data-[state=on]:border-border-strong data-[state=on]:bg-action-neutral-surface-hover data-[state=on]:text-fg-primary',
  requests:
    'data-[state=on]:border-action-tertiary-border data-[state=on]:bg-action-tertiary-surface data-[state=on]:text-action-tertiary-hover',
  offered: '',
  kudos:
    'data-[state=on]:border-action-secondary-border data-[state=on]:bg-action-secondary-surface data-[state=on]:text-action-secondary-hover',
};

export type ReceivedFilterProps = {
  show: ReceivedShow;
};

/**
 * What Received shows, as a row of chips with one pressed, kept in the address so a reload or a
 * shared link keeps it. Each choice reads its own list from the server, so choosing one navigates,
 * keeping how the list is laid out.
 */
export function ReceivedFilter({ show }: ReceivedFilterProps) {
  const router = useRouter();
  const view = usePersonalItemsView();

  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">Show</legend>
      {RECEIVED_SHOWS.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          className={cn('rounded-chip px-3', SHOW_INKS[value])}
          pressed={show === value}
          onPressedChange={(pressed) => {
            if (pressed) {
              router.push(ROUTES.receivedViewing(view, value));
            }
          }}
        >
          {SHOW_NAMES[value]}
        </Toggle>
      ))}
    </fieldset>
  );
}
