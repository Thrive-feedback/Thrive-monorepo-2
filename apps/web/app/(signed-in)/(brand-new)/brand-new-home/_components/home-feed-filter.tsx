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
import {
  BRAND_NEW_HOME_SHOWS,
  type BrandNewHomeShow,
  ROUTES,
} from '@/lib/routes.constant';

const SHOW_NAMES: Readonly<Record<BrandNewHomeShow, string>> = {
  all: 'All Feedback',
  everyone: 'Everyone in the Workspace',
  shared: 'Shared with me',
};

export type HomeFeedFilterProps = {
  show: BrandNewHomeShow;
};

/** What the feed shows, kept in the address: a dropdown, not tabs or chips (design `D-016`). */
export function HomeFeedFilter({ show }: HomeFeedFilterProps) {
  const router = useRouter();
  const labelId = useId();

  function handleValueChange(value: string) {
    const chosen = BRAND_NEW_HOME_SHOWS.find((one) => one === value);
    if (chosen) {
      router.push(ROUTES.brandNewHomeShowing(chosen));
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Text as="span" id={labelId} variant="body-2" tone="muted">
        Show
      </Text>
      <div className="w-full md:w-70">
        <Select value={show} onValueChange={handleValueChange}>
          <SelectTrigger aria-labelledby={labelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BRAND_NEW_HOME_SHOWS.map((value) => (
              <SelectItem key={value} value={value}>
                {SHOW_NAMES[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
