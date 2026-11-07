'use client';

import { LayoutGridIcon, ListIcon } from 'lucide-react';
import {
  PERSONAL_ITEMS_ROUTES,
  type PersonalItemsSide,
} from '@/app/(signed-in)/(sidebar)/_lib/personal-items-side.constant';
import { usePersonalItemsView } from '@/app/(signed-in)/(sidebar)/_lib/use-personal-items-view';
import { useReceivedShow } from '@/app/(signed-in)/(sidebar)/_lib/use-received-show';
import { Toggle } from '@/components/atoms/toggle';
import { PERSONAL_VIEWS, type PersonalView } from '@/lib/routes.constant';

/**
 * How each view is named and drawn. They are offered in the order of `PERSONAL_VIEWS`, so the view
 * a page opens on comes first.
 */
const VIEW_LOOKS: Readonly<
  Record<PersonalView, { label: string; Icon: typeof ListIcon }>
> = {
  list: { label: 'List view', Icon: ListIcon },
  grid: { label: 'Grid view', Icon: LayoutGridIcon },
};

const VIEWS = PERSONAL_VIEWS.map((value) => ({ value, ...VIEW_LOOKS[value] }));

export type PersonalItemsViewToggleProps = {
  /** Whose address to keep the choice in. */
  side: PersonalItemsSide;
};

/**
 * Whether the list is a grid of cards or a list like Home's. The choice is kept in the address, so
 * a reload comes back to it, but changing it reads nothing: both views draw what is already here, so
 * the address changes without a navigation, and everything read so far stays.
 */
export function PersonalItemsViewToggle({
  side,
}: PersonalItemsViewToggleProps) {
  const view = usePersonalItemsView();
  const show = useReceivedShow();

  return (
    <fieldset className="flex shrink-0 gap-1">
      <legend className="sr-only">View</legend>
      {VIEWS.map(({ value, label, Icon }) => (
        <Toggle
          key={value}
          size="sm"
          aria-label={label}
          pressed={view === value}
          onPressedChange={(pressed) => {
            if (pressed) {
              window.history.replaceState(
                null,
                '',
                PERSONAL_ITEMS_ROUTES[side].viewing(value, show),
              );
            }
          }}
        >
          <Icon aria-hidden="true" className="size-5" />
        </Toggle>
      ))}
    </fieldset>
  );
}
