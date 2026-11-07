'use client';

import { useRouter } from 'next/navigation';
import { usePersonalItemsView } from '@/app/(signed-in)/(brand-new)/_lib/use-personal-items-view';
import { Toggle } from '@/components/atoms/toggle';
import {
  BRAND_NEW_RECEIVED_SHOWS,
  type BrandNewReceivedShow,
  ROUTES,
} from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<BrandNewReceivedShow, string>> = {
  all: 'All',
  requests: 'My requests',
  offered: 'Given to me',
  kudos: 'Kudos',
};

export type ReceivedFilterProps = {
  show: BrandNewReceivedShow;
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
      {BRAND_NEW_RECEIVED_SHOWS.map((value) => (
        <Toggle
          key={value}
          variant="outline"
          size="sm"
          className="rounded-chip px-3"
          pressed={show === value}
          onPressedChange={(pressed) => {
            if (pressed) {
              router.push(ROUTES.brandNewReceivedViewing(view, value));
            }
          }}
        >
          {SHOW_NAMES[value]}
        </Toggle>
      ))}
    </fieldset>
  );
}
