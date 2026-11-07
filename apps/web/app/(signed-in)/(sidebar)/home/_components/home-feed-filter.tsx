'use client';

import { useRouter } from 'next/navigation';
import { useId } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { Text } from '@/components/atoms/text';
import { HOME_SHOWS, type HomeShow, ROUTES } from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<HomeShow, string>> = {
  all: 'All Feedback',
  everyone: 'Everyone in the Workspace',
  shared: 'Shared with me',
};

export type HomeFeedFilterProps = {
  show: HomeShow;
};

/** What the feed shows, kept in the address: a dropdown, not tabs or chips (design `D-016`). */
export function HomeFeedFilter({ show }: HomeFeedFilterProps) {
  const router = useRouter();
  const labelId = useId();

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
        <SelectTrigger variant="inline" aria-labelledby={labelId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent fitsItems align="end">
          {HOME_SHOWS.map((value) => (
            <SelectItem key={value} value={value}>
              {SHOW_NAMES[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
