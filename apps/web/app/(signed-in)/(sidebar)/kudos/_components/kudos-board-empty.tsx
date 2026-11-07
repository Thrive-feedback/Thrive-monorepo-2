import Link from 'next/link';
import { kudosMonthName } from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board-place.util';
import { Button } from '@/components/atoms/button';
import { Text } from '@/components/atoms/text';
import { ROUTES } from '@/lib/routes.constant';

export type KudosBoardEmptyProps = {
  /** The month asked for, or nothing for every month. */
  month: string | undefined;
};

/** A board with nothing on it: one place left for the first card, as the pin board leaves one. */
export function KudosBoardEmpty({ month }: KudosBoardEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <div
        aria-hidden="true"
        className="mb-3 aspect-3/4 w-28 -rotate-2 rounded-element border border-border-default border-dashed"
      />
      <Text as="h2" variant="subtitle-handwrite-1">
        {month
          ? `Nothing here from ${kudosMonthName(month)}`
          : 'Nothing on the board yet'}
      </Text>
      {month ? (
        <Button asChild>
          <Link href={ROUTES.kudos}>See every month</Link>
        </Button>
      ) : (
        <Text as="p" variant="body-2" tone="muted">
          The first Kudos anyone gives lands here.
        </Text>
      )}
    </div>
  );
}
