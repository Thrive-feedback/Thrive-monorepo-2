import type { ReadKudos } from '@/components/organisms/kudos-dialog/read-kudos.type';

/** One read of the board, newest first. */
export type KudosBoardPage = {
  readonly items: readonly ReadKudos[];
  /** Where the next page starts, or `null` on the last page. */
  readonly nextCursor: string | null;
};

/** How many Kudos one month holds. */
export type KudosBoardMonth = {
  /** `YYYY-MM`. */
  readonly month: string;
  readonly count: number;
};

/** The Workspace's Kudos counted, in all and by month, newest first. */
export type KudosBoardMonths = {
  readonly total: number;
  readonly months: readonly KudosBoardMonth[];
};
