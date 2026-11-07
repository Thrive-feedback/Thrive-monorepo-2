'use client';

import { useRouter } from 'next/navigation';
import { KUDOS_BOARD_ALL_MONTHS } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.constant';
import { kudosMonthName } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board-place.util';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/atoms/select';
import { ROUTES } from '@/lib/routes.constant';

export type KudosBoardMonthProps = {
  /** The month showing, or nothing for every month. */
  month: string | undefined;
  /** The months that hold a Kudos, newest first. */
  months: readonly string[];
};

/**
 * Which month the board shows, kept in the address, as Home keeps its filter. A month with no Kudos
 * is only offered when the address already asks for it, so the filter can say what is showing.
 */
export function KudosBoardMonth({ month, months }: KudosBoardMonthProps) {
  const router = useRouter();
  const offered =
    month && !months.includes(month) ? [month, ...months] : months;

  function handleValueChange(value: string) {
    router.push(
      value === KUDOS_BOARD_ALL_MONTHS
        ? ROUTES.kudos
        : ROUTES.kudosMonth(value),
    );
  }

  return (
    <Select
      value={month ?? KUDOS_BOARD_ALL_MONTHS}
      onValueChange={handleValueChange}
    >
      <SelectTrigger variant="inline" aria-label="Month">
        <SelectValue />
      </SelectTrigger>
      <SelectContent fitsItems align="end">
        <SelectItem value={KUDOS_BOARD_ALL_MONTHS}>All</SelectItem>
        {offered.map((each) => (
          <SelectItem key={each} value={each}>
            {kudosMonthName(each)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
