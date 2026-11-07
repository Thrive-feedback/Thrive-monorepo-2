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
  BRAND_NEW_WAITING_SORTS,
  type BrandNewWaitingSort,
  ROUTES,
} from '@/lib/routes.constant';

const SORT_NAMES: Readonly<Record<BrandNewWaitingSort, string>> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
};

export type WaitingSortProps = {
  sort: BrandNewWaitingSort;
};

/** The order of Waiting for me, kept in the address, as Home keeps its filter. */
export function WaitingSort({ sort }: WaitingSortProps) {
  const router = useRouter();
  const labelId = useId();

  function handleValueChange(value: string) {
    const chosen = BRAND_NEW_WAITING_SORTS.find((one) => one === value);
    if (chosen) {
      router.push(ROUTES.brandNewWaitingSorted(chosen));
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Beside the title a phone has room for the choice alone; a screen reader still hears this. */}
      <Text
        as="span"
        id={labelId}
        variant="body-2"
        tone="muted"
        className="sr-only md:not-sr-only"
      >
        Sort by
      </Text>
      <Select value={sort} onValueChange={handleValueChange}>
        <SelectTrigger variant="inline" aria-labelledby={labelId}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent fitsItems align="end">
          {BRAND_NEW_WAITING_SORTS.map((value) => (
            <SelectItem key={value} value={value}>
              {SORT_NAMES[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
