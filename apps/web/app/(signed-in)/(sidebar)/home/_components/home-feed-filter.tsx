'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId } from 'react';
import { SHARED_COUNT_SAID } from '@/app/(signed-in)/(sidebar)/_lib/shared-count-said.constant';
import { CountBadge, CountSaid } from '@/components/atoms/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';
import {
  useNavigationCountActions,
  useNavigationCounts,
} from '@/components/organisms/notifications-provider';
import { HOME_SHOWS, type HomeShow, ROUTES } from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<HomeShow, string>> = {
  all: 'All Feedback',
  everyone: 'Everyone in the Workspace',
  shared: 'Shared with me',
};

export type HomeFeedFilterProps = {
  show: HomeShow;
};

/**
 * What the feed shows, kept in the address: a dropdown, not tabs or chips (design `D-016`).
 *
 * Shared with me carries how much has been newly shared with the person since they last chose
 * it, on its item and, while another choice is showing, on the dropdown itself, so it is seen
 * without opening it. Choosing it is what clears it, and reads the bell lines that lead to it —
 * All holds the same Feedback among everything else, and clears nothing. Marked from the browser
 * once the choice is on screen, rather than while the server draws the page: a link prefetched
 * ahead of a press draws it too.
 */
export function HomeFeedFilter({ show }: HomeFeedFilterProps) {
  const router = useRouter();
  const labelId = useId();
  const countId = useId();
  const { shared } = useNavigationCounts();
  const { markPlaceOpened } = useNavigationCountActions();
  const sharedOnTheTrigger = show === 'shared' ? 0 : shared;

  useEffect(() => {
    if (show === 'shared') {
      markPlaceOpened('shared');
    }
  }, [show, markPlaceOpened]);

  function handleValueChange(value: string) {
    const chosen = HOME_SHOWS.find((one) => one === value);
    if (chosen) {
      router.push(ROUTES.homeShowing(chosen));
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Text as="span" id={labelId} variant="body-2" tone="muted">
        Show
      </Text>
      <Select value={show} onValueChange={handleValueChange}>
        <SelectTrigger
          variant="inline"
          aria-labelledby={`${labelId} ${countId}`}
        >
          {/* Named here rather than copied from the chosen item: an item's text carries its count,
              which the button draws on its own only while another choice is showing. */}
          <SelectValue>{SHOW_NAMES[show]}</SelectValue>
          <CountBadge count={sharedOnTheTrigger} said={null} />
          <span id={countId}>
            <CountSaid count={sharedOnTheTrigger} said={SHARED_COUNT_SAID} />
          </span>
        </SelectTrigger>
        <SelectContent fitsItems align="end">
          {HOME_SHOWS.map((value) => (
            <SelectItem key={value} value={value}>
              {SHOW_NAMES[value]}
              {/* Inside the item's text, where the item's own gap does not reach. */}
              {value === 'shared' && (
                <CountBadge count={shared} className="ml-2" />
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
