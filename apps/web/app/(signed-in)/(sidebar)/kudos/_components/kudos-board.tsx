import {
  KUDOS_BOARD_GRID,
  KUDOS_BOARD_READ_SIZE,
} from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.constant';
import {
  readKudosBoardMonths,
  readKudosBoardPage,
} from '@/app/(signed-in)/(sidebar)/kudos/_lib/kudos-board.service';
import { Skeleton } from '@/components/atoms/skeleton';
import { kudosTiltOf } from '@/components/organisms/kudos-dialog/read-kudos.util';
import { cn } from '@/lib/cn.util';
import type { CurrentMembership } from '@/lib/session/current-account.type';
import styles from './kudos-board.module.css';
import { KudosBoardEmpty } from './kudos-board-empty';
import { KudosBoardMonth } from './kudos-board-month';
import { KudosBoardPages } from './kudos-board-pages';

export type KudosBoardProps = {
  membership: CurrentMembership;
  /** The month to show, or nothing for every month. */
  month: string | undefined;
};

/**
 * The board's first read, and how many Kudos there are. The pages are keyed by the Kudos they start with,
 * so a new one starts the board again at its first page, wherever it had got to.
 */
export async function KudosBoard({ membership, month }: KudosBoardProps) {
  const [firstPage, { total, months }] = await Promise.all([
    readKudosBoardPage(membership, month),
    readKudosBoardMonths(membership),
  ]);
  const [newest] = firstPage.items;
  if (!newest) {
    return <KudosBoardEmpty month={month} />;
  }

  return (
    <KudosBoardPages
      key={newest.id}
      month={month}
      firstPage={firstPage}
      count={
        month
          ? (months.find((each) => each.month === month)?.count ?? 0)
          : total
      }
    />
  );
}

/** The board while it is read: whole cards in the same two rows, and the row the bar will sit in. */
export function KudosBoardSkeleton() {
  return (
    <>
      <div className={styles.board}>
        <div className={styles.track}>
          <div className={cn(KUDOS_BOARD_GRID, styles.page)}>
            {Array.from({ length: KUDOS_BOARD_READ_SIZE }, (_, place) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholders have nothing to tell them apart, and none moves.
              <div key={place} className={styles.card}>
                <div
                  className={styles.fit}
                  style={{ rotate: `${kudosTiltOf(`place-${place}`)}deg` }}
                >
                  <Skeleton
                    shape="card"
                    className="aspect-3/4 h-auto rounded-element"
                  />
                </div>
                <div
                  className={cn(
                    'mt-2 flex h-6 items-center justify-center gap-1',
                    styles.fit,
                  )}
                >
                  <Skeleton shape="circle" className="size-6" />
                  <Skeleton className="w-10" />
                  <Skeleton shape="circle" className="size-6" />
                  <Skeleton className="w-10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="min-h-11" />
    </>
  );
}

export type KudosBoardMonthFilterProps = KudosBoardProps;

/** The filter, read apart from the board, so it stays put while another month is read. */
export async function KudosBoardMonthFilter({
  membership,
  month,
}: KudosBoardMonthFilterProps) {
  const { months } = await readKudosBoardMonths(membership);
  return (
    <KudosBoardMonth month={month} months={months.map((each) => each.month)} />
  );
}

/** Stands in for the filter, as wide as the longest month it might say. */
export function KudosBoardMonthFilterSkeleton() {
  return <Skeleton className="h-10 w-40 rounded-input" />;
}
