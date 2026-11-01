'use client';

import { LayoutGridIcon, ListIcon } from 'lucide-react';
import { useReceivedView } from '@/app/(signed-in)/(brand-new)/brand-new-received/_lib/use-received-view';
import { Toggle } from '@/components/atoms/toggle';
import { type BrandNewReceivedView, ROUTES } from '@/lib/routes.constant';

const VIEWS: readonly {
  value: BrandNewReceivedView;
  label: string;
  Icon: typeof ListIcon;
}[] = [
  { value: 'grid', label: 'Grid view', Icon: LayoutGridIcon },
  { value: 'list', label: 'List view', Icon: ListIcon },
];

/**
 * Whether Received is a grid of cards or a list like Home's. The choice is kept in the address, so
 * a reload comes back to it, but changing it reads nothing: both views draw what is already here, so
 * the address changes without a navigation, and everything read so far stays.
 */
export function ReceivedViewToggle() {
  const view = useReceivedView();

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
                ROUTES.brandNewReceivedViewing(value),
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
